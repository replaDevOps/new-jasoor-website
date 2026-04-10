import {
  User,
  Offer,
  Business,
  EndaAcceptance,
  Meeting,
  Bank,
  Notification,
  Setting,
} from "../../entity";
import { dataSource } from "../../datasource";
import { authenticate } from "../../utils/authUtils";
import { calculateCommission as calculateCommissionFromService } from "../../services/commissionService";
import { NotificationActionType } from "../../entity/Notification";
import {
  AcceptEndaInput,
  CreateOfferInput,
  UpdateOfferInput,
  CounterOfferInput,
} from "../../types";
import { Brackets, IsNull, Not } from "typeorm";
import { logger } from "../../utils/logger";
import { pubsub } from "../../server";
import { OfferStatus } from "enum";
import { sendEmail } from "../../services/emailService";
import { baseEmailTemplate } from "../../utils/emailTemplates";

// const roleRepository = dataSource.getRepository(Role);
const userRepository = dataSource.getRepository(User);
const offerRepository = dataSource.getRepository(Offer);
const businessRepository = dataSource.getRepository(Business);
const endaAcceptanceRepo = dataSource.getRepository(EndaAcceptance);
const meetingRepo = dataSource.getRepository(Meeting);
const bankRepository = dataSource.getRepository(Bank);
const notificationRepository = dataSource.getRepository(Notification);
const settingRepository = dataSource.getRepository(Setting);

const getLatestSetting = async (): Promise<Setting> => {
  const setting = await settingRepository.findOne({
    where: { id: Not(IsNull()) },
    order: { createdAt: "DESC" },
  });
  if (!setting) throw new Error("Settings not found");
  return setting;
};

