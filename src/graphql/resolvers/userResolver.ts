import {
  User,
  Document,
  Business,
  BusinessView,
  Meeting,
  Role,
  Notification,
  OTP,
  Offer,
} from "../../entity";
import { dataSource } from "../../datasource";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  authenticate,
  generateTokens,
  verifyRefreshToken,
  generatePasswordResetToken,
  verifyPasswordResetToken,
} from "../../utils/authUtils";
import {
  CreateRoleInput,
  CreateUserInput,
  UpdateRoleInput,
  UpdateUserInput,
  UserFilterInput,
} from "../../types";
import { logger } from "../../utils/logger";
import { BusinessStatus, UserStatus } from "../../enum";
import { sendEmailOTP, verifyEmailOTP } from "../../services/authenticaService";
import {
  ILike,
  LessThan,
  Between,
  Not,
  MoreThanOrEqual,
  LessThanOrEqual,
  In,
  IsNull,
  And,
} from "typeorm";
import { pubsub } from "../../server";
import { ApolloError } from "apollo-server-express";
import { sendEmail } from "../../services/emailService";
import { baseEmailTemplate } from "../../utils/emailTemplates";
import crypto from "crypto";
const roleRepository = dataSource.getRepository(Role);
const userRepository = dataSource.getRepository(User);
const documentRepository = dataSource.getRepository(Document);
const businessViewRepository = dataSource.getRepository(BusinessView);
const businessRepository = dataSource.getRepository(Business);
const meetingRepository = dataSource.getRepository(Meeting);
const notificationRepository = dataSource.getRepository(Notification);
const otpRepository = dataSource.getRepository(OTP);
const offerRepository = dataSource.getRepository(Offer);

