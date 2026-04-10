import { CreateMeetingInput, UpdateMeetingInput } from "../../types";
import { dataSource } from "../../datasource";
import {
  Business,
  Deal,
  Meeting,
  Notification,
  Offer,
  Role,
  Terms,
  User,
  Setting,
} from "../../entity";
import { authenticate } from "../../utils/authUtils";
import { DealStatus, MeetingStatus } from "../../enum";
import { Between, In, IsNull, Not } from "typeorm";
import { pubsub } from "../../server";
import FormData from "form-data";
import axios from "axios";
import { calculateCommission } from "./offerResolver";
import { sendEmail } from "../../services/emailService";
import { baseEmailTemplate } from "../../utils/emailTemplates";
import puppeteer from "puppeteer";
import { logger } from "../../utils/logger";

const meetingRepo = dataSource.getRepository(Meeting);
const businessRepo = dataSource.getRepository(Business);
const offerRepo = dataSource.getRepository(Offer);
const userRepo = dataSource.getRepository(User);
const notificationRepository = dataSource.getRepository(Notification);
const dealRepo = dataSource.getRepository(Deal);
const termRepo = dataSource.getRepository(Terms);
const roleRepo = dataSource.getRepository(Role);
const settingRepository = dataSource.getRepository(Setting);

const getLatestSetting = async (): Promise<Setting> => {
  const setting = await settingRepository.findOne({
    where: { id: Not(IsNull()) },
    order: { createdAt: "DESC" },
  });
  if (!setting) throw new Error("Settings not found");
  return setting;
};