const offerResolver = {
  Query: {
    getOffersByBusiness: async (
      _: any,
      { businessId }: { businessId: string }
    ) => {
      const offers = await offerRepository.find({
        where: { business: { id: businessId } },
        relations: ["buyer", "business", "counterOffers"],
        order: { createdAt: "DESC" },
      });
      return offers;
    },
    getOffersByUser: async (
      _: any,
      {
        status,
        search,
        limit,
        offSet,
        isProceedToPay,
      }: {
        limit: number;
        offSet: number;
        status?: string;
        search?: string;
        isProceedToPay: boolean;
      },
      context: any
    ) => {
      const user = await authenticate(context);
      const query = offerRepository
        .createQueryBuilder("offer")
        .leftJoinAndSelect("offer.business", "business")
        .leftJoinAndSelect("offer.buyer", "buyer")
        .leftJoinAndSelect("offer.counterOffers", "counterOffers")
        .leftJoinAndSelect("business.seller", "seller")
        .where("buyer.id = :userId", { userId: user?.userId });

      if (status) {
        query.andWhere("offer.status = :status", { status });
      }

      if (search) {
        query.andWhere("business.businessTitle ILIKE :search", {
          search: `%${search}%`,
        });
      }

      if (isProceedToPay === true || isProceedToPay === false) {
        query.andWhere("offer.isProceedToPay = :isProceedToPay", {
          isProceedToPay,
        });
      }

      // Order, pagination
      query.orderBy("offer.createdAt", "DESC");

      // ✅ Get both data and total count
      const [offers, count] = await query
        .skip(offSet ? Number(offSet) * Number(limit) : 0) // offSet = page index
        .take(limit ? Number(limit) : 10)
        .getManyAndCount();

      // ✅ Return object matching schema
      return {
        offers,
        count,
      };
    },
    getOffersBySeller: async (
      _: any,
      { status, search }: { status?: string; search?: string },
      context: any
    ) => {
      const user = await authenticate(context);

      const query = offerRepository
        .createQueryBuilder("offer")
        .leftJoinAndSelect("offer.business", "business")
        .leftJoinAndSelect("offer.buyer", "buyer")
        .leftJoinAndSelect("business.seller", "seller")
        .leftJoinAndSelect("offer.counterOffers", "counterOffers")
        .addSelect([
          "counterOffers.id",
          "counterOffers.price",
          "counterOffers.status",
        ])
        .where("seller.id = :userId", { userId: user?.userId });

      if (status) {
        query.andWhere("offer.status = :status", {
          status: status.toUpperCase(),
        });
      }

      if (search) {
        query.andWhere("business.businessTitle ILIKE :search", {
          search: `%${search.toLowerCase()}%`,
        });
      }

      query.orderBy("offer.createdAt", "DESC");

      const offers = await query.getMany();
      return offers;
    },
    getOffersById: async (_: any, { id }: { id?: string }, context: any) => {
      const ctxUser = await authenticate(context);
      logger.info(`ctxUser`, ctxUser?.userId);
      const offer = await offerRepository.findOne({
        where: { id },
        relations: [
          "buyer",
          "business",
          "meetings",
          "business.seller",
          "counterOffers",
        ],
      });
      if (offer?.business?.seller?.id) {
        const bank = (offer.business.seller.banks = await bankRepository.find({
          where: { user: { id: offer.business.seller.id }, isActive: true },
        }));
        logger.info(`bank ${bank}`);
      }

      return offer;
    },
    getOfferByBusinessId: async (
      _: any,
      {
        id,
        limit,
        offSet,
        search,
        status,
        isProceedToPay,
      }: {
        id: string;
        limit?: number;
        offSet?: number;
        search?: string;
        status?: OfferStatus;
        isProceedToPay?: boolean;
      }
    ) => {
      const business = await businessRepository.findOne({ where: { id } });
      if (!business) throw new Error("Business not found");
      const take = limit ? Number(limit) : 10;
      const skip = Number(offSet) * Number(limit);
      const qb = offerRepository
        .createQueryBuilder("offer")
        .leftJoinAndSelect("offer.buyer", "buyer")
        .leftJoinAndSelect("offer.business", "business")
        .leftJoinAndSelect("offer.parentOffer", "parentOffer")
        .leftJoinAndSelect("offer.counterOffers", "counterOffers")
        .leftJoinAndSelect("counterOffers.buyer", "counterBuyer")
        .leftJoinAndSelect("counterOffers.business", "counterBusiness")
        .where("business.id = :id", { id });

      if (search && search.trim().length > 0) {
        const s = search.trim();

        // Accept numbers with commas, ranges (min-max), and comparisons (>, >=, <, <=)
        const numberWithCommas = /\d[\d,]*(?:\.\d+)?/;
        const stripCommas = (v: string) => Number(v.replace(/,/g, ""));

        // Range: 1,000 - 5,000
        const rangeMatch = s.match(
          new RegExp(
            `^(${numberWithCommas.source})\s*-\s*(${numberWithCommas.source})$`
          )
        );
        if (rangeMatch) {
          const min = stripCommas(rangeMatch[1]);
          const max = stripCommas(rangeMatch[2]);
          qb.andWhere("CAST(business.price AS numeric) BETWEEN :min AND :max", {
            min,
            max,
          });
        } else {
          // Comparison: >1000, >= 1,000, <5000, <= 5,000
          const cmpMatch = s.match(
            new RegExp(`^(>=|<=|>|<)\s*(${numberWithCommas.source})$`)
          );
          if (cmpMatch) {
            const op = cmpMatch[1];
            const val = stripCommas(cmpMatch[2]);
            qb.andWhere(`CAST(business.price AS numeric) ${op} :val`, { val });
          } else if (numberWithCommas.test(s)) {
            // Exact numeric value
            const price = stripCommas(s);
            qb.andWhere("CAST(business.price AS numeric) = :price", { price });
          } else {
            // Text search on buyer name or price text
            qb.andWhere(
              new Brackets((qb2) => {
                qb2
                  .where("buyer.name ILIKE :textSearch")
                  .orWhere("CAST(business.price AS TEXT) ILIKE :textSearch");
              }),
              { textSearch: `%${s}%` }
            );
          }
        }
      }

      if (status) {
        qb.andWhere("offer.status = :status", { status });
      }
      qb.orderBy("offer.createdAt", "DESC");
      const allOffers = await qb.getMany();
      const finalOffers: Offer[] = [];
      for (const offer of allOffers) {
        if (offer.isProceedToPay) {
          finalOffers.push(offer);
          continue;
        }
        if (offer.parentOffer) {
          finalOffers.push(offer);
          continue;
        }
        if (offer.counterOffers?.length) {
          const latestCounter = offer.counterOffers.sort(
            (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
          )[0];
          finalOffers.push(latestCounter);
          continue;
        }
        finalOffers.push(offer);
      }
      const sortedOffers = finalOffers.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );
      const uniqueOffers = Array.from(
        new Map(sortedOffers.map((o) => [o.id, o])).values()
      );
      const filteredOffers =
        typeof isProceedToPay === "boolean"
          ? uniqueOffers.filter((o) => o.isProceedToPay === isProceedToPay)
          : uniqueOffers;
      const count = filteredOffers.length;
      const paginatedOffers = filteredOffers.slice(skip, skip + take);

      return { offers: paginatedOffers, count };
    },
    getEndaByBusinessId: async (
      _: any,
      { businessId }: { businessId: string },
      context: any
    ) => {
      const business = await businessRepository.findOneBy({ id: businessId });
      if (!business) {
        throw new Error("Business not found.");
      }

      const acceptances = await endaAcceptanceRepo.find({
        where: { business: { id: businessId } },
        relations: ["business", "user"], // optional, if you need related data
        order: { createdAt: "DESC" }, // optional, sort by date
      });

      return acceptances;
    },
    checkOfferExists: async (
      _: any,
      { businessId, buyerId }: { businessId: string; buyerId: string }
    ) => {
      const offer = await offerRepository.find({
        where: {
          business: { id: businessId },
          buyer: { id: buyerId },
          status: Not("REJECTED"),
        },
      });

      if (!offer) {
        return {
          exists: false,
          isProceedToPay: false,
        };
      }

      return {
        exists: offer.filter((o) => o.status !== "REJECTED").length > 0,
        isProceedToPay: offer.some((o) => o.isProceedToPay),
      };
    },
  },
  Mutation: {
    createOffer: async (
      _: any,
      { input }: { input: CreateOfferInput },
      context: any
    ) => {
      // Authenticate user
      const authUser = await authenticate(context);
      if (!authUser) throw new Error("Unauthorized");

      // Find buyer and business
      const buyer = await userRepository.findOne({
        where: { id: authUser.userId },
        relations: ["role"],
      });
      const business = await businessRepository.findOne({
        where: { id: input.businessId },
        relations: ["seller"],
      });

      if (!buyer) throw new Error("Buyer not found");
      if (!business) throw new Error("Business not found");

      logger.info(
        `Buyer found: ID=${buyer.id}, Name=${buyer.name}, Email=${buyer.email}`
      );

      // One-active-offer enforcement: buyer may only have ONE non-REJECTED offer per business
      const existingOffer = await offerRepository.findOne({
        where: {
          business: { id: input.businessId },
          buyer: { id: authUser.userId },
          status: Not("REJECTED"),
        },
      });

      if (existingOffer) return existingOffer; // Return existing live offer

      let offer: Offer;
      // Create the offer
      if (input.parentOfferId) {
        const parentOffer = await offerRepository.findOne({
          where: { id: input.parentOfferId },
        });
        if (!parentOffer) throw new Error("parentOffer not found");

        offer = offerRepository.create({
          ...input,
          buyer: parentOffer.buyer, // keep same buyer
          business: parentOffer.business,
          status: "PENDING",
          parentOffer: parentOffer, // <-- link to chain
          createdAt: new Date(),
          createdBy: authUser.userId, // optional field if you add "madeBy"
        });
      } else {
        offer = offerRepository.create({
          ...input,
          buyer,
          business,
          status: "PENDING",
          createdAt: new Date(),
          createdBy: authUser.userId, // optional field if you add "madeBy"
        });
      }

      // Lock commission at creation time using the bracket service
      const commissionResult = await calculateCommissionFromService(Number(offer.price));
      offer.commission = commissionResult.amount;
      const newOffer = await offerRepository.save(offer);

      // Notify the business seller
      if (business.seller) {
        const sellerNotification = notificationRepository.create({
          name: "New Offer Received",
          message: `A new offer has been made for your business: ${business.businessTitle}`,
          user: business.seller,
          entityType: 'offer',
          entityId: newOffer.id,
          actionType: NotificationActionType.VIEW_OFFERS,
        });
        const savedSellerNotification = await notificationRepository.save(
          sellerNotification
        );
        await pubsub.publish("NEW_NOTIFICATION", {
          newNotification: savedSellerNotification,
        });

        // Email to seller: New Offer Received
        if (business.seller.email) {
          const listingId = (business as any).reference || business.id;
          const sellerHtml = baseEmailTemplate({
            actionUrl: undefined,
            actionText: undefined,
            title: " ",
            message: `
              <p>Dear <strong>${business.seller.name || "Seller"}</strong>,</p>

              <p>You’ve received a new offer for your business listing on Jusoor.</p>

              <p>Listing Number: ${listingId}</p>

              <p>
                You may review the offer, respond to it, or schedule a meeting securely through the platform.
              </p>

              <p>Jusoor shortens the path.</p>

              <p style="margin-top:24px;">
                Warm regards,<br />
                <strong>Jusoor Team</strong>
              </p>
            `,
          });

          await sendEmail({
            to: business.seller.email,
            subject: "New Offer Received",
            html: sellerHtml,
          });
        }
      }

      // Notify buyer
      logger.info(
        `Creating notification for buyer: ${buyer.id}, name: ${buyer.name}`
      );
      const buyerNotification = notificationRepository.create({
        name: "Offer Submitted",
        message: `Your offer has been submitted against business: ${business.businessTitle}`,
        user: buyer,
        entityType: 'offer',
        entityId: newOffer.id,
        actionType: NotificationActionType.VIEW_OFFERS,
      });
      const savedBuyerNotification = await notificationRepository.save(
        buyerNotification
      );
      logger.info(
        `Buyer notification saved with ID: ${savedBuyerNotification.id}, user ID: ${savedBuyerNotification.user?.id}`
      );

      await pubsub.publish("NEW_NOTIFICATION", {
        newNotification: savedBuyerNotification,
      });
      logger.info(
        `Buyer notification published to pubsub for user: ${buyer.id}`
      );

      // Notify all admins
      const admins = await userRepository.find({
        where: {
          isDeleted: false,
          role: { name: Not("Customer") },
        },
      });

      for (const admin of admins) {
        const adminNotification = notificationRepository.create({
          name: "New Offer",
          message: `A new offer has been made for business: ${business.businessTitle}`,
          user: admin,
        });
        const savedAdminNotification = await notificationRepository.save(
          adminNotification
        );
        await pubsub.publish("NEW_NOTIFICATION", {
          newNotification: savedAdminNotification,
        });
      }

      // Email to buyer: New Offer Submitted
      if (buyer.email) {
        try {
          const listingId = (business as any).reference || business.id;
          logger.info(
            `Sending offer confirmation email to buyer: ${buyer.email}`
          );

          const buyerHtml = baseEmailTemplate({
            actionUrl: undefined,
            actionText: undefined,
            title: " ",
            message: `
              <p>Dear <strong>${buyer.name || "Buyer"}</strong>,</p>

              <p>Your offer has been successfully submitted on Jusoor.</p>

              <p>Listing Number: ${listingId}</p>

              <p>
                The seller has been notified and will review your offer. You will be informed once they respond or take further action.
              </p>

              <p>Jusoor shortens the path.</p>

              <p style="margin-top:24px;">
                Warm regards,<br />
                <strong>Jusoor Team</strong>
              </p>
            `,
          });

          await sendEmail({
            to: buyer.email,
            subject: "New Offer Submitted",
            html: buyerHtml,
          });

          logger.info(`Successfully sent email to buyer: ${buyer.email}`);
        } catch (error) {
          logger.error(`Failed to send email to buyer ${buyer.email}:`, error);
        }
      }

      return newOffer;
    },
    updateOfferStatus: async (
      _: any,
      { input }: { input: UpdateOfferInput },
      context: any
    ) => {
      const authUser = await authenticate(context);
      if (!authUser) throw new Error("Unauthorized");

      const offer = await offerRepository.findOne({
        where: { id: input.id },
        relations: ["business", "business.seller", "buyer"],
      });

      if (!offer) throw new Error("Offer not found");

      // Ownership check: only the seller of the business OR the buyer themselves may update
      const isSeller = offer.business?.seller?.id === authUser.userId;
      const isBuyer  = offer.buyer?.id === authUser.userId;
      if (!isSeller && !isBuyer) {
        throw new Error("Unauthorized: you do not own this offer or business");
      }

      if (input.status) {
        offer.status = input.status;
      }

      if (input.price !== undefined) {
        offer.price = input.price;
      }

      // Commission is LOCKED at creation — never recalculate here.

      const savedOffer = await offerRepository.save(offer);

      // Auto-freeze the business when an offer is ACCEPTED
      // (prevents new buyers from entering while a deal is being formed)
      if (savedOffer.status === "ACCEPTED" && offer.business?.id) {
        await businessRepository
          .createQueryBuilder()
          .update()
          .set({ isAbleInActive: false })
          .where("id = :id", { id: offer.business.id })
          .execute();
      }

      return savedOffer;
    },
    counterOffer: async (
      _: any,
      { input }: { input: CounterOfferInput },
      context: any
    ) => {
      const authUser = await authenticate(context);
      if (!authUser) throw new Error("Unauthorized");

      const parentOffer = await offerRepository.findOne({
        where: { id: input.parentOfferId },
        relations: ["business", "business.seller", "buyer"],
      });
      if (!parentOffer) throw new Error("Parent offer not found");

      // Decide who is countering (buyer or seller)
      const user = await userRepository.findOne({
        where: { id: authUser.userId },
      });
      if (!user) throw new Error("User not found");

      // Lock commission at counter-offer creation time
      const counterCommission = await calculateCommissionFromService(Number(input.price));

      // Create new counter-offer
      const counter = offerRepository.create({
        price: input.price,
        message: input.message,
        buyer: parentOffer.buyer, // keep same buyer
        business: parentOffer.business,
        status: "PENDING",
        parentOffer: parentOffer, // <-- link to chain
        commission: counterCommission.amount,
        createdAt: new Date(),
        createdBy: user.id, // optional field if you add "madeBy"
      });

      const saved = await offerRepository.save(counter);

      // Notifications like in createOffer...
      if (user.id === parentOffer.business.seller.id) {
        // Notify buyer
        const buyerNotification = notificationRepository.create({
          name: "New Counter-Offer",
          message: `A new counter-offer has been made on your offer for business: ${parentOffer.business.businessTitle}`,
          user: parentOffer.buyer,
        });
        const savedBuyerNotification = await notificationRepository.save(
          buyerNotification
        );
        await pubsub.publish("NEW_NOTIFICATION", {
          newNotification: savedBuyerNotification,
        });
      } else {
        // Notify seller
        const sellerNotification = notificationRepository.create({
          name: "New Counter-Offer",
          message: `You have created a new counter-offer for your business: ${parentOffer.business.businessTitle}`,
          user: parentOffer.business.seller,
        });
        const savedSellerNotification = await notificationRepository.save(
          sellerNotification
        );
        await pubsub.publish("NEW_NOTIFICATION", {
          newNotification: savedSellerNotification,
        });
      }

      parentOffer.status = "REJECTED";
      await offerRepository.save(parentOffer);

      return saved;
    },
    setMeetingDate: async (
      _: any,
      { offerId, meetingDate }: { offerId: string; meetingDate: Date },
      context: any
    ) => {
      const authUser = await authenticate(context);
      if (!authUser) throw new Error("Unauthorized");

      // Find the offer
      const offer = await offerRepository.findOne({
        where: { id: offerId },
        relations: ["buyer", "business", "business.seller"],
      });

      if (!offer) throw new Error("Offer not found");
      if (offer.buyer.id !== authUser.userId)
        throw new Error("Unauthorized: Only the buyer can set a meeting date");

      // Create a new Meeting entry
      const newMeeting = meetingRepo.create({
        requestedTo: offer.buyer,
        business: offer.business,
        requestedDate: meetingDate,
        offer: offer,
      });

      await meetingRepo.save(newMeeting);

      // Notify the business seller
      if (offer.business.seller) {
        const sellerNotification = notificationRepository.create({
          name: "New Meeting Scheduled",
          message: `A meeting has been scheduled for your business: ${offer.business.businessTitle}`,
          user: offer.business.seller,
        });
        const savedSellerNotification = await notificationRepository.save(
          sellerNotification
        );
        await pubsub.publish("NEW_NOTIFICATION", {
          newNotification: savedSellerNotification,
        });
      }

      // Notify all admins
      const admins = await userRepository.find({
        where: {
          isDeleted: false,
          role: { name: Not("Customer") },
        },
      });

      for (const admin of admins) {
        const adminNotification = notificationRepository.create({
          name: "New Meeting Scheduled",
          message: `A meeting has been scheduled for business: ${offer.business.businessTitle}`,
          user: admin,
        });
        const savedAdminNotification = await notificationRepository.save(
          adminNotification
        );
        await pubsub.publish("NEW_NOTIFICATION", {
          newNotification: savedAdminNotification,
        });
      }

      return await offerRepository.save(offer);
    },
    createEnda: async (
      _: any,
      { input }: { input: AcceptEndaInput },
      context: any
    ) => {
      const ctxUser = await authenticate(context); // or trust input.userId after auth
      // if (ctxUser?.userId !== input.userId) {
      //   throw new Error("Unauthorized.");
      // }
      const user = await userRepository.findOneBy({ id: input.userId });
      if (!user) throw new Error("User not found.");

      // Optional: avoid duplicate acceptances unless NDA version changed
      const existing = await endaAcceptanceRepo.findOne({
        where: {
          createdBy: user.id,
          business: input.businessId ? { id: input.businessId } : IsNull(),
        },
      });
      if (existing) return existing;

      const business = input.businessId
        ? await businessRepository.findOneBy({ id: input.businessId })
        : null;

      if (input.businessId && !business) {
        throw new Error("Business not found.");
      }

      const acceptance = endaAcceptanceRepo.create({
        business,
        ...input,
      });

      const saved = await endaAcceptanceRepo.save(acceptance);
      return saved;
    },
    acceptEnda: async (
      _: any,
      { id, userId }: { id: string; userId: string },
      context: any
    ) => {
      const user = await userRepository.findOneBy({ id: userId });
      if (!user) {
        throw new Error("User not found.");
      }

      const existing = await endaAcceptanceRepo.findOne({
        where: { id },
        relations: ["user"], // optional if you want to load the user relation
      });

      if (!existing) {
        throw new Error("Acceptance not found.");
      }

      existing.user = user;

      const saved = await endaAcceptanceRepo.save(existing);
      return saved;
    },
  },
};

export default offerResolver;

export function calculateCommission(
  price: number,
  commissionRate: number
): number {
  return price * commissionRate;
}
