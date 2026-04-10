import {
  Chat,
  Message,
  User,
  Notification,
  ChatParticipant,
  ContactUs,
} from "../../entity";
import { dataSource } from "../../datasource";
import { authenticate } from "../../utils/authUtils";
import { ILike, In } from "typeorm";
import { sendEmail } from "../../services/emailService";
import { contactUsResponseEmail } from "../../services/templates/email/contactUsResponse";
import { logger } from "../../utils/logger";

const chatRepo = dataSource.getRepository(Chat);
const contactUsRepo = dataSource.getRepository(ContactUs);
const partRepo = dataSource.getRepository(ChatParticipant);
const messageRepo = dataSource.getRepository(Message);
const notificationRepo = dataSource.getRepository(Notification);

const chatResolvers = {
  Query: {
    getChatById: async (_: any, { id }: { id: string }, context: any) => {
      const authUser = await authenticate(context);

      const chat = await chatRepo.findOne({
        where: { id },
        relations: [
          "participants",
          "participants.user",
          "messages",
          "messages.sender",
        ],
      });
      if (!chat) throw new Error("Chat not found");

      /* gate-keep – user must be in the room */
      const isMember = chat.participants.some(
        (p) => p.userId === authUser?.userId
      );
      if (!isMember) throw new Error("Not a participant of this chat");

      return chat;
    },
    getUserChats: async (_: any, __: any, context: any) => {
      const authUser = await authenticate(context);

      return dataSource
        .getRepository(Chat)
        .createQueryBuilder("chat")
        .innerJoin("chat.participants", "p", "p.userId = :uid", {
          uid: authUser?.userId,
        })
        .leftJoinAndSelect("chat.participants", "participants")
        .leftJoinAndSelect("participants.user", "participantUser")
        .leftJoinAndSelect("chat.messages", "messages")
        .orderBy("chat.updatedAt", "DESC")
        .getMany();
    },
    getContactUs: async (_: any, { id }: { id: string }) => {
      const contactUs = await contactUsRepo.findOne({
        where: { id },
      });
      if (!contactUs) throw new Error("Contact Us entry not found");
      return contactUs;
    },
    getAllContactUs: async (
      _: any,
      {
        limit,
        offset,
        search,
        status,
      }: { limit?: number; offset: number; search: string; status: boolean }
    ) => {
      let where: any = { isDeleted: false };
      if (search && search.trim() !== "") {
        where = {
          ...where,
          name: ILike(`%${search}%`),
        };
      }
      if (status !== undefined) {
        where = {
          ...where,
          isResponded: status,
        };
      }
      const [contactUsEntries, totalCount] = await contactUsRepo.findAndCount({
        where,
        order: { createdAt: "DESC" },
        take: limit,
        skip: offset,
      });

      return {
        contactUs: contactUsEntries,
        totalCount,
      };
    },
  },

  Mutation: {
    createChat: async (
      _: any,
      { title, memberIds }: { title: string; memberIds: string[] },
      context: any
    ) => {
      const ctxUser = await authenticate(context);
      if (!title?.trim()) throw new Error("Title is required");
      if (!memberIds?.length) throw new Error("memberIds array is required");

      /* include creator & remove dups */
      const allIds = Array.from(new Set([ctxUser?.userId, ...memberIds]));
      const userRepo = dataSource.getRepository(User);

      const users = await userRepo.find({ where: { id: In(allIds) } });
      if (users.length !== allIds.length)
        throw new Error("One or more users not found");

      /* create chat & participants atomically */
      const chat = await dataSource.transaction(async (trx) => {
        /* 1️⃣  the chat */
        const newChat = chatRepo.create({
          title,
          createdBy: ctxUser?.userId,
        });
        await chatRepo.save(newChat);

        /* 2️⃣  participants (creator = admin) */
        for (const u of users) {
          await partRepo.save(
            partRepo.create({
              chat: newChat,
              user: u,
              isAdmin: u.id === ctxUser?.userId,
            })
          );
        }

        return newChat;
      });

      /* return with relations loaded */
      return dataSource.getRepository(Chat).findOneOrFail({
        where: { id: chat.id },
        relations: ["participants", "participants.user"],
      });
    },

    /* post a message to a chat */
    sendMessage: async (
      _: any,
      { chatId, content }: { chatId: string; content: string },
      context: any
    ) => {
      const ctxUser = await authenticate(context);
      if (!content?.trim()) throw new Error("Message content is empty");

      const chat = await chatRepo.findOne({
        where: { id: chatId },
        relations: ["participants", "participants.user"],
      });
      if (!chat) throw new Error("Chat not found");

      /* sender must be in the room */
      const isMember = chat.participants.some(
        (p) => p.userId === ctxUser?.userId
      );
      if (!isMember) throw new Error("Not a participant of this chat");

      const sender = chat.participants.find(
        (p) => p.userId === ctxUser?.userId
      )!.user; // guaranteed by isMember

      /* 1️⃣  save message */
      const message = messageRepo.create({ content, sender, chat });
      const savedMessage = await messageRepo.save(message);

      /* 2️⃣  notify EVERYONE except sender */
      for (const p of chat.participants) {
        if (p.userId === ctxUser?.userId) continue;

        const notif = notificationRepo.create({
          name: "New Message",
          message: `New message in “${chat.title}”`,
          user: p.user,
        });
        const savedNotif = await notificationRepo.save(notif);
        context.pubsub.publish("NEW_NOTIFICATION", {
          newNotification: savedNotif,
        });
      }

      return savedMessage;
    },

    createContactUs: async (
      _: any,
      { input }: { input: { name: string; email: string; message: string } }
    ) => {
      const { name, email, message } = input;
      if (!name || !email || !message) {
        throw new Error("All fields are required");
      }

      const contactUs = contactUsRepo.create({
        name,
        email,
        message,
        isResponded: false,
      });

      return await contactUsRepo.save(contactUs);
    },
    updateContactUs: async (
      _: any,
      { id, status, answer }: { id: string; status: boolean; answer: string }
    ) => {
      const contactUs = await contactUsRepo.findOne({ where: { id } });
      if (!contactUs) {
        throw new Error("Contact Us entry not found");
      }

      contactUs.isResponded = status;
      contactUs.answer = answer;

      const updatedContactUs = await contactUsRepo.save(contactUs);
      if (status && answer && contactUs.email) {
        try {
          await sendEmail({
            to: contactUs.email,
            subject: "Response to Your Query - Jusoor",
            html: contactUsResponseEmail(contactUs.name, answer),
          });
        } catch (error) {
          logger.error(`Failed to send email to ${contactUs.email}:`, error);
        }
      }

      return updatedContactUs;
    },
  },
};

export default chatResolvers;
