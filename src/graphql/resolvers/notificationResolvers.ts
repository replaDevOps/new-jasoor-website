import { Campaign, Notification, Setting } from "../../entity";
import { dataSource } from "../../datasource";
import { pubsub } from "../../server";
import { authenticate } from "../../utils/authUtils";
import { ILike, Raw } from "typeorm";
import { CampaignGroup } from "../../enum";
import { CampaignFilter } from "../../types";
import { dispatchCampaignIfDue } from "../../services/campaignNotificationService";

const notificationRepository = dataSource.getRepository(Notification);
const settingRepository = dataSource.getRepository(Setting);
const campaignRepository = dataSource.getRepository(Campaign);

const notificationResolvers = {
  Query: {
    getNotifications: async (
      _: any,
      {
        userId,
        limit,
        offSet,
      }: { userId: string; limit: number; offSet: number },
      context: any
    ) => {
      const [notifications, count] = await notificationRepository.findAndCount({
        where: { user: { id: userId } },
        relations: ["user"],
        order: { createdAt: "DESC" },
        take: limit,
        skip: offSet,
      });

      return { notifications, count };
    },
    getNotificationCount: async (_: any, __: any, context: any) => {
      const ctxUser = await authenticate(context);
      return await notificationRepository.count({
        where: { user: { id: ctxUser.userId }, isRead: false },
        relations: ["user"],
        order: { createdAt: "DESC" },
      });
    },
    getAlerts: async (
      _: any,
      {
        userId,
        limit = 10,
        offset = 0,
      }: { userId: string; limit: number; offset: number },
      context: any
    ) => {
      const [notifications, count] = await notificationRepository.findAndCount({
        where: { user: { id: userId } },
        relations: ["user"],
        order: { createdAt: "DESC" },
        take: limit,
        skip: offset,
      });

      // group by date (YYYY-MM-DD)
      const grouped: { [date: string]: any[] } = {};
      for (const notif of notifications) {
        const dateKey = notif.createdAt.toISOString().split("T")[0];
        if (!grouped[dateKey]) grouped[dateKey] = [];
        grouped[dateKey].push(notif);
      }

      const groups = Object.entries(grouped).map(([date, notifs]) => ({
        time: date,
        notifications: notifs,
      }));

      return {
        groups,
        count,
      };
    },
    getNotification: async (_: any, { id }: { id: string }, context: any) => {
      await authenticate(context);
      const notification = await notificationRepository.findOne({
        where: { id },
        relations: ["user"],
      });

      if (!notification) {
        throw new Error("Notification not found");
      }

      return notification;
    },
    getAdminNotifications: async (
      _: any,
      { limit, offSet }: { limit: number; offSet: number },
      context: any
    ) => {
      await authenticate(context);
      const [notifications, count] = await notificationRepository.findAndCount({
        where: { isAdmin: true },
        relations: ["user"],
        order: { createdAt: "DESC" },
        take: limit,
        skip: offSet,
      });
      return { notifications, count };
    },
    getSetting: async (_: any, __: any, context: any) => {
      const setting = await settingRepository.findOne({
        where: { isDeleted: false },
      });
      return setting;
    },
    getCampaigns: async (_: any, { filter }: { filter: CampaignFilter }) => {
      let where: any = { isDeleted: false };
      if (filter) {
        const { search, group, district, status } = filter;

        if (search) {
          // Partial match on title
          where.title = ILike(`%${search}%`);
        }

        if (group) {
          where.group = group;
        }

        if (district) {
          // If you store district as array
          where.district = Raw(
            (alias) =>
              `EXISTS (SELECT 1 FROM unnest(${alias}) d WHERE d ILIKE :district)`,
            {
              district: `%${district}%`,
            }
          );
        }

        if (status !== undefined) {
          where.status = status;
        }
      }
      const [campaigns, total] = await campaignRepository.findAndCount({
        where,
        order: { createdAt: "DESC" },
        skip: filter?.offset || 0,
        take: filter?.limit || 10,
      });

      return {
        campaigns: campaigns,
        totalCount: total,
      };
    },
  },

  Mutation: {
    markNotificationAsRead: async (
      _: any,
      { id }: { id: string },
      context: any
    ) => {
      await authenticate(context);
      const notifications = await notificationRepository.find({
        where: { user: { id } },
      });

      if (!notifications || notifications.length === 0) {
        throw new Error("Notifications not found");
      }

      // Mark all as read
      for (const notification of notifications) {
        notification.isRead = true;
      }

      await notificationRepository.save(notifications);
      return true;
    },
    createSettings: async (
      _: any,
      {
        commissionRate,
        faceBook,
        instagram,
        whatsApp,
        x,
      }: {
        commissionRate: string;
        faceBook?: string;
        instagram?: string;
        whatsApp?: string;
        x?: string;
      }
    ) => {
      const setting = settingRepository.create({
        commissionRate,
        faceBook,
        instagram,
        whatsApp,
        x,
      });
      return await settingRepository.save(setting);
    },
    updateSettings: async (
      _: any,
      {
        id,
        commissionRate,
        faceBook,
        instagram,
        whatsApp,
        x,
      }: {
        id: string;
        commissionRate?: string;
        faceBook?: string;
        instagram?: string;
        whatsApp?: string;
        x?: string;
      },
      context: any
    ) => {
      const setting = await settingRepository.findOne({ where: { id } });
      if (!setting) {
        throw new Error("Setting not found");
      }
      if (commissionRate) setting.commissionRate = commissionRate;
      if (faceBook) setting.faceBook = faceBook;
      if (instagram) setting.instagram = instagram;
      if (whatsApp) setting.whatsApp = whatsApp;
      if (x) setting.x = x;

      return await settingRepository.save(setting);
    },
    createCampaign: async (
      _: any,
      {
        title,
        group,
        district,
        schedule,
        description,
      }: {
        title: string;
        group: CampaignGroup;
        district: string[];
        schedule: Date;
        description?: string;
      },
      context: any
    ) => {
      await authenticate(context);
      const campaign = campaignRepository.create({
        title,
        group,
        district,
        schedule,
        description,
        status: false,
      });
      const savedCampaign = await campaignRepository.save(campaign);
      await dispatchCampaignIfDue(savedCampaign, pubsub);
      return await campaignRepository.findOne({
        where: { id: savedCampaign.id },
      });
    },
    updateCampaign: async (
      _: any,
      {
        id,
        title,
        group,
        district,
        schedule,
        description,
      }: {
        id: string;
        title?: string;
        group?: CampaignGroup;
        district?: string[];
        schedule?: Date;
        description?: string;
      },
      context: any
    ) => {
      await authenticate(context);
      const campaign = await campaignRepository.findOne({ where: { id } });
      if (!campaign) {
        throw new Error("Campaign not found");
      }
      if (title) campaign.title = title;
      if (group) campaign.group = group;
      if (district) campaign.district = district;
      if (schedule) campaign.schedule = schedule;
      if (description) campaign.description = description;

      return await campaignRepository.save(campaign);
    },
    deleteCampaign: async (_: any, { id }: { id: string }, context: any) => {
      await authenticate(context);
      const campaign = await campaignRepository.findOne({ where: { id } });
      if (!campaign) {
        throw new Error("Campaign not found");
      }
      await campaignRepository.remove(campaign);
      return true;
    },
  },
  Subscription: {
    newNotification: {
      subscribe: (_: any, __: any, context: any) => {
        return pubsub.asyncIterableIterator("NEW_NOTIFICATION");
      },
    },
  },
};

export default notificationResolvers;
