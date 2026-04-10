import { CreateDealInput, DealFilter, UpdateDealInput } from "../../types";
import { dataSource } from "../../datasource";
import {
  Business,
  Deal,
  Meeting,
  Offer,
  Notification,
  User,
  Bank,
  DealBank,
} from "../../entity";
import { authenticate } from "../../utils/authUtils";
import { NotificationActionType } from "../../entity/Notification";
import { Between, ILike, In, Not } from "typeorm";
import { DealStatus, MeetingStatus, BusinessStatus } from "../../enum";
import { pubsub } from "../../server";
import { sendEmail } from "../../services/emailService";
import { baseEmailTemplate } from "../../utils/emailTemplates";
import document from "../schema/document";
import business from "../schema/business";

const dealRepo = dataSource.getRepository(Deal);
const offerRepo = dataSource.getRepository(Offer);
const meetingRepo = dataSource.getRepository(Meeting);
const businessRepo = dataSource.getRepository(Business);
const notificationRepository = dataSource.getRepository(Notification);
const userRepo = dataSource.getRepository(User);
const bankRepo = dataSource.getRepository(Bank);
const dealBankRepo = dataSource.getRepository(DealBank);

const dealResolver = {
  Query: {
    getDeals: async (
      _: any,
      {
        limit,
        offset,
        search,
        status,
        dealType,
      }: {
        limit: number;
        offset: number;
        search: string;
        status: string;
        dealType?: "completed" | "canceled" | "inprogress";
      },
    ) => {
      let where: any = { isDeleted: false };

      // Handle dealType filter (completed, canceled, inprogress)
      if (dealType) {
        if (dealType === "completed") {
          where.status = DealStatus.COMPLETED;
        } else if (dealType === "canceled") {
          where.status = DealStatus.CANCEL;
        } else if (dealType === "inprogress") {
          where.status = Not(In([DealStatus.COMPLETED, DealStatus.CANCEL]));
        }
      } else if (status) {
        const normalizedStatus = status.trim().toUpperCase();

        if (normalizedStatus === "COMMISSION VERIFICATION PENDING") {
          where = {
            ...where,
            isCommissionVerified: false,
            status: DealStatus.COMMISSION_VERIFICATION_PENDING,
          };
        } else if (normalizedStatus === "DSA FROM SELLER PENDING") {
          where = {
            ...where,
            isDsaSeller: false,
            status: DealStatus.DSA_FROM_SELLER_PENDING,
          };
        } else if (normalizedStatus === "DSA FROM BUYER PENDING") {
          where = {
            ...where,
            isDsaBuyer: false,
            status: DealStatus.DSA_FROM_BUYER_PENDING,
          };
        } else if (
          normalizedStatus === "SELLER PAYMENT VERIFICATION PENDING" ||
          normalizedStatus === "COMMISSION_TRANSFER_FROM_BUYER_PENDING"
        ) {
          where = {
            ...where,
            isPaymentVerifiedBuyer: false,
            status: DealStatus.SELLER_PAYMENT_VERIFICATION_PENDING,
          };
        } else if (
          normalizedStatus === "PAYMENT APPROVAL FROM SELLER PENDING"
        ) {
          where = {
            ...where,
            isPaymentVerifiedSeller: false,
            status: DealStatus.BUYER_PAYMENT_PENDING,
          };
        } else if (normalizedStatus === "DOCUMENT CONFIRMATION") {
          where = {
            ...where,
            isDocVerifiedBuyer: false,
            status: DealStatus.DOCUMENT_UPLOAD_PENDING,
          };
        } else if (normalizedStatus === "DEAL TO FINAL PENDING") {
          where = {
            ...where,
            isSellerCompleted: true,
            isBuyerCompleted: true,
            status: DealStatus.PENDING,
          };
        }
      }

      // Filter by search (nested relation)
      if (search && search.trim() !== "") {
        where.business = { businessTitle: ILike(`%${search}%`) };
      }

      const [deals, totalCount] = await dealRepo.findAndCount({
        where,
        relations: [
          "offer",
          "business",
          "business.seller",
          "buyer",
          "business.documents",
        ],
        take: limit,
        skip: offset,
        order: { createdAt: "DESC" },
      });

      return { deals, totalCount };
    },
    getBuyerInprogressDeals: async (
      _: any,
      {
        limit,
        offset,
        search,
      }: { limit: number; offset: number; search: string },
      context: any,
    ) => {
      const ctxUser = await authenticate(context);
      const whereCondition: any = {
        buyer: { id: ctxUser?.userId },
        status: Not(DealStatus.COMPLETED),
      };
      if (search && search.trim() !== "") {
        // Add condition for business title LIKE %search%
        whereCondition.business = {
          businessTitle: ILike(`%${search}%`),
        };
      }
      const [deals, totalCount] = await dealRepo.findAndCount({
        where: whereCondition,
        take: limit,
        skip: offset,
        order: { createdAt: "DESC" },
        relations: ["offer", "business", "business.seller"],
      });
      return { deals, totalCount };
    },
    getSellerInprogressDeals: async (
      _: any,
      {
        limit,
        offset,
        search,
      }: { limit: number; offset: number; search: string },
      context: any,
    ) => {
      const ctxUser = await authenticate(context);
      const whereCondition: any = {
        business: { createdBy: ctxUser?.userId },
        status: Not(DealStatus.COMPLETED),
      };

      if (search && search.trim() !== "") {
        whereCondition.business = {
          ...whereCondition.business,
          businessTitle: ILike(`%${search}%`),
        };
      }
      const [deals, totalCount] = await dealRepo.findAndCount({
        where: whereCondition,
        take: limit,
        skip: offset,
        order: { createdAt: "DESC" },
        relations: ["offer", "business", "buyer"],
      });
      return { deals, totalCount };
    },
    getBuyerCompletedDeals: async (
      _: any,
      {
        limit,
        offset,
        search,
      }: { limit: number; offset: number; search: string },
      context: any,
    ) => {
      const ctxUser = await authenticate(context);
      const whereCondition: any = {
        buyer: { id: ctxUser?.userId },
        status: DealStatus.COMPLETED,
      };
      if (search && search.trim() !== "") {
        // Add condition for business title LIKE %search%
        whereCondition.business = {
          businessTitle: ILike(`%${search}%`),
        };
      }
      const [deals, totalCount] = await dealRepo.findAndCount({
        where: whereCondition,
        take: limit,
        skip: offset,
        order: { createdAt: "DESC" },
        relations: ["offer", "business", "business.seller"],
      });
      return { deals, totalCount };
    },
    getSellerCompletedDeals: async (
      _: any,
      {
        limit,
        offset,
        search,
      }: { limit: number; offset: number; search: string },
      context: any,
    ) => {
      const ctxUser = await authenticate(context);
      const whereCondition: any = {
        business: { createdBy: ctxUser?.userId },
        status: DealStatus.COMPLETED,
      };

      if (search && search.trim() !== "") {
        whereCondition.business = {
          ...whereCondition.business,
          businessTitle: ILike(`%${search}%`),
        };
      }
      const [deals, totalCount] = await dealRepo.findAndCount({
        where: whereCondition,
        take: limit,
        skip: offset,
        order: { createdAt: "DESC" },
        relations: ["offer", "business", "buyer"],
      });
      return { deals, totalCount };
    },
    getDeal: async (_: any, { id }: { id: string }) => {
      return await dealRepo.findOne({
        where: { id },
        relations: [
          "offer",
          "business",
          "business.seller",
          "buyer",
          "business.documents",
        ],
      });
    },
    getFinanceCount: async (_: any, __: any) => {
      const businessesPrice = await businessRepo
        .createQueryBuilder("business")
        .select("SUM(business.price)", "totalPrice")
        .where(
          "business.isDeleted = false AND business.businessStatus = :status",
          { status: BusinessStatus.SOLD },
        )
        .getRawOne();

      const totalPrice = businessesPrice?.totalPrice || 0;
      const completedDeals = await dealRepo.find({
        where: { status: DealStatus.COMPLETED, isDeleted: false },
        relations: ["offer", "business", "buyer"],
      });
      // Use locked commission from offer (set at offer creation time)
      const revenueGenerated = completedDeals.reduce(
        (acc, deal) => acc + Number(deal.offer?.commission ?? 0),
        0,
      );

      // get completed deal of this month
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const completedDealsThisMonth = completedDeals.filter((deal) => {
        const dealDate = new Date(deal.createdAt);
        return (
          dealDate.getMonth() === currentMonth &&
          dealDate.getFullYear() === currentYear
        );
      });
      const thisMonthRevenue = completedDealsThisMonth.reduce(
        (acc, deal) => acc + Number(deal.offer?.commission ?? 0),
        0,
      );
      return { totalPrice, revenueGenerated, thisMonthRevenue };
    },
    getRenenueGraph: async (_: any, { year }: { year: number }) => {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31);

      const completedDeals = await dealRepo.find({
        where: {
          status: DealStatus.COMPLETED,
          createdAt: Between(startDate, endDate),
          isDeleted: false,
        },
        relations: ["offer", "business", "buyer"],
      });

      const monthlyRevenue = Array(12).fill(0);
      let totalRevenue = 0;
      completedDeals.forEach((deal) => {
        // Use locked commission from offer (set at offer creation time)
        const revenue = Number(deal.offer?.commission ?? 0);
        const month = new Date(deal.createdAt).getMonth();
        monthlyRevenue[month] += revenue;
        totalRevenue += revenue;
      });

      return {
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        graphData: monthlyRevenue.map((revenue, index) => ({
          month: index + 1,
          revenue: parseFloat(revenue.toFixed(2)),
        })),
      };
    },
    getCompletedDeals: async (
      _: any,
      {
        limit,
        offset,
        filter,
      }: { limit: number; offset: number; filter: DealFilter },
    ) => {
      let where: any = { status: DealStatus.COMPLETED, isDeleted: false };

      if (filter) {
        if (filter.search && filter.search.trim() !== "") {
          where.business = { businessTitle: ILike(`%${filter.search}%`) };
        }
        if (filter.startDate && filter.endDate) {
          where.createdAt = Between(
            new Date(filter.startDate),
            new Date(filter.endDate),
          );
        }
      }

      const totalCount = await dealRepo.count({ where });

      const deals = await dealRepo.find({
        where,
        take: limit,
        skip: offset,
        order: { createdAt: "DESC" },
        relations: ["offer", "business", "buyer", "business.seller"],
      });

      // Attach commission to each deal — use the locked amount from the offer
      const dealsWithCommission = deals.map((deal) => ({
        ...deal,
        commission: Number(deal.offer?.commission ?? 0),
      }));

      return {
        deals: dealsWithCommission,
        totalCount,
      };
    },
    getBankDetailsByDealId: async (_: any, { dealId }: { dealId: string }) => {
      return await dealBankRepo.find({
        where: { deal: { id: dealId } },
        relations: ["deal", "bank"], // include Deal and Bank
      });
    },
  },
  Mutation: {
    createDeal: async (_: any, { input }: { input: CreateDealInput }) => {
      // Load offer with buyer + business (needed when no meetingId is provided)
      const offer = await offerRepo.findOne({
        where: { id: input.offerId },
        relations: ["buyer", "business", "business.seller"],
      });
      if (!offer) throw new Error("Offer not found");

      // meetingId is optional — fall back to offer.business if not provided
      let dealBusiness = offer.business;
      if (input.meetingId) {
        const meeting = await meetingRepo.findOne({
          where: { id: input.meetingId },
          relations: ["business", "business.seller"],
        });
        if (meeting?.business) dealBusiness = meeting.business;
      }

      if (!dealBusiness) throw new Error("Business not found");

      const deal = await dealRepo.create({
        offer,
        business: dealBusiness,
        buyer: offer.buyer,
        price: offer.price,
      });
      dealBusiness.isAbleInActive = false;
      await businessRepo.save(dealBusiness);

      const savedDeal = await dealRepo.save(deal);

      // ✅ Get all banks of seller
      const sellerBanks = await bankRepo.find({
        where: { user: dealBusiness.seller },
      });

      // ✅ Create DealBank records
      const dealBankEntities = sellerBanks.map((bank) =>
        dealBankRepo.create({
          deal: savedDeal,
          isSend: false, // default
        }),
      );

      await dealBankRepo.save(dealBankEntities);

      // Notify the business seller
      const sellerNotification = notificationRepository.create({
        name: "New Deal",
        message: `A deal has been created for your business: ${dealBusiness.businessTitle}`,
        user: dealBusiness.seller,
        entityType: 'deal',
        entityId: savedDeal.id,
        actionType: NotificationActionType.VIEW_DEALS,
      });
      const savedSellerNotification =
        await notificationRepository.save(sellerNotification);
      await pubsub.publish("NEW_NOTIFICATION", {
        newNotification: savedSellerNotification,
      });
      const sellerHtml = baseEmailTemplate({
        title: " ",
        message: `
          <p>Dear <strong>${
            dealBusiness.seller.name || "Seller"
          }</strong>,</p>

          <p>A new deal has been successfully created on Jusoor.</p>

          <p>You may now proceed with the next steps as outlined on the platform.</p>

          <p>Jusoor shortens the path.</p>

          <p style="margin-top:24px;">
            Warm regards,<br />
            <strong>Jusoor Team</strong>
          </p>
        `,
        actionText: "View Deal",
        actionUrl: `https://jusoor-sa.co/profiledashboard`,
      });

      await sendEmail({
        to: dealBusiness.seller.email,
        subject: "Deal Creation",
        html: sellerHtml,
      });

      // Notify the buyer
      const buyerNotification = notificationRepository.create({
        name: "New Deal",
        message: `A deal has been created against business: ${dealBusiness.businessTitle} by admin`,
        user: offer.buyer,
        entityType: 'deal',
        entityId: savedDeal.id,
        actionType: NotificationActionType.VIEW_DEALS,
      });
      const savedBuyerNotification =
        await notificationRepository.save(buyerNotification);
      await pubsub.publish("NEW_NOTIFICATION", {
        newNotification: savedBuyerNotification,
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
          message: `A user created a new deal for business: ${dealBusiness.businessTitle}`,
          user: admin,
        });
        const savedAdminNotification =
          await notificationRepository.save(adminNotification);
        await pubsub.publish("NEW_NOTIFICATION", {
          newNotification: savedAdminNotification,
        });
        for (const admin of admins) {
          const adminHtml = baseEmailTemplate({
            title: " ",
            message: `
              <p>Dear Admin,</p>

              <p>A new deal has been successfully created on Jusoor.</p>

              <p>Jusoor shortens the path.</p>

              <p>Regards,<br />Jusoor System</p>
            `,
            actionText: "View Deals",
            actionUrl: `https://admin.jusoor-sa.co/businessdeal`,
          });

          await sendEmail({
            to: admin.email,
            subject: "Deal Creation",
            html: adminHtml,
          });
        }
      }

      return await dealRepo.save(deal);
    },
    updateDeal: async (_: any, { input }: { input: UpdateDealInput }, context: any) => {
      const authUser = await authenticate(context);
      if (!authUser) throw new Error("Unauthorized");

      const deal = await dealRepo.findOne({
        where: { id: input.id },
        relations: [
          "buyer",
          "business",
          "business.seller",
          "business.documents",
        ],
      });
      if (!deal) throw new Error("Deal not found");

      // Ownership check: only the buyer, the seller, or an admin may update
      const isBuyer  = deal.buyer?.id === authUser.userId;
      const isSeller = deal.business?.seller?.id === authUser.userId;
      const isAdmin  = authUser.role && authUser.role !== 'Customer';
      if (!isBuyer && !isSeller && !isAdmin) {
        throw new Error("Unauthorized: you are not a party to this deal");
      }

      // Seller submitted DSA
      if (input.status === DealStatus.DSA_FROM_SELLER_PENDING) {
        if (deal.status === DealStatus.DSA_FROM_BUYER_PENDING) {
          deal.status = DealStatus.BUYER_PAYMENT_PENDING;
        } else {
          deal.status = DealStatus.DSA_FROM_BUYER_PENDING;
        }
      }

      // Buyer submitted DSA
      else if (input.status === DealStatus.DSA_FROM_BUYER_PENDING) {
        if (deal.status === DealStatus.DSA_FROM_SELLER_PENDING) {
          deal.status = DealStatus.BUYER_PAYMENT_PENDING;
        } else {
          deal.status = DealStatus.DSA_FROM_SELLER_PENDING;
        }
      } else if (input.status === DealStatus.BUYERCOMPLETED) {
        if (deal.status === DealStatus.WAITING) {
          deal.status = DealStatus.BUYERCOMPLETED;
        } else if (deal.status === DealStatus.SELLERCOMPLETED) {
          deal.status = DealStatus.PENDING;
        }
      } else if (input.status === DealStatus.SELLERCOMPLETED) {
        if (deal.status === DealStatus.WAITING) {
          deal.status = DealStatus.SELLERCOMPLETED;
        } else if (deal.status === DealStatus.BUYERCOMPLETED) {
          deal.status = DealStatus.PENDING;
        }
      } else if (input.status === DealStatus.CANCEL) {
        businessRepo
          .findOne({ where: { id: deal.business.id } })
          .then(async (business) => {
            if (business) {
              business.isAbleInActive = true;
              await businessRepo.save(business);
            }
          });
        deal.status = DealStatus.CANCEL;
        const offer = await offerRepo.findOne({
          where: { id: deal.offer.id },
          relations: ["business", "buyer", "business.seller"],
        });
        if (offer) {
          offer.status = "REJECTED";
          await offerRepo.save(offer);
        }
        const meetings = await meetingRepo.find({
          where: { offer: { id: deal.offer.id } },
        });
        for (const meeting of meetings) {
          meeting.status = MeetingStatus.CANCELED;
          await meetingRepo.save(meeting);
        }
        // in-app notification to seller and buyer
        const sellerNotification = notificationRepository.create({
          name: "Deal Canceled",
          message: `Your deal for business: ${deal.business.businessTitle} has been canceled.`,
          user: deal.business.seller,
        });
        const savedSellerNotification =
          await notificationRepository.save(sellerNotification);
        await pubsub.publish("NEW_NOTIFICATION", {
          newNotification: savedSellerNotification,
        });

        const buyerNotification = notificationRepository.create({
          name: "Deal Canceled",
          message: `Your deal for business: ${deal.business.businessTitle} has been canceled.`,
          user: deal.buyer,
        });
        const savedBuyerNotification =
          await notificationRepository.save(buyerNotification);
        await pubsub.publish("NEW_NOTIFICATION", {
          newNotification: savedBuyerNotification,
        });

        // Email to seller
        if (offer?.business?.seller?.email) {
          await sendEmail({
            to: offer?.business?.seller.email,
            subject: "Deal Canceled",
            html: baseEmailTemplate({
              title: " ",
              message: `
                <p>Dear ${offer?.business?.seller.name || "Seller"},</p>
                <p>Your deal for <strong>${
                  deal.business.businessTitle
                }</strong> has been canceled with ${
                  offer?.buyer.name || "the buyer"
                }.</p>
                <p>Thank you for using Jusoor!</p>
              `,
            }),
          });
        }

        // Email to buyer
        if (offer?.buyer?.email) {
          await sendEmail({
            to: offer?.buyer.email,
            subject: "Deal Canceled",
            html: baseEmailTemplate({
              title: " ",
              message: `
                <p>Dear ${offer?.buyer.name || "Buyer"},</p>
                <p>Your deal for <strong>${
                  deal?.business.businessTitle
                }</strong> with ${
                  deal?.business?.seller?.name || "the seller"
                } has been canceled.</p>
                <p>Thank you for using Jusoor!</p>
              `,
            }),
          });
        }
      } else if (typeof input.status !== "undefined") {
        deal.status = input.status;
      }
      // if (input.buyerNote && deal.buyer.email) {
      //   await sendEmail({
      //     to: deal.buyer.email,
      //     subject: "Payment Issue Notification",
      //     html: baseEmailTemplate({
      //       title: "Payment Issue",
      //       message: `
      //         <p>Dear ${deal.buyer.name || "Buyer"},</p>
      //         <p>There was an issue with your payment.</p>
      //         <p><strong>Seller note:</strong> ${input.buyerNote}</p>
      //         <p>Please contact support if you need assistance.</p>
      //       `,
      //       actionText: "Contact Support",
      //       actionUrl: "https://jusoor-sa.co",
      //     }),
      //   });
      // }
      if (input.sellerNote && deal.buyer.email) {
        await sendEmail({
          to: deal.buyer.email,
          subject: "Deal Payment Status",
          html: baseEmailTemplate({
            title: " ",
            message: `
              <p>Dear <strong>${deal.buyer.name || "Buyer"}</strong>,</p>

              <p>The payment status for your deal on Jusoor has been updated.</p>

              <p>
                Please log in to the platform to review the latest status and take any required action.
              </p>

              <p><strong>Seller note:</strong> ${input.sellerNote}</p>

              <p>Jusoor shortens the path.</p>

              <p style="margin-top:24px;">
                Warm regards,<br />
                <strong>Jusoor Team</strong>
              </p>
            `,
          }),
        });
      }
      const hasPaymentReceipt = deal.business.documents.some((doc) => {
        const title = doc.title?.toLowerCase() || "";
        return (
          title.includes("buyer payment receipt") ||
          title.includes("إيصال دفع المشتري")
        );
      });

      if (
        hasPaymentReceipt &&
        deal.business?.seller?.email &&
        input.documentUploaded
      ) {
        await sendEmail({
          to: deal.business.seller.email,
          subject: "Deal Payment Status",
          html: baseEmailTemplate({
            title: " ",
            message: `
              <p>Dear <strong>${
                deal.business.seller.name || "Seller"
              }</strong>,</p>

              <p>The payment status for your deal on Jusoor has been updated.</p>

              <p>
                Please log in to the platform to review the latest status and take any required action.
              </p>

              <p>Jusoor shortens the path.</p>

              <p style="margin-top:24px;">
                Warm regards,<br />
                <strong>Jusoor Team</strong>
              </p>
            `,
          }),
        });
      }
      if (
        deal.isSellerCompleted &&
        deal.isBuyerCompleted &&
        input.status === DealStatus.COMPLETED
      ) {
        const seller = deal.business.seller;
        const buyer = deal.buyer;

        // Cancel all other offers for this business except the accepted one
        const otherOffers = await offerRepo.find({
          where: {
            business: { id: deal.business.id },
          },
        });

        for (const otherOffer of otherOffers) {
          if (
            otherOffer.id !== deal.offer.id &&
            otherOffer.status !== "REJECTED"
          ) {
            otherOffer.status = "REJECTED";
            await offerRepo.save(otherOffer);
          }
        }

        // Cancel all other meetings for this business except those linked to the accepted offer
        const otherMeetings = await meetingRepo.find({
          where: {
            business: { id: deal.business.id },
          },
        });

        for (const otherMeeting of otherMeetings) {
          if (
            otherMeeting.offerId !== deal.offer.id &&
            otherMeeting.status !== MeetingStatus.CANCELED &&
            otherMeeting.status !== MeetingStatus.REJECTED
          ) {
            otherMeeting.status = MeetingStatus.CANCELED;
            await meetingRepo.save(otherMeeting);
          }
        }

        // notify seller
        const sellerNotification = notificationRepository.create({
          name: "Deal Closed",
          message: `Your deal for business: ${deal.business.businessTitle} has been successfully closed.`,
          user: seller,
        });
        const savedSellerNotification =
          await notificationRepository.save(sellerNotification);
        await pubsub.publish("NEW_NOTIFICATION", {
          newNotification: savedSellerNotification,
        });

        // notify buyer
        const buyerNotification = notificationRepository.create({
          name: "Deal Closed",
          message: `Your deal for business: ${deal.business.businessTitle} has been successfully closed.`,
          user: buyer,
        });
        const savedBuyerNotification =
          await notificationRepository.save(buyerNotification);
        await pubsub.publish("NEW_NOTIFICATION", {
          newNotification: savedBuyerNotification,
        });

        // Email to seller
        if (seller?.email) {
          await sendEmail({
            to: seller.email,
            subject: "Deal Closed",
            html: baseEmailTemplate({
              title: " ",
              message: `
                <p>Dear <strong>${seller.name || "Seller"}</strong>,</p>

                <p>Congratulations 🎉</p>

                <p>
                  We're pleased to inform you that the deal related to your business on Jusoor has been successfully closed.
                </p>

                <p>
                  The transaction is now finalized, and all required steps have been completed.
                </p>

                <p>
                  We'd value your feedback on your experience with Jusoor. Your input helps us make the platform even better.
                </p>

                <p>Jusoor shortens the path.</p>

                <p style="margin-top:24px;">
                  Warm regards,<br />
                  <strong>Jusoor Team</strong>
                </p>
              `,
            }),
          });
        }

        // Email to buyer
        if (buyer?.email) {
          await sendEmail({
            to: buyer.email,
            subject: "Deal Closed",
            html: baseEmailTemplate({
              title: " ",
              message: `
                <p>Dear <strong>${buyer.name || "Buyer"}</strong>,</p>

                <p>Congratulations 🎉</p>

                <p>
                  Your deal on Jusoor has been successfully closed, and the ownership transfer has been completed in line with the agreed process.
                </p>

                <p>
                  We're glad to have supported you throughout the journey and wish you continued success as you move forward with your new venture.
                </p>

                <p>
                  We'd value your feedback on your experience with Jusoor. Your input helps us make the platform even better.
                </p>

                <p>Jusoor shortens the path.</p>

                <p style="margin-top:24px;">
                  Warm regards,<br />
                  <strong>Jusoor Team</strong>
                </p>
              `,
            }),
          });
        }

        // Email to admins
        const admins = await userRepo.find({
          where: { isDeleted: false, role: { name: Not("Customer") } },
        });

        for (const admin of admins) {
          if (admin.email) {
            await sendEmail({
              to: admin.email,
              subject: "Deal Closed",
              html: baseEmailTemplate({
                title: " ",
                message: `
                  <p>Dear Admin,</p>

                  <p>A deal on Jusoor has been successfully closed and finalized.</p>

                  <p>Regards,<br />Jusoor System</p>
                `,
                actionText: "View Deal",
                actionUrl: `https://admin.jusoor-sa.co/businessdeal/details/${deal.id}`,
              }),
            });
          }
        }
        for (const admin of admins) {
          const adminNotification = notificationRepository.create({
            name: "Deal Closed",
            message: `A deal for business: ${deal.business.businessTitle} has been successfully closed.`,
            user: admin,
          });
          const savedAdminNotification =
            await notificationRepository.save(adminNotification);
          await pubsub.publish("NEW_NOTIFICATION", {
            newNotification: savedAdminNotification,
          });
        }
      }

      const { status: _ignoredStatus, ...rest } = input;
      for (const [key, value] of Object.entries(rest)) {
        if (value !== undefined) {
          // @ts-ignore -- if using TS and index signature, or type properly
          deal[key] = value;
        }
      }
      return await dealRepo.save(deal);
    },
    deleteDeal: async (_: any, { id }: { id: string }) => {
      const deal = await dealRepo.findOne({ where: { id } });
      if (!deal) throw new Error("Deal not found");
      deal.isDeleted = true;
      await dealRepo.save(deal);
      return true;
    },
  },
};

export default dealResolver;