const meetingResolver = {
  Query: {
    getMeetingsByBusiness: async (
      _: any,
      {
        businessId,
        limit,
        offset,
      }: { businessId: string; limit: number; offset: number },
    ) => {
      const [items, totalCount] = await meetingRepo.findAndCount({
        where: { business: { id: businessId } },
        order: { createdAt: "DESC" },
        relations: ["uploadedBy"],
        skip: offset,
        take: limit,
      });

      return { items, totalCount };
    },
    getMeetings: async (
      _: any,
      {
        id,
        filter,
        search,
        limit,
        offset,
      }: {
        id: string;
        filter?: "SENT" | "RECEIVED" | "PENDING" | "SCHEDULED";
        search?: string;
        limit: number;
        offset: number;
      },
    ) => {
      const query = meetingRepo
        .createQueryBuilder("meeting")
        .leftJoinAndSelect("meeting.requestedTo", "requestedTo")
        .orderBy("meeting.createdAt", "DESC")
        .take(limit)
        .skip(offset);

      // FILTERS
      if (filter) {
        if (filter === "SENT") {
          query.where("meeting.createdBy = :id", { id });
        } else if (filter === "RECEIVED") {
          const user = await userRepo.findOne({
            where: { id },
            relations: ["business"],
          });
          if (!user) throw new Error("User not found");

          const businessIds = (user.businesses ?? []).map((b) => b.id);
          const page = Math.floor(offset / limit) + 1; // Calculate the current page
          if (businessIds.length === 0)
            return { meetings: [], total: 0, page, pageSize: limit };

          query.where("meeting.userBusinessId IN (:...businessIds)", {
            businessIds,
          }); // Adjust field name as needed
        } else if (filter === "PENDING") {
          query.where(
            "(meeting.createdBy = :id OR meeting.userBusinessId = :id)",
            { id },
          );
          query.andWhere("meeting.isApproved = false");
        } else if (filter === "SCHEDULED") {
          query.where(
            "(meeting.createdBy = :id OR meeting.userBusinessId = :id)",
            { id },
          );
          query.andWhere("meeting.isApproved = true");
        }
      }

      // SEARCH
      if (search) {
        query.andWhere("LOWER(meeting.title) LIKE :search", {
          search: `%${search.toLowerCase()}%`,
        });
      }

      const [items, totalCount] = await query.getManyAndCount();

      return { items, totalCount };
    },
    getMySentMeetingRequests: async (
      _: any,
      {
        isBuyer,
        search,
        limit,
        offset,
      }: {
        isBuyer?: boolean;
        search?: string;
        limit?: number;
        offset?: number;
      },
      context: any,
    ) => {
      const ctxUser = await authenticate(context);
      const userId = ctxUser.userId;
      let query = meetingRepo
        .createQueryBuilder("meeting")
        .leftJoinAndSelect("meeting.business", "business")
        .leftJoinAndSelect("business.seller", "seller")
        .leftJoinAndSelect("meeting.requestedTo", "requestedTo") // recipient
        .leftJoinAndSelect("meeting.offer", "offer")
        .where("meeting.createdBy = :userId", { userId }) // IMPORTANT: createdBy is the sender
        .andWhere("meeting.status = :status", {
          status: MeetingStatus.REQUESTED,
        });

      if (search?.trim()) {
        query = query.andWhere("business.businessTitle ILIKE :search", {
          search: `%${search.trim()}%`,
        });
      }

      if (isBuyer === true) {
        // I acted as buyer when creating the meeting (seller is not me or seller is null)
        query = query.andWhere(
          "(seller.id IS NULL OR seller.id <> :userId::uuid)",
          { userId },
        );
      } else if (isBuyer === false) {
        // I acted as seller when creating the meeting
        query = query.andWhere("seller.id = :userId::uuid", { userId });
      }

      const totalCount = await query.getCount();
      const qb = query.orderBy("meeting.createdAt", "DESC");
      if (offset) qb.skip(offset);
      if (limit) qb.take(limit);
      const items = await qb.getMany();
      return { items, totalCount };
    },
    getReceivedMeetingRequests: async (
      _: any,
      {
        isBuyer,
        search,
        limit,
        offset,
      }: { isBuyer: boolean; search?: string; limit: number; offset: number },
      context: any,
    ) => {
      const ctxUser = await authenticate(context);

      let query = meetingRepo
        .createQueryBuilder("meeting")
        .leftJoinAndSelect("meeting.requestedTo", "requestedTo")
        .leftJoinAndSelect("meeting.requestedBy", "requestedBy")
        .leftJoinAndSelect("meeting.business", "business")
        .leftJoinAndSelect("business.seller", "seller")
        .leftJoinAndSelect("meeting.offer", "offer")
        .andWhere("meeting.status = :status", {
          status: MeetingStatus.REQUESTED,
        })
        .andWhere("requestedTo.id = :userId", { userId: ctxUser.userId });

      if (search && search.trim().length > 0) {
        query = query.andWhere("business.businessTitle ILIKE :search", {
          search: `%${search.trim()}%`,
        });
      }
      if (isBuyer === true) {
        query = query.andWhere(
          "(seller.id IS NULL OR seller.id <> :userId::uuid)",
          { userId: ctxUser.userId },
        );
      } else if (isBuyer === false) {
        query = query.andWhere("seller.id = :userId::uuid", {
          userId: ctxUser.userId,
        });
      }
      const totalCount = await query.getCount();
      const qb = query.orderBy("meeting.createdAt", "DESC");

      if (offset) qb.skip(offset);
      if (limit) qb.take(limit);
      const items = await qb.getMany();

      return { items, totalCount };
    },
    getMeetingsReadyForScheduling: async (
      _: any,
      {
        isBuyer,
        search,
        limit,
        offset,
      }: { isBuyer: boolean; search?: string; limit: number; offset: number },
      context: any,
    ) => {
      const ctxUser = await authenticate(context);
      let query = meetingRepo
        .createQueryBuilder("meeting")
        .leftJoinAndSelect("meeting.requestedTo", "requestedTo")
        .leftJoinAndSelect("meeting.requestedBy", "requestedBy")
        .leftJoinAndSelect("meeting.business", "business")
        .leftJoinAndSelect("business.seller", "seller")
        .leftJoinAndSelect("meeting.offer", "offer")
        .where(
          "(meeting.requestedById = :userId::uuid OR meeting.requestedToId = :userId::uuid)",
          { userId: ctxUser?.userId },
        )
        .andWhere("meeting.requestedDate IS NOT NULL")
        .andWhere("meeting.receiverAvailabilityDate IS NOT NULL")
        .andWhere("meeting.status = :status", {
          status: MeetingStatus.ACCEPTED,
        });

      if (search) {
        query = query.andWhere("business.businessTitle ILIKE :search", {
          search: `%${search}%`,
        });
      }

      if (isBuyer) {
        // buyer should not see own businesses
        query = query.andWhere("seller.id != :userId::uuid", {
          userId: ctxUser?.userId,
        });
      } else {
        // seller should only see own businesses
        query = query.andWhere("seller.id = :userId::uuid", {
          userId: ctxUser?.userId,
        });
      }

      const totalCount = await query.getCount();

      const qb = query.orderBy("meeting.createdAt", "DESC");

      if (offset) qb.skip(offset);
      if (limit) qb.take(limit);

      const items = await qb.getMany();
      return { items, totalCount };
    },
    getScheduledMeetings: async (
      _: any,
      {
        isBuyer,
        search,
        limit,
        offSet,
      }: { isBuyer: boolean; search?: string; limit: number; offSet: number },
      context: any,
    ) => {
      const ctxUser = await authenticate(context);
      if (!ctxUser?.userId) {
        throw new Error("Unauthorized");
      }

      // Base query with joins we need
      const baseQb = meetingRepo
        .createQueryBuilder("meeting")
        .leftJoinAndSelect("meeting.requestedTo", "requestedTo")
        .leftJoinAndSelect("meeting.requestedBy", "requestedBy")
        .leftJoinAndSelect("meeting.offer", "offer")
        .leftJoinAndSelect("meeting.business", "business")
        .leftJoinAndSelect("business.seller", "seller")
        .where("meeting.status IN (:...statuses)", {
          statuses: ["APPROVED", "HELD", "RESCHEDULED", "TIMELAPSED"],
        });

      // Search filter (optional) - search against business.businessTitle (ILIKE for case-insensitive)
      if (search && search.trim().length > 0) {
        baseQb.andWhere("business.businessTitle ILIKE :search", {
          search: `%${search.trim()}%`,
        });
      }

      // This prevents showing meetings to users who are not involved.
      baseQb.andWhere(
        "(requestedBy.id = :userId OR requestedTo.id = :userId)",
        { userId: ctxUser.userId },
      );

      // Role-based seller/buyer filter (keeps your original idea but now scoped to participant)
      if (isBuyer) {
        // Buyer → exclude meetings where seller is current user (buyer should not be the seller)
        baseQb.andWhere("seller.id != :userId", { userId: ctxUser.userId });
      } else {
        // Seller view → only meetings where seller is current user
        baseQb.andWhere("seller.id = :userId", { userId: ctxUser.userId });
      }

      const totalCount = await baseQb.getCount();

      const items = await baseQb
        .orderBy("meeting.createdAt", "DESC")
        .skip(offSet || 0)
        .take(limit || 10)
        .getMany();

      return { items, totalCount };
    },
    getAdminPendingMeetings: async (
      _: any,
      {
        search,
        status,
        limit,
        offset,
      }: {
        search?: string;
        status?: MeetingStatus;
        limit?: number;
        offset?: number;
      },
    ) => {
      let query = meetingRepo
        .createQueryBuilder("meeting")
        .leftJoinAndSelect("meeting.requestedTo", "requestedTo")
        .leftJoinAndSelect("meeting.requestedBy", "requestedBy")
        .leftJoinAndSelect("meeting.business", "business")
        .leftJoinAndSelect("business.seller", "seller")
        .leftJoinAndSelect("meeting.offer", "offer")
        .where("meeting.status IN (:...statuses)", {
          statuses: [MeetingStatus.ACCEPTED],
        });

      if (status) {
        query = query.andWhere("meeting.status = :status", { status });
      }

      if (search) {
        query = query.andWhere("business.businessTitle ILIKE :search", {
          search: `%${search}%`,
        });
      }

      query = query.orderBy("meeting.createdAt", "DESC");

      // Get total count BEFORE pagination
      const totalCount = await query.getCount();

      // Apply pagination
      if (offset) query = query.skip(offset);
      if (limit) query = query.take(limit);

      const items = await query.getMany();
      return { items, totalCount };
    },
    getAdminCancelMeetings: async (
      _: any,
      {
        search,
        limit,
        offset,
      }: {
        search?: string;
        limit?: number;
        offset?: number;
      },
    ) => {
      let query = meetingRepo
        .createQueryBuilder("meeting")
        .leftJoinAndSelect("meeting.requestedTo", "requestedTo")
        .leftJoinAndSelect("meeting.requestedBy", "requestedBy")
        .leftJoinAndSelect("meeting.business", "business")
        .leftJoinAndSelect("business.seller", "seller")
        .leftJoinAndSelect("meeting.offer", "offer")
        .where("meeting.status IN (:...statuses)", {
          statuses: [MeetingStatus.CANCELED],
        });

      if (search) {
        query = query.andWhere("business.businessTitle ILIKE :search", {
          search: `%${search}%`,
        });
      }

      query = query.orderBy("meeting.createdAt", "DESC");

      // Get total count BEFORE pagination
      const totalCount = await query.getCount();

      // Apply pagination
      if (offset) query = query.skip(offset);
      if (limit) query = query.take(limit);

      const items = await query.getMany();
      return { items, totalCount };
    },
    getAdminScheduledMeetings: async (
      _: any,
      {
        search,
        status,
        limit,
        offset,
      }: {
        search?: string;
        status?: "APPROVED" | "HELD" | "RESCHEDULED" | "TIMELAPSED";
        limit?: number;
        offset?: number;
      },
    ) => {
      let query = meetingRepo
        .createQueryBuilder("meeting")
        .leftJoinAndSelect("meeting.requestedTo", "requestedTo")
        .leftJoinAndSelect("meeting.requestedBy", "requestedBy")
        .leftJoinAndSelect("meeting.business", "business")
        .leftJoinAndSelect("business.seller", "seller")
        .leftJoinAndSelect("meeting.offer", "offer")
        .andWhere("meeting.status IN (:...scheduledStatuses)", {
          scheduledStatuses: [
            MeetingStatus.APPROVED,
            MeetingStatus.HELD,
            MeetingStatus.RESCHEDULED,
            MeetingStatus.TIMELAPSED,
          ],
        });

      if (status) {
        query = query.andWhere("meeting.status = :status", { status });
      }

      if (search) {
        query = query.andWhere("business.businessTitle ILIKE :search", {
          search: `%${search}%`,
        });
      }
      query = query.orderBy("meeting.createdAt", "DESC");

      const totalCount = await query.getCount();
      if (limit) query = query.take(limit);
      if (offset) query = query.skip(offset);
      const items = await query.getMany();
      return { items, totalCount };
    },
    getAdminMeetingCounts: async () => {
      const today = new Date();
      const startOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      );
      const endOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + 1,
      );

      const todayMeetings = await meetingRepo.count({
        where: {
          requestedDate: Between(startOfDay, endOfDay),
          status: In([MeetingStatus.APPROVED, MeetingStatus.HELD]),
        },
      });

      const totalScheduleMeetings = await meetingRepo.count({
        where: {
          status: In([MeetingStatus.APPROVED, MeetingStatus.HELD]),
        },
      });

      const totalPendingMeetings = await meetingRepo.count({
        where: {
          status: MeetingStatus.ACCEPTED,
        },
      });
      return {
        todayMeetings,
        totalScheduleMeetings,
        totalPendingMeetings,
      };
    },
    getBuyerCount: async (_: any, __: any, context: any) => {
      const ctxUser = await authenticate(context);
      const count = await meetingRepo.count({
        where: {
          requestedTo: { id: ctxUser.userId },
        },
      });
      return count;
    },
    getSellerCount: async (_: any, __: any, context: any) => {
      const ctxUser = await authenticate(context);
      const count = await meetingRepo.count({
        where: {
          business: { seller: { id: ctxUser.userId } },
        },
      });
      return count;
    },
    checkMeetingExists: async (
      _: any,
      { businessId, buyerId }: { businessId: string; buyerId: string },
    ) => {
      const meeting = await meetingRepo.find({
        where: {
          business: { id: businessId },
          createdBy: buyerId,
          status: Not(In(["REJECTED", "CANCELED"])),
        },
      });

      if (meeting.length === 0) {
        return false;
      }

      return true;
    },
  },
  Mutation: {
    requestMeeting: async (
      _: any,
      { input }: { input: CreateMeetingInput },
      context: any,
    ) => {
      const ctxUser = await authenticate(context);

      // ── Meeting time window validation ──────────────────────────────────────
      // Saudi time = UTC+3
      // Sun–Fri (day 0–5): 4:30 PM – 11:00 PM
      // Sat   (day 6):     2:00 PM – 11:00 PM
      if (input.requestedDate) {
        const meetingUtc = new Date(input.requestedDate);
        // Shift to Saudi local time (UTC+3) for day-of-week and clock check
        const saudiMs   = meetingUtc.getTime() + 3 * 60 * 60 * 1000;
        const saudiLocal = new Date(saudiMs);
        const saudiDay   = saudiLocal.getUTCDay();  // 0=Sun … 6=Sat
        const saudiH     = saudiLocal.getUTCHours();
        const saudiM     = saudiLocal.getUTCMinutes();
        const totalMin   = saudiH * 60 + saudiM;

        const isSat    = saudiDay === 6;
        const minAllow = isSat ? 14 * 60 : 16 * 60 + 30; // 2:00 PM or 4:30 PM
        const maxAllow = 23 * 60;                          // 11:00 PM

        if (totalMin < minAllow || totalMin > maxAllow) {
          throw new Error(
            "MEETING_TIME_INVALID: Selected time is outside the allowed meeting hours. | الوقت المحدد خارج نطاق أوقات الاجتماعات المسموح بها."
          );
        }
      }
      // ────────────────────────────────────────────────────────────────────────

      // find business
      const business = await businessRepo.findOne({
        where: { id: input.businessId },
        relations: ["seller"], // include seller relation
      });
      if (!business) throw new Error("Business not found");

      // find users
      const user = await userRepo.findOne({ where: { id: ctxUser?.userId } });
      if (!user) throw new Error("User not found");

      const businessOwner = await userRepo.findOne({
        where: { id: business?.seller.id },
      });
      if (!businessOwner) throw new Error("Business owner not found");

      // find offer (include createdBy for buyer check)
      const offer = input.offerId
        ? await offerRepo.findOne({
            where: {
              id: input.offerId,
              business: { id: input.businessId },
            },
            relations: ["meetings"],
          })
        : null;

      if (offer?.meetings && offer.meetings.length > 0) {
        return offer.meetings[0];
      }

      // check existing meeting
      const existingMeeting = await meetingRepo.findOne({
        where: {
          business: { id: business.id },
          offerId: input.offerId,
          status: Not(In([MeetingStatus.REJECTED, MeetingStatus.CANCELED])),
          createdBy: ctxUser.userId,
        },
        relations: ["requestedTo", "business"],
      });

      if (existingMeeting) {
        return existingMeeting; // return instead of creating new
      }

      // requestedTo logic
      let requestedTo: any = businessOwner;
      if (ctxUser.userId === businessOwner.id) {
        if (!offer?.createdBy) {
          throw new Error("Offer buyer (createdBy) not found");
        }
        requestedTo = offer.createdBy;
      }

      // create meeting
      const meeting = meetingRepo.create({
        business,
        requestedDate: new Date(input.requestedDate),
        requestedEndDate: input.requestedEndDate
          ? new Date(input.requestedEndDate)
          : undefined,
        status: MeetingStatus.REQUESTED,
        offerId: input.offerId,
        createdBy: ctxUser.userId,
        requestedBy: user,
        requestedTo,
      });

      const savedMeeting = await meetingRepo.save(meeting);

      // notify seller
      if (business.seller) {
        const sellerNotification = notificationRepository.create({
          name: "New Meeting Request",
          message: `A new meeting has been requested for your business: ${business.businessTitle}`,
          user: business.seller,
        });
        const savedSellerNotification =
          await notificationRepository.save(sellerNotification);
        await pubsub.publish("NEW_NOTIFICATION", {
          newNotification: savedSellerNotification,
        });
      }
      const buyer = requestedTo.id === business.seller.id ? user : requestedTo;

      if (buyer && buyer.id !== business.seller.id) {
        const buyerNotification = notificationRepository.create({
          name: "New Meeting Request",
          message: `Your meeting request for business: ${business.businessTitle} has been sent successfully.`,
          user: buyer,
        });
        const savedBuyerNotification =
          await notificationRepository.save(buyerNotification);
        await pubsub.publish("NEW_NOTIFICATION", {
          newNotification: savedBuyerNotification,
        });
      }

      const role = await roleRepo.findOne({ where: { name: Not("Customer") } });

      // notify admins
      const admins = await userRepo.find({
        where: { role: { id: role?.id }, isDeleted: false },
      });

      for (const admin of admins) {
        const adminNotification = notificationRepository.create({
          name: "New Meeting Request",
          message: `A new meeting has been requested for business: ${business.businessTitle}`,
          user: admin,
        });
        const savedAdminNotification =
          await notificationRepository.save(adminNotification);
        await pubsub.publish("NEW_NOTIFICATION", {
          newNotification: savedAdminNotification,
        });
      }

      return savedMeeting;
    },
    updateMeeting: async (
      _: any,
      { input }: { input: UpdateMeetingInput },
      context: any,
    ) => {
      try {
        // const ctxUser = await authenticate(context)
        const meeting = await meetingRepo.findOne({
          where: { id: input.id },
          relations: [
            "business",
            "offer",
            "business.seller",
            "requestedBy",
            "requestedTo",
          ],
        });
        if (!meeting) throw new Error("Meeting not found");

        // if meeting is being marked as Reject then also update offer status to REJECTED
        if (
          input.status === MeetingStatus.REJECTED ||
          (input.status === MeetingStatus.CANCELED && meeting.offerId)
        ) {
          const offer = await offerRepo.findOne({
            where: { id: meeting.offerId },
          });
          if (offer) {
            offer.status = "REJECTED";
            await offerRepo.save(offer);
          }
        }
        if (input.status === MeetingStatus.HELD) {
          let offer: any = null;

          if (meeting.offer) {
            offer = await offerRepo.findOne({
              where: { id: meeting.offer.id },
              relations: ["buyer"],
            });
          }

          let finalOffer = offer;

          const setting = await getLatestSetting();
          const commissionRate = parseFloat(setting.commissionRate) / 100;
          const offerPrice = input.offerPrice ?? finalOffer?.price ?? 0;
          const commissionForOffer = calculateCommission(
            offerPrice,
            commissionRate,
          );

          if (!finalOffer) {
            const seller = meeting.business.seller;
            if (!seller) throw new Error("Business seller not found");

            if (meeting.requestedTo.id === seller.id) {
              const buyer = await userRepo.findOne({
                where: { id: meeting.createdBy },
              });
              if (!buyer) throw new Error("Buyer not found");

              finalOffer = offerRepo.create({
                business: meeting.business,
                buyer,
                price: input.offerPrice,
                status: "ACCEPTED",
                commission: commissionForOffer,
                createdBy: meeting.createdBy,
              });
            } else {
              const buyer = await userRepo.findOne({
                where: { id: meeting.requestedTo.id },
              });
              if (!buyer) throw new Error("Buyer not found");

              finalOffer = offerRepo.create({
                business: meeting.business,
                buyer,
                price: input.offerPrice,
                status: "ACCEPTED",
                commission: commissionForOffer,
                createdBy: meeting.requestedTo.id,
              });
            }

            await offerRepo.save(finalOffer); // 💡 save the new offer
            meeting.offer = finalOffer;
            meeting.offerId = finalOffer.id;
          } else {
            finalOffer.price = input.offerPrice;
            finalOffer.commission = commissionForOffer;
            finalOffer.status = "ACCEPTED";
            await offerRepo.save(finalOffer);
          }

          // create Deal
          const deal = await dealRepo.create({
            offer: finalOffer,
            business: meeting.business,
            buyer: finalOffer?.buyer,
            price: finalOffer?.price,
            status: DealStatus.COMMISSION_TRANSFER_FROM_BUYER_PENDING,
          });

          const latestDSATerms = await termRepo.findOne({
            where: { dsaTerms: Not(IsNull()) },
            order: { createdAt: "DESC" },
          });

          const commission = commissionForOffer;
          const arabicLatestDSATerms = await termRepo.findOne({
            where: { arabicDsaTerms: Not(IsNull()) },
            order: { createdAt: "DESC" },
          });
          const placeholderData = {
            buyerName: deal?.buyer?.name,
            sellerName: meeting?.business?.seller?.name,
            businessName: meeting?.business?.businessTitle,
            offerPrice: deal?.price?.toString(),
            commission: commission.toFixed(2),
            date: new Date().toLocaleDateString("en-GB"),
          };
          if (latestDSATerms) {
            const rawContent = latestDSATerms.dsaTerms.content;
            const replaced = replacePlaceholders(rawContent, placeholderData);
            const finalHtml = wrapHtml(replaced);
            const pdfBuffer = await generatePdfBuffer(finalHtml);
            const formData = new FormData();
            formData.append("file", pdfBuffer, {
              filename: `nda-${deal.id}.pdf`,
              contentType: "application/pdf",
            });

            const uploadRes = await axios.post(
              "https://verify.jusoor-sa.co/upload",
              formData,
              { headers: formData.getHeaders() },
            );

            deal.ndaPdfPath = uploadRes.data.fileUrl;
          }

          if (arabicLatestDSATerms) {
            const rawContent = arabicLatestDSATerms.arabicDsaTerms.content;

            const replaced = replacePlaceholders(rawContent, placeholderData);
            const finalHtml = wrapHtml(replaced);

            const pdfBuffer = await generatePdfBuffer(finalHtml);

            const formData = new FormData();
            formData.append("file", pdfBuffer, {
              filename: `arabic_nda-${deal.id}.pdf`,
              contentType: "application/pdf",
            });

            const uploadRes = await axios.post(
              "https://verify.jusoor-sa.co/upload",
              formData,
              { headers: formData.getHeaders() },
            );

            deal.arabicNdaPdfPath = uploadRes.data.fileUrl;
          }

          await dealRepo.save(deal);

          // Update business to prevent further activation/inactivation
          meeting.business.isAbleInActive = false;
          await businessRepo.save(meeting.business);

          // Notify the business seller
          const sellerNotification = notificationRepository.create({
            name: "New Deal",
            message: `A deal has been created for your business: ${meeting.business.businessTitle}`,
            user: meeting.business.seller, // Assuming 'seller' relation exists
          });
          const savedSellerNotification =
            await notificationRepository.save(sellerNotification);
          await pubsub.publish("NEW_NOTIFICATION", {
            newNotification: savedSellerNotification,
          });

          // in app notification to buyer
          const buyerNotification = notificationRepository.create({
            name: "New Deal",
            message: `A deal has been created for your offer on business: ${meeting.business.businessTitle}`,
            user: deal.buyer,
          });
          const savedBuyerNotification =
            await notificationRepository.save(buyerNotification);
          await pubsub.publish("NEW_NOTIFICATION", {
            newNotification: savedBuyerNotification,
          });

          const sellerHtml = baseEmailTemplate({
            title: " ",
            message: `
              <p>Dear <strong>${
                meeting.business.seller.name || "Seller"
              }</strong>,</p>

              <p>A new deal has been successfully created on Jusoor.</p>

              <p>You may now proceed with the next steps as outlined on the platform.</p>

              <p>Jusoor shortens the path.</p>

              <p style="margin-top:24px;">
                Warm regards,<br />
                <strong>Jusoor Team</strong>
              </p>
            `,
          });

          const buyerHtml = baseEmailTemplate({
            title: " ",
            message: `
              <p>Dear <strong>${deal.buyer.name || "Buyer"}</strong>,</p>

              <p>A new deal has been successfully created on Jusoor.</p>

              <p>You may now proceed with the next steps as outlined on the platform.</p>

              <p>Jusoor shortens the path.</p>

              <p style="margin-top:24px;">
                Warm regards,<br />
                <strong>Jusoor Team</strong>
              </p>
            `,
          });

          await sendEmail({
            to: meeting.business.seller.email,
            subject: "Deal Creation",
            html: sellerHtml,
          });

          await sendEmail({
            to: deal.buyer.email,
            subject: "Deal Creation",
            html: buyerHtml,
          });

          // Notify all admins
          const admins = await userRepo.find({
            where: {
              isDeleted: false,
              role: { name: Not("Customer") },
            },
          });

          for (const admin of admins) {
            const adminNotification = notificationRepository.create({
              name: "New Deal",
              message: `A user created a new deal for business: ${meeting.business.businessTitle}`,
              user: admin,
            });
            const savedAdminNotification =
              await notificationRepository.save(adminNotification);
            await pubsub.publish("NEW_NOTIFICATION", {
              newNotification: savedAdminNotification,
            });
            const adminHtml = baseEmailTemplate({
              title: " ",
              message: `
                <p>Dear Admin,</p>

                <p>A new deal has been successfully created on Jusoor.</p>

                <p>Jusoor shortens the path.</p>

                <p>Regards,<br />Jusoor System</p>
              `,
              actionText: "View Deals",
              actionUrl: `https://jusoor-sa.co/admin/businessdeal`,
            });

            await sendEmail({
              to: admin.email,
              subject: "Deal Creation",
              html: adminHtml,
            });
          }
        }
        Object.assign(meeting, input);
        const updatedMeeting = await meetingRepo.save(meeting);
        if (
          input.status === MeetingStatus.APPROVED ||
          input.status === MeetingStatus.RESCHEDULED
        ) {
          const isApproved = input.status === MeetingStatus.APPROVED;

          const subject = isApproved
            ? "Meeting Approved"
            : "Meeting Rescheduled";

          const seller = meeting.business.seller;
          const sellerId = seller.id;

          const requestedBy = meeting.requestedBy;
          const requestedTo = meeting.requestedTo;

          const buyer = requestedBy.id === sellerId ? requestedTo : requestedBy;

          const meetingDate = meeting.adminAvailabilityDate
            ? new Date(meeting.adminAvailabilityDate)
            : null;

          // also add the in app notifation for seller and buyer here
          const sellerNotification = notificationRepository.create({
            name: subject,
            message: `Your meeting for business: ${meeting.business.businessTitle} has been ${
              isApproved ? "approved" : "rescheduled"
            }.`,
            user: seller,
          });
          const savedSellerNotification =
            await notificationRepository.save(sellerNotification);
          await pubsub.publish("NEW_NOTIFICATION", {
            newNotification: savedSellerNotification,
          });

          const buyerNotification = notificationRepository.create({
            name: subject,
            message: `Your meeting for business: ${meeting.business.businessTitle} has been ${
              isApproved ? "approved" : "rescheduled"
            }.`,
            user: buyer,
          });
          const savedBuyerNotification =
            await notificationRepository.save(buyerNotification);
          await pubsub.publish("NEW_NOTIFICATION", {
            newNotification: savedBuyerNotification,
          });

          const dateString = meetingDate
            ? meetingDate.toLocaleDateString("en-SA", {
                timeZone: "Asia/Riyadh", // Forces KSA Time
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : "Date to be confirmed";

          const timeString = meetingDate
            ? meetingDate.toLocaleTimeString("en-SA", {
                timeZone: "Asia/Riyadh", // Forces KSA Time
                hour: "2-digit",
                minute: "2-digit",
                hour12: true, // Shows AM/PM
              })
            : "Time to be confirmed";

          const linkHtml = meeting.meetingLink
            ? `<a href="${meeting.meetingLink}">${meeting.meetingLink}</a>`
            : "Link will be shared separately.";

          const sellerMessage = isApproved
            ? `
                <p>Dear <strong>${seller.name}</strong>,</p>

                <p>A meeting has been scheduled on Jusoor.</p>

                <p>Date: ${dateString}<br />
                Time: ${timeString}<br />
                Meeting Link: ${linkHtml}</p>

                <p>Please ensure your availability at the scheduled time.</p>

                <p>Jusoor shortens the path.</p>

                <p style="margin-top:24px;">
                  Warm regards,<br />
                  <strong>Jusoor Team</strong>
                </p>
              `
            : `
                <p>Dear <strong>${seller.name}</strong>,</p>

                <p>Please note that the previously scheduled meeting on Jusoor has been rescheduled.</p>

                <p>Updated Date: ${dateString}<br />
                Updated Time: ${timeString}<br />
                Meeting Link: ${linkHtml}</p>

                <p>Thank you for your flexibility.</p>

                <p>Jusoor shortens the path.</p>

                <p style="margin-top:24px;">
                  Warm regards,<br />
                  <strong>Jusoor Team</strong>
                </p>
              `;

          const buyerMessage = isApproved
            ? `
                <p>Dear <strong>${buyer.name}</strong>,</p>

                <p>A meeting has been scheduled on Jusoor.</p>

                <p>Date: ${dateString}<br />
                Time: ${timeString}<br />
                Meeting Link: ${linkHtml}</p>

                <p>Please ensure your availability at the scheduled time.</p>

                <p>Jusoor shortens the path.</p>

                <p style="margin-top:24px;">
                  Warm regards,<br />
                  <strong>Jusoor Team</strong>
                </p>
              `
            : `
                <p>Dear <strong>${buyer.name}</strong>,</p>

                <p>Please note that the previously scheduled meeting on Jusoor has been rescheduled.</p>

                <p>Updated Date: ${dateString}<br />
                Updated Time: ${timeString}<br />
                Meeting Link: ${linkHtml}</p>

                <p>Thank you for your flexibility.</p>

                <p>Jusoor shortens the path.</p>

                <p style="margin-top:24px;">
                  Warm regards,<br />
                  <strong>Jusoor Team</strong>
                </p>
              `;

          const adminMessage = isApproved
            ? `
                <p>Dear Admin,</p>

                <p>A meeting has been scheduled on Jusoor.</p>

                <p>Date: ${dateString}<br />
                Time: ${timeString}<br />
                Meeting Link: ${linkHtml}</p>

                <p>Please ensure your availability at the scheduled time.</p>

                <p>Jusoor shortens the path.</p>

                <p style="margin-top:24px;">
                  Warm regards,<br />
                  <strong>Jusoor Team</strong>
                </p>
              `
            : `
                <p>Dear Admin,</p>

                <p>Please note that the previously scheduled meeting on Jusoor has been rescheduled.</p>

                <p>Updated Date: ${dateString}<br />
                Updated Time: ${timeString}<br />
                Meeting Link: ${linkHtml}</p>

                <p>Thank you for your flexibility.</p>

                <p>Jusoor shortens the path.</p>

                <p style="margin-top:24px;">
                  Warm regards,<br />
                  <strong>Jusoor Team</strong>
                </p>
              `;

          // seller
          await sendEmail({
            to: meeting.business.seller.email,
            subject,
            html: baseEmailTemplate({
              title: " ",
              message: sellerMessage,
            }),
          });

          // buyer
          await sendEmail({
            to: buyer.email,
            subject,
            html: baseEmailTemplate({
              title: " ",
              message: buyerMessage,
            }),
          });
          const admins = await userRepo.find({
            where: {
              isDeleted: false,
              role: { name: Not("Customer") },
            },
          });

          for (const admin of admins) {
            const adminNotification = notificationRepository.create({
              name: subject,
              message: adminMessage,
              user: admin,
            });
            const savedAdminNotification =
              await notificationRepository.save(adminNotification);
            await pubsub.publish("NEW_NOTIFICATION", {
              newNotification: savedAdminNotification,
            });
            // 📧 Email to admin
            await sendEmail({
              to: admin.email,
              subject: subject,
              html: baseEmailTemplate({
                title: " ",
                message: adminMessage,
              }),
            });
          }
        }
        return updatedMeeting;
      } catch (error) {
        throw `Error on Updating:${error}`;
      }
    },
    approveMeeting: async (
      _: any,
      { meetingId, offerId }: { meetingId: string; offerId: string },
      context: any,
    ) => {
      const ctxUser = await authenticate(context);
      if (!ctxUser) throw new Error("Unauthorized");
      const meeting = await meetingRepo.findOne({
        where: { id: meetingId },
        relations: ["business"],
      });
      if (!meeting) throw new Error("Meeting not found");

      if (meeting.business.seller.id !== ctxUser.userId) {
        throw new Error("Only the seller can approve meetings.");
      }

      meeting.status = MeetingStatus.APPROVED;
      meeting.updatedAt = new Date();
      await meetingRepo.save(meeting);
      return true;
    },
    rejectMeeting: async (
      _: any,
      { meetingId }: { meetingId: string },
      context: any,
    ) => {
      const ctxUser = await authenticate(context);
      if (!ctxUser) throw new Error("Unauthorized");
      const meeting = await meetingRepo.findOne({
        where: { id: meetingId },
        relations: ["business"],
      });
      if (!meeting) throw new Error("Meeting not found");

      if (meeting.offerId) {
        const offer = await offerRepo.findOne({
          where: { id: meeting.offerId },
        });
        if (offer) {
          offer.status = "REJECTED";
          await offerRepo.save(offer);
        }
      }

      meeting.status = MeetingStatus.REJECTED;
      meeting.updatedAt = new Date();
      await meetingRepo.save(meeting);
      return true;
    },
  },
};

export default meetingResolver;

function replacePlaceholders(content: string, data: any): string {
  return content
    .replace(/{{buyerName}}/g, `<span dir="ltr">${data.buyerName || ""}</span>`)
    .replace(
      /{{sellerName}}/g,
      `<span dir="ltr">${data.sellerName || ""}</span>`,
    )
    .replace(
      /{{businessName}}/g,
      `<span dir="ltr">${data.businessName || ""}</span>`,
    )
    .replace(
      /{{offerPrice}}/g,
      `<span dir="ltr">${data.offerPrice || ""}</span>`,
    )
    .replace(
      /{{commission}}/g,
      `<span dir="ltr">${data.commission || ""}</span>`,
    )
    .replace(/{{date}}/g, `<span dir="ltr">${data.date || ""}</span>`);
}

function wrapHtml(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />

  <link href="https://fonts.googleapis.com/css2?family=Cairo&display=swap" rel="stylesheet">

  <style>
    body {
      font-family: 'Cairo', sans-serif;
      font-size: 14px;
      line-height: 1.6;
    }

    .ql-direction-rtl {
      direction: rtl;
      text-align: right;
    }
  </style>
</head>
<body>
  ${content}
</body>
</html>
`;
}

async function generatePdfBuffer(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });

  const buffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: {
      top: "20mm",
      bottom: "20mm",
      left: "15mm",
      right: "15mm",
    },
  });

  await browser.close();
  return Buffer.from(buffer);
}