const userResolvers = {
  Query: {
    getRoles: async (
      _: any,
      {
        limit,
        offset,
        search,
        isActive,
      }: { limit: number; offset: number; search: string; isActive: boolean },
    ) => {
      const SUPER_ADMIN_NAME = "Super Admin";

      let where: any = {
        isDeleted: false,
        name: Not(SUPER_ADMIN_NAME),
      };

      if (search) {
        where.name = And(ILike(`%${search}%`), Not(SUPER_ADMIN_NAME));
      }

      if (isActive !== undefined) {
        where.isActive = isActive;
      }

      const [roles, totalCount] = await roleRepository.findAndCount({
        where,
        order: { createdAt: "DESC" },
        take: limit,
        skip: offset,
      });

      return { roles, totalCount };
    },
    getRole: async (_: any, { id }: { id: string }) => {
      const userRole = await roleRepository.findOne({ where: { id } });
      if (!userRole) throw new Error("Roles not found");
      return userRole;
    },
    getCustomerRole: async (_: any, __: any) => {
      const userRole = await roleRepository.findOne({
        where: { name: "Customer" },
      });
      if (!userRole) throw new Error("Roles not found");
      return userRole;
    },
    getUser: async (_: any, { id }: { id: string }) => {
      // return await userRepository.findOne({
      //   where: { id },
      //   relations: [
      //     'documents',
      //     'notifications',
      //     'offers',
      //     'businesses',
      //     'favouriteBusinesses',
      //     'viewedBusinesses',
      //     'banks',
      //     'role'
      //   ],
      // });
      return await userRepository
        .createQueryBuilder("user")
        .leftJoinAndSelect("user.role", "role")
        .leftJoinAndSelect("user.documents", "documents")
        .leftJoinAndSelect("user.notifications", "notifications")
        .leftJoinAndSelect("user.offers", "offers")
        .leftJoinAndSelect("user.businesses", "businesses")
        .leftJoinAndSelect("user.favouriteBusinesses", "favouriteBusinesses")
        .leftJoinAndSelect("user.viewedBusinesses", "viewedBusinesses")
        .leftJoinAndSelect("user.banks", "banks")
        .where("user.id = :id", { id })
        .getOne();
    },
    getUserDetails: async (_: any, { id }: { id: string }, context: any) => {
      const user = await userRepository.findOne({ where: { id } });
      if (!user) throw new ApolloError("User not found", "NOT_FOUND");
      return user;
    },
    getNavUser: async (_: any, { id }: { id: string }) => {
      const user = await userRepository.findOne({
        where: { id },
        relations: ["documents", "role"],
      });

      if (!user) return null;

      // Fetch legacy documents (created with createdBy but userId is null)
      const legacyDocs = await documentRepository.find({
        where: {
          createdBy: id,
          userId: IsNull(),
        },
      });

      // Combine properly linked documents with legacy documents
      const allDocuments = [
        ...(user.documents || []),
        ...legacyDocs.filter(
          (legacyDoc) =>
            !user.documents?.some((doc) => doc.id === legacyDoc.id),
        ),
      ];

      return {
        ...user,
        documents: allDocuments,
      };
    },
    getCustomers: async (_: any, __: any) => {
      return await userRepository.find({
        where: {
          role: { name: "Customer" },
          isDeleted: false,
          status: UserStatus.verified,
        },
        relations: ["role"],
      });
    },
    getUsers: async (
      _: any,
      {
        limit,
        offset,
        filter,
      }: { limit: number; offset: number; filter: UserFilterInput },
      context: any,
    ) => {
      const where: any = { isDeleted: false, role: { name: "Customer" } };
      if (filter) {
        if (filter.district) {
          where.district = ILike(`%${filter.district}%`);
        }
        if (filter.city) {
          where.city = ILike(`%${filter.city}%`);
        }

        if (filter.status !== null && filter.status !== undefined) {
          where.status = filter.status;
        }
        if (filter.createdType) {
          const today = new Date();
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(today.getDate() - 30);
          if (filter.createdType === "old") {
            where.createdAt = LessThan(thirtyDaysAgo);
          } else if (filter.createdType === "new") {
            where.createdAt = Between(thirtyDaysAgo, today);
          }
        }
        if (filter.name) {
          where.name = ILike(`%${filter.name}%`);
        }
      }
      const [users, count] = await userRepository.findAndCount({
        where,
        take: limit,
        skip: offset,
        order: { createdAt: "DESC" },
        relations: ["documents"],
      });
      if (!users) throw new Error("Users not found");
      const userIds = users.map((user) => user.id).filter(Boolean);

      let legacyDocsByUser: Record<string, Document[]> = {};

      if (userIds.length > 0) {
        const legacyDocs = await documentRepository.find({
          where: {
            createdBy: In(userIds),
            userId: IsNull(),
          },
        });

        legacyDocsByUser = legacyDocs.reduce(
          (acc, doc) => {
            if (!doc.createdBy) {
              return acc;
            }

            if (!acc[doc.createdBy]) {
              acc[doc.createdBy] = [];
            }

            acc[doc.createdBy].push(doc);
            return acc;
          },
          {} as Record<string, Document[]>,
        );
      }

      // Add computed "type" property
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const updatedUsers = users.map((user) => {
        const existingDocs = user.documents ?? [];
        const fallbackDocs = legacyDocsByUser[user.id] ?? [];
        const combinedDocs = new Map<string, Document>();

        for (const doc of existingDocs) {
          combinedDocs.set(doc.id, doc);
        }

        for (const doc of fallbackDocs) {
          combinedDocs.set(doc.id, doc);
        }

        return {
          ...user,
          documents: Array.from(combinedDocs.values()),
          type: user.createdAt < thirtyDaysAgo ? "old" : "new",
        };
      });

      return { users: updatedUsers, totalCount: count };
    },
    checkPassword: async (
      _: any,
      { oldPassword }: { oldPassword: string },
      context: any,
    ): Promise<boolean> => {
      try {
        const authUser = context.user;
        if (!authUser?.id) {
          throw new ApolloError("Unauthorized", "UNAUTHORIZED");
        }

        const user = await userRepository.findOne({
          where: { id: authUser.id },
        });
        if (!user) throw new ApolloError("User not found", "USER_NOT_FOUND");

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        return isMatch;
      } catch (error: any) {
        if (error instanceof ApolloError) throw error;
        console.error("Check password error:", error);
        throw new ApolloError(
          error.message || "Failed to check password",
          "CHECK_PASSWORD_FAILED",
        );
      }
    },
    getProfileStatistics: async (
      _: any,
      { startDate, endDate }: { startDate?: string; endDate?: string },
      context: any,
    ) => {
      const ctxUser = await authenticate(context);
      if (!ctxUser) {
        throw new Error("Unauthorized access");
      }

      // Optional check: only allow sellers
      const user = await userRepository.findOne({
        where: { id: ctxUser.userId },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Convert string to Date objects if provided
      const dateFilter: any = {};
      if (startDate && endDate) {
        dateFilter.createdAt = Between(new Date(startDate), new Date(endDate));
      } else if (startDate) {
        dateFilter.createdAt = MoreThanOrEqual(new Date(startDate));
      } else if (endDate) {
        dateFilter.createdAt = LessThanOrEqual(new Date(endDate));
      }

      let viewedBusinessesCount = 0;
      let receivedOffersCount = 0;
      let pendingMeetingsCount = 0;
      let scheduledMeetingsCount = 0;
      let finalizedDealsCount = 0;

      const [listedBusinesses, listedBusinessesCount] =
        await businessRepository.findAndCount({
          where: { createdBy: user.id },
          relations: ["offers", "meetings"],
        });

      if (listedBusinesses.length === 0) {
        viewedBusinessesCount = 0;
        receivedOffersCount = 0;
        pendingMeetingsCount = 0;
        scheduledMeetingsCount = 0;
        finalizedDealsCount = 0;
      } else {
        // Count of viewed businesses (filtering by date if available)
        const sellerBusinessIds = listedBusinesses.map((b) => b.id);
        viewedBusinessesCount = await businessViewRepository.count({
          where: {
            business: { id: In(sellerBusinessIds) },
            ...(dateFilter.createdAt && { createdAt: dateFilter.createdAt }),
          },
        });

        // Filter offers and meetings by date if specified
        receivedOffersCount = await offerRepository.count({
          where: {
            business: { id: In(sellerBusinessIds) },
            ...(dateFilter.createdAt && { createdAt: dateFilter.createdAt }),
          },
        });

        pendingMeetingsCount = await meetingRepository.count({
          where: {
            business: { id: In(sellerBusinessIds) },
            status: "REQUESTED",
            ...(dateFilter.createdAt && { createdAt: dateFilter.createdAt }),
          },
        });

        scheduledMeetingsCount = await meetingRepository.count({
          where: {
            business: { id: In(sellerBusinessIds) },
            status: "APPROVED",
            ...(dateFilter.createdAt && { createdAt: dateFilter.createdAt }),
          },
        });

        finalizedDealsCount = listedBusinesses.filter(
          (b) => b.businessStatus === BusinessStatus.SOLD,
        ).length;
      }

      return {
        viewedBusinessesCount,
        listedBusinessesCount,
        receivedOffersCount,
        pendingMeetingsCount,
        scheduledMeetingsCount,
        finalizedDealsCount,
      };
    },
    getBuyerStatistics: async (
      _: any,
      { startDate, endDate }: { startDate?: string; endDate?: string },
      context: any,
    ) => {
      const ctxUser = await authenticate(context);
      if (!ctxUser) {
        throw new Error("Unauthorized access");
      }

      const user = await userRepository.findOne({
        where: { id: ctxUser.userId },
        relations: ["favouriteBusinesses"],
      });

      // Define date filters if provided
      const dateFilter: any = {};
      if (startDate && endDate) {
        dateFilter.createdAt = Between(new Date(startDate), new Date(endDate));
      } else if (startDate) {
        dateFilter.createdAt = MoreThanOrEqual(new Date(startDate));
      } else if (endDate) {
        dateFilter.createdAt = LessThanOrEqual(new Date(endDate));
      }

      let favouriteBusinessesCount = 0;
      if (user?.favouriteBusinesses?.length) {
        const filteredFavs = user.favouriteBusinesses.filter((b: any) => {
          if (!b.createdAt) return true; // skip if no date
          const created = new Date(b.createdAt);
          return (
            (!startDate || created >= new Date(startDate)) &&
            (!endDate || created <= new Date(endDate))
          );
        });
        favouriteBusinessesCount = filteredFavs.length;
      }

      const meetings = await meetingRepository.find({
        where: {
          requestedTo: { id: ctxUser.userId },
          ...(dateFilter.createdAt && { createdAt: dateFilter.createdAt }),
        },
        relations: ["business"],
      });

      const scheduledMeetingsCount = meetings.filter(
        (m) => m.status === "APPROVED",
      ).length;

      const finalizedDealsCount = meetings.filter(
        (m) => m.business?.businessStatus === BusinessStatus.SOLD,
      ).length;

      return {
        favouriteBusinessesCount,
        scheduledMeetingsCount,
        finalizedDealsCount,
      };
    },
    getStaffMembers: async (
      _: any,
      {
        limit,
        offset,
        search,
        status,
        roleId,
      }: {
        limit: number;
        offset: number;
        search: string;
        status: UserStatus;
        roleId: string;
      },
    ) => {
      let where: any = { role: { name: Not("Customer") }, isDeleted: false };

      if (search) {
        where = {
          ...where,
          name: ILike(`%${search}%`),
        };
      }

      if (status !== undefined) {
        where = {
          ...where,
          status,
        };
      }

      if (roleId) {
        // Merge with existing role filter
        where = {
          ...where,
          role: {
            ...where.role, // preserve Not('Customer') if search/isActive is not overwriting
            id: roleId,
          },
        };
      }

      const [users, totalCount] = await userRepository.findAndCount({
        where,
        relations: ["role"],
        skip: offset,
        take: limit,
        order: { createdAt: "DESC" },
      });

      if (!users) {
        throw new Error("Unauthorized access");
      }
      return { users, totalCount };
    },
  },
  Mutation: {
    createRole: async (_: any, { input }: { input: CreateRoleInput }) => {
      try {
        const newRole = roleRepository.create({
          ...input,
        });
        await roleRepository.save(newRole);
        return newRole;
      } catch (error) {
        throw new Error("Error on creating role");
      }
    },
    updateRole: async (_: any, { input }: { input: UpdateRoleInput }) => {
      try {
        const role = await roleRepository.findOne({ where: { id: input.id } });
        if (!role) throw new Error("Role not found");

        Object.assign(role, input);
        await roleRepository.save(role);
        return role;
      } catch (error) {
        throw new Error("Error on creating role");
      }
    },
    login: async (_: any, input: { email: string; password: string }) => {
      const { password, email } = input;

      const user = await userRepository.findOne({
        where: { email, isDeleted: false },
        relations: ["role"],
      });

      if (!user) throw new Error("User not found");
      if (!password) throw new Error("Password is required");

      // Check if user is a Customer (website user only)
      if (user.role.name !== "Customer") {
        throw new Error(
          "Invalid credentials. Please use the admin panel to login.",
        );
      }

      // Validate password
      const validPassword = await bcrypt.compare(password, user.password);

      if (!validPassword) throw new Error("Invalid password");

      // Generate JWT tokens using the utility function
      const { accessToken, refreshToken } = generateTokens(user);

      // Update the user with the new refresh token
      user.refreshToken = refreshToken;
      user.lastLoginDate = new Date();
      await userRepository.save(user);

      // Return the tokens and user details
      return {
        token: accessToken,
        refreshToken,
        user: {
          ...user,
          password: undefined, // Exclude password from the returned object
        },
      };
    },
    requestLoginOTP: async (
      _: any,
      { email, password }: { email: string; password: string },
    ) => {
      const normalizedEmail = email.toLowerCase().trim();

      // 1. Validate credentials first
      const user = await userRepository.findOne({
        where: { email: normalizedEmail, isDeleted: false },
        relations: ["role"],
      });

      if (!user) throw new Error("User not found");
      if (user.role.name !== "Customer")
        throw new Error("Invalid credentials.");
      if (user.status === UserStatus.inactive)
        throw new Error("Your account is inactive.");

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) throw new Error("Invalid password");

      // 2. Send OTP via Authentica
      const result = await sendEmailOTP(normalizedEmail);
      if (!result.success)
        throw new Error(result.message || "Failed to send OTP");

      return {
        success: true,
        message: "OTP has been sent to your email.",
        email: normalizedEmail,
      };
    },

    verifyLoginOTP: async (
      _: any,
      { email, otp }: { email: string; otp: string },
    ) => {
      const normalizedEmail = email.toLowerCase().trim();

      // Verify OTP with Authentica
      const result = await verifyEmailOTP(normalizedEmail, otp);
      if (!result.verified)
        throw new Error(result.message || "Invalid or expired OTP.");

      const user = await userRepository.findOne({
        where: { email: normalizedEmail, isDeleted: false },
        relations: ["role"],
      });

      if (!user) throw new Error("User not found");

      const { accessToken, refreshToken } = generateTokens(user);
      user.refreshToken = refreshToken;
      user.lastLoginDate = new Date();
      await userRepository.save(user);

      return {
        token: accessToken,
        refreshToken,
        user: { ...user, password: undefined },
      };
    },

    staffLogin: async (_: any, input: { email: string; password: string }) => {
      const { password, email } = input;

      const user = await userRepository.findOne({
        where: { email, isDeleted: false },
        relations: ["role"],
      });

      if (!user) throw new Error("User not found");
      if (!password) throw new Error("Password is required");
      if (user.status === UserStatus.pending) {
        throw new Error(
          "Your account is pending approval. Please contact admin.",
        );
      }

      // Check if user is NOT a Customer (staff/admin only)
      if (user.role.name === "Customer") {
        throw new Error(
          "Invalid credentials. Please use the website to login.",
        );
      }

      // Validate password
      const validPassword = await bcrypt.compare(password, user.password);

      if (!validPassword) throw new Error("Invalid password");

      // Generate JWT tokens using the utility function
      const { accessToken, refreshToken } = generateTokens(user);

      // Update the user with the new refresh token
      user.refreshToken = refreshToken;
      user.lastLoginDate = new Date();
      await userRepository.save(user);

      // Return the tokens and user details
      return {
        token: accessToken,
        refreshToken,
        user: {
          ...user,
          password: undefined, // Exclude password from the returned object
        },
      };
    },
    logout: async (_: any, __: any, context: any) => {
      try {
        const decoded = await authenticate(context);
        if (!decoded) throw new Error("Unauthorized");

        const user = await userRepository.findOne({
          where: { id: (await decoded).userId },
        });
        if (!user) throw new Error("User not found");

        // Clear the refresh token to invalidate the session
        user.refreshToken = "";
        await userRepository.save(user);

        return {
          message: "Logout successful",
        };
      } catch (error: any) {
        console.error("Logout error:", error);
        throw new Error(error.message);
      }
    },
    changePassword: async (
      _: any,
      { newPassword }: { newPassword: string },
      context: any,
    ): Promise<boolean> => {
      try {
        const authUser = context.user;
        if (!authUser?.id) {
          throw new ApolloError("Unauthorized", "UNAUTHORIZED");
        }

        const user = await userRepository.findOne({
          where: { id: authUser.id },
        });
        if (!user) throw new ApolloError("User not found", "USER_NOT_FOUND");

        const hashed = await bcrypt.hash(newPassword, 10);
        user.password = hashed;

        await userRepository.save(user);

        return true;
      } catch (error: any) {
        if (error instanceof ApolloError) throw error;
        console.error("Change password error:", error);
        throw new ApolloError(
          error.message || "Failed to change password",
          "CHANGE_PASSWORD_FAILED",
        );
      }
    },
    adminChangePassword: async (
      _: any,
      {
        id,
        oldPassword,
        newPassword,
      }: { id: string; oldPassword: string; newPassword: string },
      context: any,
    ): Promise<boolean> => {
      try {
        const saltRounds = 10;
        const user = await userRepository.findOne({ where: { id } });
        if (!user) throw new ApolloError("User not found", "USER_NOT_FOUND");

        //verify old password
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch)
          throw new ApolloError(
            "Old password is incorrect",
            "INVALID_PASSWORD",
          );
        const hashed = await bcrypt.hash(newPassword, saltRounds);
        user.password = hashed;

        await userRepository.save(user);

        return true;
      } catch (error: any) {
        if (error instanceof ApolloError) throw error;
        console.error("Admin change password error:", error);
        throw new ApolloError(
          error.message || "Failed to change password",
          "ADMIN_CHANGE_PASSWORD_FAILED",
        );
      }
    },
    requestPasswordReset: async (
      _: any,
      { email }: { email: string },
      context: any,
    ): Promise<{ success: boolean; message: string }> => {
      try {
        // Normalize email
        const normalizedEmail = email.trim().toLowerCase();

        // Check if user exists
        const user = await userRepository.findOne({
          where: { email: normalizedEmail },
        });

        if (!user) {
          logger.warn(
            `Password reset requested for non-existent email: ${normalizedEmail}`,
          );
          return {
            success: true,
            message:
              "If an account with that email exists, an OTP has been sent.",
          };
        }

        // Send OTP via Authentica
        const result = await sendEmailOTP(normalizedEmail);

        if (!result.success) {
          throw new Error(result.message || "Failed to send OTP");
        }

        logger.info(`Password reset OTP sent to: ${normalizedEmail}`);

        return {
          success: true,
          message: "OTP has been sent to your email address.",
        };
      } catch (error: any) {
        logger.error("Request password reset error:", error);
        throw new Error(
          error.message || "Failed to process password reset request",
        );
      }
    },
    verifyPasswordResetOTP: async (
      _: any,
      { email, otp }: { email: string; otp: string },
      context: any,
    ): Promise<{ success: boolean; message: string; resetToken?: string }> => {
      try {
        // Normalize email
        const normalizedEmail = email.trim().toLowerCase();

        // Verify OTP with Authentica
        const verificationResult = await verifyEmailOTP(normalizedEmail, otp);

        if (!verificationResult.verified) {
          logger.warn(
            `Failed OTP verification attempt for: ${normalizedEmail}`,
          );
          return {
            success: false,
            message: "Invalid or expired OTP. Please try again.",
          };
        }

        // Check if user exists
        const user = await userRepository.findOne({
          where: { email: normalizedEmail },
        });

        if (!user) {
          logger.warn(`OTP verified but user not found: ${normalizedEmail}`);
          return {
            success: false,
            message: "User not found.",
          };
        }

        // Generate short-lived reset token
        const resetToken = generatePasswordResetToken(normalizedEmail);

        logger.info(`OTP verified successfully for: ${normalizedEmail}`);

        return {
          success: true,
          message: "OTP verified successfully",
          resetToken,
        };
      } catch (error: any) {
        logger.error("Verify password reset OTP error:", error);
        throw new Error(error.message || "Failed to verify OTP");
      }
    },
    verifyEmailOTP: async (
      _: any,
      { email, otp }: { email: string; otp: string },
      context: any,
    ): Promise<{ success: boolean; message: string; resetToken?: string }> => {
      try {
        const normalizedEmail = email.trim().toLowerCase();

        // Get latest unused OTP
        const otpRecord = await otpRepository.findOne({
          where: { email: normalizedEmail, isUsed: false },
          order: { createdAt: "DESC" },
        });

        if (!otpRecord) {
          return {
            success: false,
            message: "OTP not found or already used.",
          };
        }

        if (otpRecord.expiresAt < new Date()) {
          return {
            success: false,
            message: "OTP has expired.",
          };
        }
        const hashedOtp = hashOTP(otp);

        if (hashedOtp !== otpRecord.otpHash) {
          return {
            success: false,
            message: "Invalid OTP.",
          };
        }

        // Mark OTP as used
        otpRecord.isUsed = true;
        await otpRepository.save(otpRecord);

        // OPTIONAL: generate reset token (only if needed)
        // const resetToken = generatePasswordResetToken(normalizedEmail);

        logger.info(`OTP verified successfully for: ${normalizedEmail}`);
        await otpRepository.delete({
          isUsed: true,
        });
        return {
          success: true,
          message: "OTP verified successfully.",
          // resetToken,
        };
      } catch (error: any) {
        logger.error("Verify OTP error:", error);
        throw new Error(error.message || "Failed to verify OTP");
      }
    },
    verifyEmail: async (
      _: any,
      { email }: { email: string },
    ): Promise<string> => {
      try {
        // Normalize email
        const normalizedEmail = email.trim().toLowerCase();

        // Check if user exists
        const user = await userRepository.findOne({
          where: { email: normalizedEmail, isDeleted: false },
        });

        if (user) {
          return "An account with that email exists";
        }
        const generateOTP = () =>
          Math.floor(100000 + Math.random() * 900000).toString();

        // Verify OTP with Authentica
        // const otpResult = await sendEmailOTP(normalizedEmail);

        // if (!otpResult.success) {
        // throw new Error(otpResult.message || "Failed to send OTP");
        // }
        // Cleanup old OTPs for this email
        await otpRepository.delete({ email: normalizedEmail });

        // Generate OTP
        const otp = generateOTP();
        const otpHash = hashOTP(otp);

        // Expiry (5 minutes)
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        // Save OTP
        const otpEntity = otpRepository.create({
          email: normalizedEmail,
          otpHash,
          expiresAt,
        });

        await otpRepository.save(otpEntity);

        await sendEmail({
          to: normalizedEmail,
          subject: "OTP Verification",
          html: baseEmailTemplate({
            title: " ",
            message: `
              <p>Dear User,</p>
              
              <p>To continue with your request, please use the following One-Time Password (OTP):</p>
              
              <h2 style="color:#111827; margin:20px 0;">${otp}</h2>
              
              <p>This code is valid for a limited time and is required to complete the verification process.</p>
              
              <p>If you did not request this action, please disregard this message.</p>
              
              <p style="margin-top:24px;">
                Kind regards,<br />
                <strong>Jusoor Team</strong>
              </p>
            `,
          }),
        });

        return "OTP has been sent to your email address.";
      } catch (error: any) {
        throw new Error(error.message || "Failed to verify OTP");
      }
    },
    resetPasswordWithToken: async (
      _: any,
      { resetToken, newPassword }: { resetToken: string; newPassword: string },
      context: any,
    ): Promise<{ success: boolean; message: string }> => {
      try {
        // Verify and decode the reset token
        let email: string;
        try {
          email = verifyPasswordResetToken(resetToken);
        } catch (error: any) {
          logger.warn(`Invalid reset token used`);
          throw new Error(error.message || "Invalid or expired reset token");
        }

        // Find user
        const user = await userRepository.findOne({
          where: { email },
        });

        if (!user) {
          logger.error(`User not found for verified token: ${email}`);
          throw new Error("User not found");
        }

        // Hash new password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update user password
        user.password = hashedPassword;
        await userRepository.save(user);

        logger.info(`Password successfully reset for user: ${email}`);

        return {
          success: true,
          message: "Password has been reset successfully.",
        };
      } catch (error: any) {
        logger.error("Reset password with token error:", error);
        throw new Error(error.message || "Failed to reset password");
      }
    },
    createUser: async (
      _: any,
      { input }: { input: CreateUserInput },
      context: any,
    ) => {
      try {
        // const usercxt = await authenticate(context);
        // Auto-assign Customer role if roleId not provided (self-registration)
        const userRole = input.roleId
          ? await roleRepository.findOne({ where: { id: input.roleId } })
          : await roleRepository.findOne({ where: { name: "Customer" } });

        const saltRounds = 10;

        // normalize email
        const normalizedEmail = input.email?.trim().toLowerCase();

        // best-effort check for existing (case-insensitive) using ILike for database-level case-insensitive search
        const existingUser = await userRepository.findOne({
          where: { email: ILike(normalizedEmail), isDeleted: false },
        });
        if (existingUser) {
          throw new Error("The email already exists");
        }

        if (!userRole) {
          throw new Error("Customer role not found. Please contact support.");
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(input.password, saltRounds);
        const { password, ...userData } = input;

        // Create the new user
        const newUser = userRepository.create({
          ...userData,
          picture: input.picture,
          role: userRole,
          password: hashedPassword,
          status: UserStatus.verified,
          createdAt: new Date(),
        });

        // Save the user in the database
        const savedUser = await userRepository.save(newUser);
        logger.info(`🚀 savedUser:${savedUser}`);

        // Process documents array - use Promise.all to wait for all saves
        if (input.documents && input.documents.length > 0) {
          const persistedIds = (
            await Promise.all(
              input.documents.map(async (docInput) => {
                const docEntity = documentRepository.create({
                  title: docInput.title,
                  fileName: docInput.fileName,
                  fileType: docInput.fileType,
                  filePath: docInput.filePath,
                  description: docInput.description,
                  businessId: docInput.businessId,
                  createdBy: savedUser.id,
                  userId: savedUser.id,
                });

                docEntity.user = savedUser; // ensure relation joins populate

                const persisted = await documentRepository.save(docEntity);
                if (!persisted?.id) {
                  logger.warn(
                    "Document save returned without id..........................",
                    persisted,
                  );
                }
                return persisted?.id ?? null;
              }),
            )
          ).filter((id): id is string => Boolean(id));

          if (persistedIds.length) {
            const docsAfterSave = await documentRepository.find({
              where: { id: In(persistedIds) },
              select: ["id", "userId"],
            });

            const missingUserLink = docsAfterSave.filter((doc) => !doc.userId);
            if (missingUserLink.length) {
              logger.warn(
                "⚠️ Document records saved without userId..........................",
                {
                  missingDocs: missingUserLink.map((doc) => doc.id),
                },
              );
            } else {
              logger.info(
                `✅ Documents persisted with userId.....................  : ${persistedIds.length}`,
              );
            }
          }
        }

        // Notify all admins
        const admins = await userRepository.find({
          where: { isDeleted: false, role: { name: Not("Customer") } },
        });

        for (const admin of admins) {
          const notification = notificationRepository.create({
            name: "New User",
            message: `A new user has been created: ${
              savedUser.name || savedUser.email
            }`,
            user: admin,
          });
          const savedNotification =
            await notificationRepository.save(notification);
          await pubsub.publish("NEW_NOTIFICATION", {
            newNotification: savedNotification,
          });
        }

        const validPassword = await bcrypt.compare(
          password,
          savedUser.password,
        );

        if (!validPassword) throw new Error("Invalid password");

        // Generate JWT tokens using the utility function
        const { accessToken, refreshToken } = generateTokens(savedUser);

        // Update the user with the new refresh token
        savedUser.refreshToken = refreshToken;
        savedUser.lastLoginDate = new Date();
        await userRepository.save(savedUser);

        // Reload user with documents to return complete data
        const userWithDocuments = await userRepository.findOne({
          where: { id: savedUser.id },
          relations: ["documents", "role"],
        });

        const html = baseEmailTemplate({
          title: " ",
          message: `
            <p>Dear <strong>${savedUser.name || "User"}</strong>,</p>

            <p>Welcome to Jusoor.</p>

            <p>
              We are pleased to have you join our platform, designed to facilitate the
              buying and selling of businesses in a secure and transparent manner.
            </p>

            <p>
              You may browse listings and explore opportunities while your account is being verified.
            </p>

            <p>
              We look forward to supporting you throughout your journey on Jusoor.
            </p>

            <p style="margin-top:24px;">
              Warm regards,<br />
              <strong>Jusoor Team</strong><br />
              <span>Jusoor… shorten the path</span>
            </p>
          `,
        });

        await sendEmail({
          to: savedUser.email,
          subject: "User Registration (Welcome Mail)",
          html,
        });

        return {
          token: accessToken,
          refreshToken,
          user: userWithDocuments,
        };
      } catch (error) {
        throw Error(`Error on create User${error}`);
      }
    },
    createStaff: async (
      _: any,
      { input }: { input: CreateUserInput },
      context: any,
    ) => {
      try {
        // 1) Authenticate and ensure caller is admin
        const usercxt = await authenticate(context);
        if (usercxt.roles.name === "Customer") {
          throw new Error("Unauthorized");
        }

        const userRole = await roleRepository.findOne({
          where: { id: input.roleId },
        });
        if (!userRole) throw new Error("Specified role does not exist");

        // 2) Normalize email & prevent duplicates (case-insensitive)
        const normalizedEmail = input.email?.trim().toLowerCase();
        const existingUser = await userRepository.findOne({
          where: { email: ILike(normalizedEmail), isDeleted: false },
        });
        if (existingUser) throw new Error("The email already exists");

        // 3) Hash password and create user
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(input.password, saltRounds);

        // Exclude password from input to prevent overwriting hashed password
        const { password, ...userDataWithoutPassword } = input;

        const newUser = userRepository.create({
          ...userDataWithoutPassword,
          email: normalizedEmail,
          password: hashedPassword,
          role: userRole,
          createdAt: new Date(),
        });
        const savedUser = await userRepository.save(newUser);
        logger.info(`🚀 savedStaff:${savedUser}`);

        // 4) Process documents array - use Promise.all to wait for all saves
        if (input.documents && input.documents.length > 0) {
          const persistedIds = (
            await Promise.all(
              input.documents.map(async (docInput) => {
                const docEntity = documentRepository.create({
                  title: docInput.title,
                  fileName: docInput.fileName,
                  fileType: docInput.fileType,
                  filePath: docInput.filePath,
                  description: docInput.description,
                  businessId: docInput.businessId,
                  createdBy: savedUser.id,
                  userId: savedUser.id,
                });

                docEntity.user = savedUser; // ensure relation joins populate

                const persisted = await documentRepository.save(docEntity);
                if (!persisted?.id) {
                  logger.warn(
                    "Document save returned without id..........................",
                    persisted,
                  );
                }
                return persisted?.id ?? null;
              }),
            )
          ).filter((id): id is string => Boolean(id));

          if (persistedIds.length) {
            const docsAfterSave = await documentRepository.find({
              where: { id: In(persistedIds) },
              select: ["id", "userId"],
            });

            const missingUserLink = docsAfterSave.filter((doc) => !doc.userId);
            if (missingUserLink.length) {
              logger.warn(
                "⚠️ Document records saved without userId..........................",
                {
                  missingDocs: missingUserLink.map((doc) => doc.id),
                },
              );
            } else {
              logger.info(
                `✅ Documents persisted with userId.....................  : ${persistedIds.length}`,
              );
            }
          }
        }

        // 5) Send welcome email to staff
        const html = baseEmailTemplate({
          title: " ",
          message: `
            <p>Dear <strong>${savedUser.name}</strong>,</p>
        
            <h2 style="color:#111827; margin-top:16px;">
              Welcome to Jusoor Team 🎉
            </h2>
        
            <p>
              Your account has been created successfully. Our team will review your details and
              verify your account shortly. You will receive a notification once your account is verified.
            </p>
        
            <p>
              If you need any help, please contact your administrator.
            </p>
        
            <p style="margin-top:24px;">
              Warm regards,<br />
              <strong>Team Jusoor</strong>
            </p>
          `,
        });

        await sendEmail({
          to: savedUser.email,
          subject: "Welcome to Jusoor Team 🎉",
          html,
        });

        // 6) Reload user with documents to return complete data
        const user = await userRepository.findOne({
          where: { id: savedUser.id },
          relations: ["role", "documents"],
        });
        return { staff: user };
      } catch (error) {
        throw new Error(`Error on createStaff: ${error}`);
      }
    },
    updateUser: async (
      _: any,
      { input }: { input: UpdateUserInput },
      context: any,
    ) => {
      try {
        // Fetch the existing user
        const existingUser = await userRepository.findOne({
          where: { id: input.id },
          relations: ["documents"],
        });
        if (!existingUser) throw new Error("User not found");

        // Check if the email is being updated and is unique
        if (input.email && input.email !== existingUser.email) {
          const normalizedEmail = input.email.trim().toLowerCase();
          const userWithEmail = await userRepository.findOne({
            where: { email: ILike(normalizedEmail) },
          });
          if (userWithEmail && userWithEmail.id !== input.id)
            throw new Error("Email already in use by another user");
          input.email = normalizedEmail;
        }

        // Hash password if it's being updated
        if (input.password) {
          const saltRounds = 10;
          input.password = await bcrypt.hash(input.password, saltRounds);
        }

        // Fetch the new role if provided
        // let userRole = undefined;
        // if (input.roleId) {
        //   userRole = await roleRepository.findOne({ where: { id: input.roleId } });
        //   if (!userRole) {
        //     throw new Error('Specified role does not exist');
        //   }
        // }

        // Update the user data
        const updatedUser = {
          ...existingUser,
          ...input,
          // role: userRole || existingUser.role, // Only update role if new one is provided
        };

        if (input.documents && input.documents.length > 0) {
          const persistedIds = (
            await Promise.all(
              input.documents.map(async (docInput: any) => {
                if (docInput.id) {
                  const existingDoc = await documentRepository.findOne({
                    where: { id: docInput.id },
                  });
                  if (existingDoc) {
                    if (docInput.title !== undefined)
                      existingDoc.title = docInput.title;
                    if (docInput.fileName !== undefined)
                      existingDoc.fileName = docInput.fileName;
                    if (docInput.fileType !== undefined)
                      existingDoc.fileType = docInput.fileType;
                    if (docInput.filePath !== undefined)
                      existingDoc.filePath = docInput.filePath;
                    if (docInput.description !== undefined)
                      existingDoc.description = docInput.description;
                    if (docInput.businessId !== undefined)
                      existingDoc.businessId = docInput.businessId;

                    const updated = await documentRepository.save(existingDoc);
                    logger.info(`✅ Document updated: ${updated.id}`);
                    return updated.id;
                  } else {
                    logger.warn(
                      `⚠️ Document with id ${docInput.id} not found for update`,
                    );
                    return null;
                  }
                } else {
                  // Create new document
                  const docEntity = documentRepository.create({
                    title: docInput.title,
                    fileName: docInput.fileName,
                    fileType: docInput.fileType,
                    filePath: docInput.filePath,
                    description: docInput.description,
                    businessId: docInput.businessId,
                    createdBy: existingUser.id,
                    userId: existingUser.id,
                  });

                  docEntity.user = existingUser; // ensure relation joins populate

                  const persisted = await documentRepository.save(docEntity);
                  if (!persisted?.id) {
                    logger.warn(
                      "Document save returned without id..........................",
                      persisted,
                    );
                  }
                  logger.info(`✅ New document created: ${persisted?.id}`);
                  return persisted?.id ?? null;
                }
              }),
            )
          ).filter((id): id is string => Boolean(id));

          if (persistedIds.length) {
            logger.info(`✅ Documents processed: ${persistedIds.length}`);
          }
        }

        // B-01: Notify user when status transitions to under_review
        if (
          input.status === UserStatus.under_review &&
          existingUser.status !== UserStatus.under_review
        ) {
          const notification = notificationRepository.create({
            name: "Account Under Review",
            message: `Your account documents have been received and are currently under review. We will notify you once the review is complete.`,
            user: updatedUser,
          });
          const savedNotification =
            await notificationRepository.save(notification);
          await pubsub.publish("NEW_NOTIFICATION", {
            newNotification: savedNotification,
          });

          const htmlEn = baseEmailTemplate({
            title: " ",
            message: `
              <p>Dear <strong>${updatedUser.name || "User"}</strong>,</p>

              <p>Thank you for submitting your documents on Jusoor.</p>

              <p>
                Your account is now under review. Our team will verify your information and notify you once the process is complete.
              </p>

              <p>
                This typically takes 1–2 business days. You may continue browsing listings in the meantime.
              </p>

              <p style="margin-top:24px;">
                Warm regards,<br />
                <strong>Jusoor Team</strong><br />
                <span>Jusoor… shorten the path</span>
              </p>
            `,
          });

          const htmlAr = baseEmailTemplate({
            title: " ",
            message: `
              <div dir="rtl" style="text-align:right; font-family: Arial, sans-serif;">
                <p>عزيزنا <strong>${updatedUser.name || "المستخدم"}</strong>،</p>

                <p>شكراً لك على تقديم وثائقك على منصة جسور.</p>

                <p>
                  حسابك قيد المراجعة حالياً. سيقوم فريقنا بالتحقق من معلوماتك وإخطارك فور الانتهاء من العملية.
                </p>

                <p>
                  تستغرق هذه العملية عادةً من 1 إلى 2 يوم عمل. يمكنك الاستمرار في تصفح الإدراجات في هذه الأثناء.
                </p>

                <p style="margin-top:24px;">
                  مع أطيب التحيات،<br />
                  <strong>فريق جسور</strong><br />
                  <span>جسور… قصّر المسافة</span>
                </p>
              </div>
            `,
          });

          // Send bilingual emails (EN + AR)
          await sendEmail({
            to: updatedUser.email,
            subject: "Account Under Review | حسابك قيد المراجعة",
            html: htmlEn + `<hr style="margin:32px 0;border-color:#eee;" />` + htmlAr,
          });
        }

        // B-02: Notify user when status is set back to pending (account verification rejected)
        if (
          input.status === UserStatus.pending &&
          existingUser.status === UserStatus.under_review
        ) {
          const notification = notificationRepository.create({
            name: "Account Review Update",
            message: `Your account verification was not approved at this time. Please review your submitted documents and resubmit.`,
            user: updatedUser,
          });
          const savedNotification =
            await notificationRepository.save(notification);
          await pubsub.publish("NEW_NOTIFICATION", {
            newNotification: savedNotification,
          });

          const htmlEn = baseEmailTemplate({
            title: " ",
            message: `
              <p>Dear <strong>${updatedUser.name || "User"}</strong>,</p>

              <p>We have reviewed your account verification documents on Jusoor.</p>

              <p>
                Unfortunately, your verification could not be approved at this time. This may be due to incomplete or unclear documents.
              </p>

              <p>
                Please log in to your account, review the requirements, and resubmit your documents. Our team will review your updated submission promptly.
              </p>

              <p>
                If you have any questions, please contact our support team.
              </p>

              <p style="margin-top:24px;">
                Warm regards,<br />
                <strong>Jusoor Team</strong><br />
                <span>Jusoor… shorten the path</span>
              </p>
            `,
          });

          const htmlAr = baseEmailTemplate({
            title: " ",
            message: `
              <div dir="rtl" style="text-align:right; font-family: Arial, sans-serif;">
                <p>عزيزنا <strong>${updatedUser.name || "المستخدم"}</strong>،</p>

                <p>لقد راجعنا وثائق التحقق من حسابك على منصة جسور.</p>

                <p>
                  للأسف، لم نتمكن من الموافقة على طلب التحقق في الوقت الحالي. قد يكون ذلك بسبب وثائق غير مكتملة أو غير واضحة.
                </p>

                <p>
                  يرجى تسجيل الدخول إلى حسابك ومراجعة المتطلبات وإعادة تقديم وثائقك. سيقوم فريقنا بمراجعة طلبك المحدّث في أقرب وقت.
                </p>

                <p>
                  إذا كانت لديك أي استفسارات، يرجى التواصل مع فريق الدعم لدينا.
                </p>

                <p style="margin-top:24px;">
                  مع أطيب التحيات،<br />
                  <strong>فريق جسور</strong><br />
                  <span>جسور… قصّر المسافة</span>
                </p>
              </div>
            `,
          });

          await sendEmail({
            to: updatedUser.email,
            subject: "Account Verification Update | تحديث حول التحقق من حسابك",
            html: htmlEn + `<hr style="margin:32px 0;border-color:#eee;" />` + htmlAr,
          });
        }

        if (
          input.status === UserStatus.verified &&
          existingUser.status !== UserStatus.verified
        ) {
          const notification = notificationRepository.create({
            name: "Account Verified",
            message: `Your account has been verified successfully.`,
            user: updatedUser,
          });
          const savedNotification =
            await notificationRepository.save(notification);
          await pubsub.publish("NEW_NOTIFICATION", {
            newNotification: savedNotification,
          });
          // Send verification email to user — B-07: bilingual EN + AR
          const htmlEn = baseEmailTemplate({
            title: " ",
            message: `
              <p>Dear <strong>${updatedUser.name || "User"}</strong>,</p>

              <p>We’re happy to have you on Jusoor.</p>

              <p>
                Your account has been successfully verified, and you now have full access to the platform and its features.
              </p>

              <p>
                You may proceed with exploring opportunities, engaging with listings, and managing your activities with confidence — Jusoor shortens the path.
              </p>

              <p style="margin-top:24px;">
                Warm regards,<br />
                <strong>Jusoor Team</strong>
              </p>
            `,
          });

          const htmlAr = baseEmailTemplate({
            title: " ",
            message: `
              <div dir="rtl" style="text-align:right; font-family: Arial, sans-serif;">
                <p>عزيزنا <strong>${updatedUser.name || "المستخدم"}</strong>،</p>

                <p>يسعدنا انضمامك إلى منصة جسور.</p>

                <p>
                  تم التحقق من حسابك بنجاح، وأصبح بإمكانك الآن الوصول الكامل إلى المنصة وجميع ميزاتها.
                </p>

                <p>
                  يمكنك المضي قدماً في استكشاف الفرص والتفاعل مع الإدراجات وإدارة أنشطتك بكل ثقة — جسور يقصّر المسافة.
                </p>

                <p style="margin-top:24px;">
                  مع أطيب التحيات،<br />
                  <strong>فريق جسور</strong>
                </p>
              </div>
            `,
          });

          const html = htmlEn + `<hr style="margin:32px 0;border-color:#eee;" />` + htmlAr;

          await sendEmail({
            to: updatedUser.email,
            subject: "Account Verified | تم التحقق من حسابك",
            html,
          });

          // Send verification email to admins
          const admins = await userRepository.find({
            where: {
              isDeleted: false,
              role: { name: Not("Customer") },
            },
          });

          for (const admin of admins) {
            if (!admin.email) continue;

            const adminHtml = baseEmailTemplate({
              title: " ",
              message: `
                <p>Dear Admin,</p>

                <p>A user account has been successfully verified on Jusoor.</p>

                <p>Regards,<br />Jusoor System</p>
              `,
            });

            await sendEmail({
              to: admin.email,
              subject: "User Verification",
              html: adminHtml,
            });
          }
        }
        // Save the updated user in the database
        await userRepository.save(updatedUser);

        // Reload user with documents to return complete data
        const userWithDocuments = await userRepository.findOne({
          where: { id: input.id },
          relations: ["documents", "role"],
        });

        // Return the updated user (excluding the password)
        return {
          ...userWithDocuments,
          password: undefined,
        };
      } catch (error) {
        throw Error(`error on updating User ${error}`);
      }
    },
    deleteUser: async (_: any, { id }: { id: string }) => {
      try {
        const user = await userRepository.findOne({
          where: { id },
          relations: ["role"],
        });
        if (!user) throw new Error("User not found");
        // if (user.role.name === "Super Admin") {
        //   throw new Error(`Cannot delete user with role Super Admin`);
        // }
        user.isDeleted = true;
        await userRepository.save(user);
        return true;
      } catch (error) {
        throw new Error(`Error on deleting role ${error}`);
      }
    },
    refreshToken: async (_: any, { token }: { token: string }) => {
      if (!token) throw new Error("No refresh token provided");

      try {
        // Verify refresh token and get user
        const user = await verifyRefreshToken(token);

        // Generate a new access token
        const { accessToken } = generateTokens(user);

        return {
          refreshToken: user.refreshToken,
          token: accessToken, // Return as 'token' for consistency with login
          user: {
            ...user,
            password: undefined,
          },
        };
      } catch (error: any) {
        // If refresh token is expired, user needs to login again
        if (error.message === "REFRESH_TOKEN_EXPIRED") {
          // Clear the refresh token from database
          const userRepository = dataSource.getRepository(User);
          try {
            const decoded: any = jwt.decode(token);
            if (decoded?.userId) {
              const user = await userRepository.findOne({
                where: { id: decoded.userId },
              });
              if (user) {
                user.refreshToken = "";
                await userRepository.save(user);
              }
            }
          } catch (e) {
            // Ignore if we can't clear the token
          }
          throw new Error("Refresh token expired. Please login again.");
        }
        throw new Error(`Invalid or expired refresh token: ${error.message}`);
      }
    },
    deleteRole: async (_: any, { id }: { id: string }) => {
      try {
        const role = await roleRepository.findOne({ where: { id } });
        if (!role) throw new Error("Role not found");
        role.isDeleted = true;
        await roleRepository.save(role);
        return true;
      } catch (error) {
        throw new Error(`Error on creating role ${error}`);
      }
    },
  },
};

export default userResolvers;

export const generateOTP = (): string =>
  Math.floor(100000 + Math.random() * 900000).toString();

export const hashOTP = (otp: string): string =>
  crypto.createHash("sha256").update(otp).digest("hex");
