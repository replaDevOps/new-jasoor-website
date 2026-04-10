import { authenticate } from "../../utils/authUtils";
import { dataSource } from "../../datasource";
import {
  Business,
  User,
  Inventory,
  Liability,
  Asset,
  Category,
  Document,
  BusinessView,
  Deal,
  Meeting,
  Notification,
  Role,
} from "../../entity";
import {
  CreateBusinessInput,
  UpdateBusinessInput,
  BusinessFilterInput,
  BusinessSortInput,
  UpdateBusinessProcessInput,
  AdminBusinessFilterInput,
} from "types";
import {
  Between,
  DeepPartial,
  Equal,
  ILike,
  In,
  IsNull,
  LessThanOrEqual,
  MoreThanOrEqual,
  Not,
} from "typeorm";
import { BusinessStatus, DealStatus, MeetingStatus } from "../../enum";
import { pubsub } from "../../server";
import { logger } from "../../utils/logger";
import jwt from "jsonwebtoken";
import { sendEmail } from "../../services/emailService";
import { baseEmailTemplate } from "../../utils/emailTemplates";

const userRepo = dataSource.getRepository(User);
const businessRepo = dataSource.getRepository(Business);
const businessViewRepo = dataSource.getRepository(BusinessView);
const categoryRepo = dataSource.getRepository(Category);
const inventoryRepo = dataSource.getRepository(Inventory);
const liabilityRepo = dataSource.getRepository(Liability);
const assetRepo = dataSource.getRepository(Asset);
const documentRepo = dataSource.getRepository(Document);
const dealRepo = dataSource.getRepository(Deal);
const meetingRepo = dataSource.getRepository(Meeting);
const notificationRepository = dataSource.getRepository(Notification);

// Helper function to extract userId from raw authorization token
const getUserIdFromToken = (rawAuthorization: string | null): string | null => {
  if (!rawAuthorization) return null;
  try {
    const token = rawAuthorization.replace(/^Bearer\s*/i, "");
    const decoded = jwt.decode(token) as { userId?: string } | null;
    return decoded?.userId || null;
  } catch (error) {
    logger.warn("Failed to decode token from rawAuthorization");
    return null;
  }
};

const businessResolver = {
  Query: {
    getAllBusinesses: async (
      _: any,
      {
        limit,
        offSet,
        filter,
        sort,
        search,
      }: {
        limit: number;
        offSet: number;
        sort: BusinessSortInput;
        filter: BusinessFilterInput;
        search: string;
      },
      context: any,
    ) => {
      try {
        let user: User | null = null;
        let userId: string | null = null;
        let role: Role | null = null;
        let where: any = {};

        // Try to extract userId from context or rawAuthorization token
        if (context?.userId) {
          userId = context.userId;
          const ctxUser = await authenticate(context);
          if (ctxUser?.userId) {
            user = await userRepo.findOne({
              where: { id: ctxUser.userId },
              relations: ["role"],
            });
            if (!user) throw new Error("User not found");
            role = user.role;
          }
        } else if (context?.rawAuthorization) {
          // Extract userId from token for public API calls
          userId = getUserIdFromToken(context.rawAuthorization);
          if (userId) {
            user = await userRepo.findOne({
              where: { id: userId },
              relations: ["role"],
            });
            if (user) {
              role = user.role;
            }
          }
        }

        if (role?.name === "Manager" || role?.name === "Super Admin") {
          logger.info(`Role Name ${role?.name}`);
          where = {};
        } else if (role?.name === "Customer") {
          logger.info(`Role Name ${role?.name}`);
          // Only apply restriction if no explicit status filter
          if (!filter?.businessStatus) {
            where = { businessStatus: Not(BusinessStatus.UNDER_REVIEW) };
          } else {
            where = {}; // allow filter.status to work
          }
        } else {
          // fallback: default safe behavior
          where = {};
        }

        // Apply filters using TypeORM's native conditions
        if (filter) {
          const {
            district,
            city,
            priceRange,
            revenueRange,
            profitRange,
            profitMargenRange,
            employeesRange,
            operationalYearRange,
            hasAssets,
            multiple,
            startDate,
            endDate,
            businessStatus,
            categoryId,
          } = filter;

          if (district != null && district !== "") {
            where.district = ILike(`%${district}%`);
          }

          if (city != null && city !== "") {
            where.city = ILike(`%${city}%`);
          }

          if (priceRange && Array.isArray(priceRange)) {
            let [minPrice, maxPrice] = priceRange;
            if (minPrice != null && maxPrice != null && minPrice > maxPrice) {
              [minPrice, maxPrice] = [maxPrice, minPrice];
            }
            if (minPrice != null && maxPrice != null) {
              where.price = Between(minPrice, maxPrice);
            } else if (minPrice != null) {
              where.price = MoreThanOrEqual(minPrice);
            } else if (maxPrice != null) {
              where.price = LessThanOrEqual(maxPrice);
            }
          }

          if (revenueRange && Array.isArray(revenueRange)) {
            const [minRevenue, maxRevenue] = revenueRange;

            if (minRevenue != null && maxRevenue != null) {
              where.revenue = Between(minRevenue, maxRevenue);
            } else if (minRevenue != null) {
              where.revenue = MoreThanOrEqual(minRevenue);
            } else if (maxRevenue != null) {
              where.revenue = LessThanOrEqual(maxRevenue);
            }
          }

          // Profit Range
          if (profitRange && Array.isArray(profitRange)) {
            const [minProfit, maxProfit] = profitRange;

            if (minProfit != null && maxProfit != null) {
              where.profit = Between(minProfit, maxProfit);
            } else if (minProfit != null) {
              where.profit = MoreThanOrEqual(minProfit);
            } else if (maxProfit != null) {
              where.profit = LessThanOrEqual(maxProfit);
            }
          }

          // Profit Margin Range
          if (profitMargenRange && Array.isArray(profitMargenRange)) {
            const [first, second] = profitMargenRange;
            if (typeof first === "number" && typeof second === "number") {
              where.profitMargen = Between(first, second);
            } else if (typeof first === "number") {
              where.profitMargen = MoreThanOrEqual(first);
            } else if (typeof second === "number") {
              where.profitMargen = LessThanOrEqual(second);
            }
          }
          if (multiple != null) {
            where.multiple = LessThanOrEqual(filter.multiple);
          }

          if (
            typeof employeesRange === "string" &&
            employeesRange.includes("-")
          ) {
            const [min, max] = employeesRange.split("-").map(Number);
            if (!isNaN(min) && !isNaN(max)) {
              where.numberOfEmployees = Between(min, max);
            }
          }

          if (operationalYearRange && operationalYearRange.includes("-")) {
            const [minStr, maxStr] = operationalYearRange.split("-");
            const minYears = Number(minStr);
            const maxYears = Number(maxStr);

            if (!isNaN(minYears) && !isNaN(maxYears)) {
              const currentDate = new Date();
              const currentYear = currentDate.getFullYear();

              const maxDate = new Date(
                `${currentYear - minYears}-12-31T23:59:59.999Z`,
              );
              const minDate = new Date(
                `${currentYear - maxYears}-01-01T00:00:00.000Z`,
              );

              where.foundedDate = Between(minDate, maxDate);
            }
          }

          if (startDate && endDate) {
            where.createdAt = Between(new Date(startDate), new Date(endDate));
          } else if (startDate) {
            where.createdAt = MoreThanOrEqual(new Date(startDate));
          } else if (endDate) {
            where.createdAt = LessThanOrEqual(new Date(endDate));
          }
          if (categoryId) {
            where.category = { id: categoryId };
          }
          if (businessStatus) {
            where.businessStatus = businessStatus;
          }
        }
        if (search) {
          where.businessTitle = ILike(`%${search}%`);
        }
        const totalActiveCount = await businessRepo.count({
          where: { isDeleted: false, businessStatus: BusinessStatus.ACTIVE },
        });
        const totalPendingCount = await businessRepo.count({
          where: {
            isDeleted: false,
            businessStatus: BusinessStatus.UNDER_REVIEW,
          },
        });

        const [businesses, businessCount] = await businessRepo.findAndCount({
          where: {
            ...where,
            ...(filter?.hasAssets === true && {
              assets: { id: Not(IsNull()) },
            }),
            ...(filter?.hasAssets === false && { assets: { id: IsNull() } }),
            ...(BusinessStatus.ACTIVE && {
              businessStatus: BusinessStatus.ACTIVE,
            }),
          },
          take: limit,
          skip: offSet,
          relations: ["category", "savedBy", "offers"],
          order: sort?.price ? { price: sort.price } : { createdAt: "DESC" },
        });

        // If userId is available (authenticated or from token), check isSaved status
        const result = businesses.map((biz) => ({
          ...biz,
          isSaved: userId
            ? biz.savedBy?.some((savedUser) => savedUser.id === userId) || false
            : false,
        }));

        return {
          businesses: result,
          totalCount: businessCount,
          totalActiveCount,
          totalPendingCount,
        };
      } catch (err) {
        throw new Error(`Failed to fetch businesses ${err}`);
      }
    },
    getAdminBusinesses: async (
      _: any,
      {
        limit,
        offSet,
        filter,
        search,
      }: {
        limit: number;
        offSet: number;
        filter: AdminBusinessFilterInput;
        search: string;
      },
      context: any,
    ) => {
      try {
        let user: User | null = null;
        let role: Role | null = null;
        let where: any = {};
        // Authenticate user if context is present
        if (context?.userId) {
          const ctxUser = await authenticate(context);
          if (ctxUser?.userId) {
            user = await userRepo.findOne({
              where: { id: ctxUser.userId },
              relations: ["role"],
            });
            if (!user) throw new Error("User not found");
            role = user.role;
          }
        }
        // Apply filters using TypeORM's native conditions
        if (filter) {
          const { startDate, endDate, businessStatus, categoryId } = filter;

          if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            where.createdAt = Between(start, end);
          } else if (startDate) {
            where.createdAt = MoreThanOrEqual(new Date(startDate));
          } else if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            where.createdAt = LessThanOrEqual(end);
          }
          if (categoryId) {
            where.category = { id: categoryId };
          }
          if (businessStatus) {
            where.businessStatus = businessStatus;
          }
        }
        if (search) {
          where.businessTitle = ILike(`%${search}%`);
        }
        const totalActiveCount = await businessRepo.count({
          where: { isDeleted: false, businessStatus: BusinessStatus.ACTIVE },
        });
        const totalPendingCount = await businessRepo.count({
          where: {
            isDeleted: false,
            businessStatus: BusinessStatus.UNDER_REVIEW,
          },
        });

        const [businesses, businessCount] = await businessRepo.findAndCount({
          where: { ...where },
          take: limit,
          skip: offSet,
          relations: [
            "seller",
            "category",
            "assets",
            "liabilities",
            "inventoryItems",
            "documents",
            "savedBy",
            "views",
          ],
          order: { createdAt: "DESC" },
        });

        // If the user is authenticated, filter businesses by savedBy
        const result = businesses.map((biz) => ({
          ...biz,
          isSaved: user
            ? biz.savedBy?.some((savedUser) => savedUser.id === user.id) ||
              false
            : false,
        }));

        return {
          businesses: result,
          totalCount: businessCount,
          totalActiveCount,
          totalPendingCount,
        };
      } catch (err) {
        throw new Error(`Failed to fetch businesses ${err}`);
      }
    },
    getAllBusinessesByCategory: async (
      _: any,
      {
        category,
        limit,
        offset,
        sort,
        filter,
        search,
      }: {
        category: string;
        limit: number;
        offset: number;
        sort?: BusinessSortInput;
        filter?: BusinessFilterInput;
        search?: string;
      },
      context: any,
    ) => {
      let userId: string | null = null;

      // Try to extract userId from context or rawAuthorization token
      if (context?.userId) {
        userId = context.userId;
      } else if (context?.rawAuthorization) {
        userId = getUserIdFromToken(context.rawAuthorization);
      }

      let where: any = {
        category: {
          name: ILike(`%${category}%`),
        },
        isDeleted: false,
        businessStatus: BusinessStatus.ACTIVE,
      };

      // Apply all filters from BusinessFilterInput
      if (filter) {
        const {
          district,
          city,
          priceRange,
          revenueRange,
          profitRange,
          profitMargenRange,
          employeesRange,
          operationalYearRange,
          hasAssets,
          multiple,
          startDate,
          endDate,
          businessStatus,
        } = filter;

        if (district != null && district !== "") {
          where.district = ILike(`%${district}%`);
        }

        if (city != null && city !== "") {
          where.city = ILike(`%${city}%`);
        }

        if (priceRange && Array.isArray(priceRange)) {
          let [minPrice, maxPrice] = priceRange;
          if (minPrice != null && maxPrice != null && minPrice > maxPrice) {
            [minPrice, maxPrice] = [maxPrice, minPrice];
          }
          if (minPrice != null && maxPrice != null) {
            where.price = Between(minPrice, maxPrice);
          } else if (minPrice != null) {
            where.price = MoreThanOrEqual(minPrice);
          } else if (maxPrice != null) {
            where.price = LessThanOrEqual(maxPrice);
          }
        }

        if (revenueRange && Array.isArray(revenueRange)) {
          const [minRevenue, maxRevenue] = revenueRange;

          if (minRevenue != null && maxRevenue != null) {
            where.revenue = Between(minRevenue, maxRevenue);
          } else if (minRevenue != null) {
            where.revenue = MoreThanOrEqual(minRevenue);
          } else if (maxRevenue != null) {
            where.revenue = LessThanOrEqual(maxRevenue);
          }
        }

        if (profitRange && Array.isArray(profitRange)) {
          const [minProfit, maxProfit] = profitRange;

          if (minProfit != null && maxProfit != null) {
            where.profit = Between(minProfit, maxProfit);
          } else if (minProfit != null) {
            where.profit = MoreThanOrEqual(minProfit);
          } else if (maxProfit != null) {
            where.profit = LessThanOrEqual(maxProfit);
          }
        }

        if (profitMargenRange && Array.isArray(profitMargenRange)) {
          const [first, second] = profitMargenRange;
          if (typeof first === "number" && typeof second === "number") {
            where.profitMargen = Between(first, second);
          } else if (typeof first === "number") {
            where.profitMargen = MoreThanOrEqual(first);
          } else if (typeof second === "number") {
            where.profitMargen = LessThanOrEqual(second);
          }
        }

        if (multiple != null) {
          where.multiple = LessThanOrEqual(multiple);
        }

        if (
          typeof employeesRange === "string" &&
          employeesRange.includes("-")
        ) {
          const [min, max] = employeesRange.split("-").map(Number);
          if (!isNaN(min) && !isNaN(max)) {
            where.numberOfEmployees = Between(min, max);
          }
        }

        if (operationalYearRange && operationalYearRange.includes("-")) {
          const [minStr, maxStr] = operationalYearRange.split("-");
          const minYears = Number(minStr);
          const maxYears = Number(maxStr);

          if (!isNaN(minYears) && !isNaN(maxYears)) {
            const currentDate = new Date();
            const currentYear = currentDate.getFullYear();

            const maxDate = new Date(
              `${currentYear - minYears}-12-31T23:59:59.999Z`,
            );
            const minDate = new Date(
              `${currentYear - maxYears}-01-01T00:00:00.000Z`,
            );

            where.foundedDate = Between(minDate, maxDate);
          }
        }

        if (startDate && endDate) {
          where.createdAt = Between(new Date(startDate), new Date(endDate));
        } else if (startDate) {
          where.createdAt = MoreThanOrEqual(new Date(startDate));
        } else if (endDate) {
          where.createdAt = LessThanOrEqual(new Date(endDate));
        }

        if (businessStatus) {
          where.businessStatus = businessStatus;
        }
      }

      if (search) {
        where.businessTitle = ILike(`%${search}%`);
      }

      const [businesses, count] = await businessRepo.findAndCount({
        where: {
          ...where,
          ...(filter?.hasAssets === true && { assets: { id: Not(IsNull()) } }),
          ...(filter?.hasAssets === false && { assets: { id: IsNull() } }),
        },
        take: limit,
        skip: offset,
        relations: ["category", "savedBy"],
        order: sort?.price ? { price: sort.price } : { createdAt: "DESC" },
      });

      // If userId is available (authenticated or from token), check isSaved status
      const result = businesses.map((biz) => ({
        ...biz,
        isSaved: userId
          ? biz.savedBy?.some((savedUser) => savedUser.id === userId) || false
          : false,
      }));
      return { businesses: result, totalCount: count };
    },
    getAllBusinessesByCity: async (
      _: any,
      { city, limit, offset }: { city: string; limit: number; offset: number },
      context: any,
    ) => {
      const where: any = {
        city: ILike(`%${city}%`),
        isDeleted: false,
        businessStatus: BusinessStatus.ACTIVE,
      };
      let userId: string | null = null;

      // Try to extract userId from context or rawAuthorization token
      if (context?.userId) {
        userId = context.userId;
      } else if (context?.rawAuthorization) {
        userId = getUserIdFromToken(context.rawAuthorization);
      }

      const [businesses, count] = await businessRepo.findAndCount({
        where,
        take: limit,
        skip: offset,
        relations: [
          "seller",
          "category",
          "assets",
          "liabilities",
          "inventoryItems",
          "documents",
          "savedBy",
          "views",
        ],
      });
      // If userId is available (authenticated or from token), check isSaved status
      const result = businesses.map((biz) => ({
        ...biz,
        isSaved: userId
          ? biz.savedBy?.some((savedUser) => savedUser.id === userId) || false
          : false,
      }));
      return { businesses: result, totalCount: count };
    },
    getAllBusinessesByDistrict: async (
      _: any,
      {
        district,
        limit,
        offset,
      }: { district: string; limit: number; offset: number },
      context: any,
    ) => {
      const where: any = {
        city: ILike(`%${district}%`),
        isDeleted: false,
        businessStatus: BusinessStatus.ACTIVE,
      };
      let userId: string | null = null;

      // Try to extract userId from context or rawAuthorization token
      if (context?.userId) {
        userId = context.userId;
      } else if (context?.rawAuthorization) {
        userId = getUserIdFromToken(context.rawAuthorization);
      }

      const [businesses, count] = await businessRepo.findAndCount({
        where,
        take: limit,
        skip: offset,
        relations: [
          "seller",
          "category",
          "assets",
          "liabilities",
          "inventoryItems",
          "documents",
          "savedBy",
          "views",
        ],
      });
      // If userId is available (authenticated or from token), check isSaved status
      const result = businesses.map((biz) => ({
        ...biz,
        isSaved: userId
          ? biz.savedBy?.some((savedUser) => savedUser.id === userId) || false
          : false,
      }));
      return { businesses: result, totalCount: count };
    },
    getAllBusinessesByRevenue: async (
      _: any,
      {
        revenue,
        limit,
        offset,
        sort,
        filter,
        search,
      }: {
        revenue: number[];
        limit: number;
        offset: number;
        sort: BusinessSortInput;
        filter?: BusinessFilterInput;
        search?: string;
      },
      context: any,
    ) => {
      let userId: string | null = null;

      // Try to extract userId from context or rawAuthorization token
      if (context?.userId) {
        userId = context.userId;
      } else if (context?.rawAuthorization) {
        userId = getUserIdFromToken(context.rawAuthorization);
      }

      let where: any = {
        revenue: Between(revenue[0], revenue[1]),
        isDeleted: false,
        businessStatus: BusinessStatus.ACTIVE,
      };

      // Apply all filters from BusinessFilterInput
      if (filter) {
        const {
          district,
          city,
          priceRange,
          profitRange,
          profitMargenRange,
          employeesRange,
          operationalYearRange,
          hasAssets,
          multiple,
          startDate,
          endDate,
          businessStatus,
          categoryId,
        } = filter;

        if (district != null && district !== "") {
          where.district = ILike(`%${district}%`);
        }

        if (city != null && city !== "") {
          where.city = ILike(`%${city}%`);
        }

        if (priceRange && Array.isArray(priceRange)) {
          let [minPrice, maxPrice] = priceRange;
          if (minPrice != null && maxPrice != null && minPrice > maxPrice) {
            [minPrice, maxPrice] = [maxPrice, minPrice];
          }
          if (minPrice != null && maxPrice != null) {
            where.price = Between(minPrice, maxPrice);
          } else if (minPrice != null) {
            where.price = MoreThanOrEqual(minPrice);
          } else if (maxPrice != null) {
            where.price = LessThanOrEqual(maxPrice);
          }
        }

        if (profitRange && Array.isArray(profitRange)) {
          const [minProfit, maxProfit] = profitRange;

          if (minProfit != null && maxProfit != null) {
            where.profit = Between(minProfit, maxProfit);
          } else if (minProfit != null) {
            where.profit = MoreThanOrEqual(minProfit);
          } else if (maxProfit != null) {
            where.profit = LessThanOrEqual(maxProfit);
          }
        }

        if (profitMargenRange && Array.isArray(profitMargenRange)) {
          const [first, second] = profitMargenRange;
          if (typeof first === "number" && typeof second === "number") {
            where.profitMargen = Between(first, second);
          } else if (typeof first === "number") {
            where.profitMargen = MoreThanOrEqual(first);
          } else if (typeof second === "number") {
            where.profitMargen = LessThanOrEqual(second);
          }
        }

        if (multiple != null) {
          where.multiple = LessThanOrEqual(multiple);
        }

        if (
          typeof employeesRange === "string" &&
          employeesRange.includes("-")
        ) {
          const [min, max] = employeesRange.split("-").map(Number);
          if (!isNaN(min) && !isNaN(max)) {
            where.numberOfEmployees = Between(min, max);
          }
        }

        if (operationalYearRange && operationalYearRange.includes("-")) {
          const [minStr, maxStr] = operationalYearRange.split("-");
          const minYears = Number(minStr);
          const maxYears = Number(maxStr);

          if (!isNaN(minYears) && !isNaN(maxYears)) {
            const currentDate = new Date();
            const currentYear = currentDate.getFullYear();

            const maxDate = new Date(
              `${currentYear - minYears}-12-31T23:59:59.999Z`,
            );
            const minDate = new Date(
              `${currentYear - maxYears}-01-01T00:00:00.000Z`,
            );

            where.foundedDate = Between(minDate, maxDate);
          }
        }

        if (startDate && endDate) {
          where.createdAt = Between(new Date(startDate), new Date(endDate));
        } else if (startDate) {
          where.createdAt = MoreThanOrEqual(new Date(startDate));
        } else if (endDate) {
          where.createdAt = LessThanOrEqual(new Date(endDate));
        }

        if (businessStatus) {
          where.businessStatus = businessStatus;
        }

        if (categoryId) {
          where.category = { id: categoryId };
        }
      }

      if (search) {
        where.businessTitle = ILike(`%${search}%`);
      }

      let orderColumn = "createdAt";
      let orderDirection: "ASC" | "DESC" = "DESC";

      // Override if sort is provided
      if (sort?.price) {
        orderColumn = "revenue";
        orderDirection = sort.price.toUpperCase() === "ASC" ? "ASC" : "DESC";
      }

      const [businesses, count] = await businessRepo.findAndCount({
        where: {
          ...where,
          ...(filter?.hasAssets === true && { assets: { id: Not(IsNull()) } }),
          ...(filter?.hasAssets === false && { assets: { id: IsNull() } }),
        },
        take: limit,
        skip: offset,
        relations: ["category", "savedBy"],
        order:
          orderColumn === "revenue"
            ? { revenue: orderDirection }
            : { createdAt: orderDirection },
      });

      // If userId is available (authenticated or from token), check isSaved status
      const result = businesses.map((biz) => ({
        ...biz,
        isSaved: userId
          ? biz.savedBy?.some((savedUser) => savedUser.id === userId) || false
          : false,
      }));
      return { businesses: result, totalCount: count };
    },
    getAllBusinessesByProfit: async (
      _: any,
      {
        profit,
        limit,
        offset,
      }: { profit: number[]; limit: number; offset: number },
      context: any,
    ) => {
      const where: any = {
        profit: Between(profit[0], profit[1]),
        isDeleted: false,
        businessStatus: BusinessStatus.ACTIVE,
      };
      let userId: string | null = null;

      // Try to extract userId from context or rawAuthorization token
      if (context?.userId) {
        userId = context.userId;
      } else if (context?.rawAuthorization) {
        userId = getUserIdFromToken(context.rawAuthorization);
      }

      const [businesses, count] = await businessRepo.findAndCount({
        where,
        take: limit,
        skip: offset,
        relations: [
          "seller",
          "category",
          "assets",
          "liabilities",
          "inventoryItems",
          "documents",
          "savedBy",
          "views",
        ],
      });
      // If userId is available (authenticated or from token), check isSaved status
      const result = businesses.map((biz) => ({
        ...biz,
        isSaved: userId
          ? biz.savedBy?.some((savedUser) => savedUser.id === userId) || false
          : false,
      }));
      return { businesses: result, totalCount: count };
    },
    getBusinessById: async (
      _: any,
      { id, userId }: { id: string; userId?: string },
    ) => {
      const business = await businessRepo.findOne({
        where: { id },
        relations: [
          "seller",
          "category",
          "assets",
          "liabilities",
          "inventoryItems",
          "offers",
          "savedBy",
          "views",
          "documents",
        ],
      });

      if (!business) throw new Error("Business not found");

      // calculate aggregates
      const totalViews = business.views ? business.views.length : 0;
      const numberOfOffers = business.offers ? business.offers.length : 0;
      const numberOfFavorites = business.savedBy ? business.savedBy.length : 0;

      // return business with aggregates
      return {
        business: {
          ...business,
          isSaved: userId
            ? business.savedBy?.some((u) => u.id === userId) || false
            : false,
        },
        totalViews,
        numberOfOffers,
        numberOfFavorites,
      };
    },
    // get 4 random businesses accept that id is send
    getRandomBusinesses: async (
      _: any,
      { id, userId }: { id?: string; userId?: string },
    ) => {
      logger.info(`User ID in Random Business: ${userId}`);
      const whereCondition: any = {
        isDeleted: false,
        businessStatus: BusinessStatus.ACTIVE,
      };

      if (id) {
        whereCondition.id = Not(Equal(id));
      }
      const businesses = await businessRepo.find({
        where: whereCondition,
        take: 4,
        order: { createdAt: "DESC" },
        relations: ["category", "savedBy"],
      });
      const result = businesses.map((biz) => ({
        ...biz,
        isSaved: userId
          ? biz.savedBy?.some((savedUser) => savedUser.id === userId) || false
          : false,
      }));
      return result;
    },
    getAllSellerBusinesses: async (
      _: any,
      { limit, offSet }: { limit: number; offSet: number },
      context: any,
    ) => {
      const ctxUser = await authenticate(context);
      const user = await userRepo.findOne({ where: { id: ctxUser?.userId } });
      if (!user) throw new Error("User not found");
      // Apply filters using TypeORM's native conditions

      const [businesses, count] = await businessRepo.findAndCount({
        where: {
          createdBy: ctxUser?.userId,
          businessStatus: Not(BusinessStatus.SOLD),
        },
        take: limit,
        skip: offSet,
        relations: ["category", "savedBy", "offers", "views"],
        order: { createdAt: "DESC" },
      });
      // If the user is authenticated, filter businesses by savedBy
      const result = businesses.map((biz) => {
        const graphqlStatus = biz.businessStatus.toUpperCase(); // 'under_review' → 'UNDER_REVIEW'
        return {
          ...biz,
          businessStatus: graphqlStatus, // important: must match GraphQL enum
          isSaved:
            biz.savedBy?.some((savedUser) => savedUser.id === user.id) || false,
          offerCount: biz.offers?.length || 0,
          viewCount: biz.views?.length || 0,
        };
      });

      return { businesses: result, totalCount: count };
    },
    getAllSellerSoldBusinesses: async (
      _: any,
      { limit, offset }: { limit: number; offset: number },
      context: any,
    ) => {
      const ctxUser = await authenticate(context);
      const user = await userRepo.findOne({ where: { id: ctxUser?.userId } });
      if (!user) throw new Error("User not found");
      // Apply filters using TypeORM's native conditions

      const [businesses, count] = await businessRepo.findAndCount({
        where: {
          createdBy: ctxUser?.userId,
          businessStatus: BusinessStatus.SOLD,
        },
        take: limit,
        skip: offset,
        relations: ["category", "savedBy"],
        order: { createdAt: "DESC" },
      });
      // If the user is authenticated, filter businesses by savedBy
      const result = businesses.map((biz) => {
        const graphqlStatus = biz.businessStatus.toUpperCase(); // 'under_review' → 'UNDER_REVIEW'

        return {
          ...biz,
          businessStatus: graphqlStatus, // important: must match GraphQL enum
          isSaved:
            biz.savedBy?.some((savedUser) => savedUser.id === user.id) || false,
          offerCount: biz.offers?.length || 0,
        };
      });

      return { businesses: result, totalCount: count };
    },
    getAllBuyerBusinesses: async (
      _: any,
      { limit, offset }: { limit: number; offset: number },
      context: any,
    ) => {
      const ctxUser = await authenticate(context);
      const user = await userRepo.findOne({ where: { id: ctxUser?.userId } });
      if (!user) throw new Error("User not found");
      // Apply filters using TypeORM's native conditions

      const [businesses, count] = await businessRepo.findAndCount({
        where: { buyer: { id: ctxUser?.userId } },
        take: limit,
        skip: offset,
        relations: ["category", "savedBy"],
        order: { createdAt: "DESC" },
      });
      // If the user is authenticated, filter businesses by savedBy
      const result = businesses.map((biz) => ({
        ...biz,
        isSaved:
          biz.savedBy?.some((savedUser) => savedUser.id === user.id) || false,
      }));

      return { businesses: result, totalCount: count };
    },
    getAllBuyerBoughtBusinesses: async (
      _: any,
      { limit, offset }: { limit: number; offset: number },
      context: any,
    ) => {
      const ctxUser = await authenticate(context);
      const user = await userRepo.findOne({ where: { id: ctxUser?.userId } });
      if (!user) throw new Error("User not found");
      // Apply filters using TypeORM's native conditions

      const [businesses, count] = await businessRepo.findAndCount({
        where: {
          buyer: { id: ctxUser?.userId },
          businessStatus: BusinessStatus.SOLD,
        },
        take: limit,
        skip: offset,
        relations: [
          "buyer",
          "category",
          "assets",
          "liabilities",
          "inventoryItems",
          "documents",
          "savedBy",
          "views",
        ],
        order: { createdAt: "DESC" },
      });
      // If the user is authenticated, filter businesses by savedBy
      const result = businesses.map((biz) => ({
        ...biz,
        isSaved:
          biz.savedBy?.some((savedUser) => savedUser.id === user.id) || false,
      }));

      return { businesses: result, totalCount: count };
    },
    getFavoritBusiness: async (
      _: any,
      { limit, offSet }: { limit: number; offSet: number },
      context: any,
    ) => {
      const ctxUser = await authenticate(context);
      const [businesses, totalCount] = await businessRepo.findAndCount({
        where: { savedBy: { id: ctxUser?.userId } },
        relations: ["category", "savedBy"],
        take: limit,
        skip: offSet,
      });
      // If the user is authenticated, filter businesses by savedBy
      const result = businesses.map((biz) => ({
        ...biz,
        isSaved:
          biz.savedBy?.some((savedUser) => savedUser.id === ctxUser?.userId) ||
          false,
      }));
      return {
        businesses: result,
        totalCount,
      };
    },
    //admin
    getBusinessStats: async (_: any, __: any) => {
      const totalBusinesses = await businessRepo.count({
        where: { isDeleted: false },
      });
      const completedDeals = await dealRepo.count({
        where: { status: DealStatus.COMPLETED },
      });
      const requestMeetings = await meetingRepo.count({
        where: { status: MeetingStatus.REQUESTED },
      });
      const scheduleMeetings = await meetingRepo.count({
        where: { status: MeetingStatus.APPROVED },
      });
      const todaysMeetings = await meetingRepo.count({
        where: {
          createdAt: MoreThanOrEqual(new Date(new Date().setHours(0, 0, 0, 0))),
        },
      });

      return {
        totalBusinesses,
        completedDeals,
        requestMeetings,
        scheduleMeetings,
        todaysMeetings,
      };
    },
    getBusinessStatsGraph: async (_: any, { year }: { year: number }) => {
      const start = new Date(year, 0, 1); // January 1
      const end = new Date(year, 11, 31, 23, 59, 59); // December 31
      const [businesses, totalBusinesses] = await businessRepo.findAndCount({
        where: {
          createdAt: Between(start, end),
          isDeleted: false,
        },
        select: ["createdAt"],
      });

      const monthlyStats: { month: string; businessCount: number }[] = [
        { month: "Jan", businessCount: 0 },
        { month: "Feb", businessCount: 0 },
        { month: "Mar", businessCount: 0 },
        { month: "Apr", businessCount: 0 },
        { month: "May", businessCount: 0 },
        { month: "Jun", businessCount: 0 },
        { month: "Jul", businessCount: 0 },
        { month: "Aug", businessCount: 0 },
        { month: "Sep", businessCount: 0 },
        { month: "Oct", businessCount: 0 },
        { month: "Nov", businessCount: 0 },
        { month: "Dec", businessCount: 0 },
      ];

      businesses.forEach((business) => {
        const monthIndex = business.createdAt.getMonth();
        monthlyStats[monthIndex].businessCount += 1;
      });

      return { monthlyStats, totalBusinesses };
    },
    // lising by price tier
    getBusinessByPriceTier: async (_: any, __: any) => {
      const priceTiers = [
        { name: "0 - 50,000", range: [0, 50000] },
        { name: "50,000 - 100,000", range: [50000, 100000] },
        { name: "100,000 - 250,000", range: [100000, 250000] },
        { name: "250,000 - 500,000", range: [250000, 500000] },
        { name: "More than 500,000", range: [500000, Infinity] },
      ];

      const businessCounts = await Promise.all(
        priceTiers.map(async (tier) => {
          const count = await businessRepo.count({
            where: {
              price: Between(tier.range[0], tier.range[1]),
              isDeleted: false,
            },
          });
          return { priceTier: tier.name, count };
        }),
      );

      return businessCounts;
    },
    //listing by revenue tier
    getBusinessByRevenueTier: async (_: any, __: any) => {
      const revenueTiers = [
        { name: "0 - 50,000", range: [0, 50000] },
        { name: "50,000 - 100,000", range: [50000, 100000] },
        { name: "100,000 - 250,000", range: [100000, 250000] },
        { name: "250,000 - 500,000", range: [250000, 500000] },
        { name: "More than 500,000", range: [500000, Infinity] },
      ];

      const businessCounts = await Promise.all(
        revenueTiers.map(async (tier) => {
          const count = await businessRepo.count({
            where: {
              revenue: Between(tier.range[0], tier.range[1]),
              isDeleted: false,
            },
          });
          return { priceTier: tier.name, count };
        }),
      );

      return businessCounts;
    },
    getCountByEachCategory: async (_: any, __: any) => {
      const results = await categoryRepo
        .createQueryBuilder("category")
        .leftJoin(
          "category.businesses",
          "business",
          "business.isDeleted = :isDeleted",
          { isDeleted: false },
        )
        .select("category.name", "name")
        .addSelect("category.icon", "icon")
        .addSelect("COUNT(business.id)", "count")
        .addSelect("category.arabicName", "arabicName")
        .where("category.isDeleted = false")
        .groupBy("category.id")
        .addGroupBy("category.name")
        .addGroupBy("category.icon")
        .addGroupBy("category.arabicName")
        .getRawMany();

      return results.map((row) => ({
        category: row.name,
        icon: row.icon,
        count: parseInt(row.count, 10) || 0,
        arabicCategory: row.arabicName,
      }));
    },
    similerBusinessAvgAnualProfit: async (_: any, { id }: { id: string }) => {
      const businesses = await businessRepo.find({
        where: { category: { id } },
      });
      if (!businesses) throw new Error("business not found");

      const currentYear = new Date().getFullYear();
      const last10Years = Array.from({ length: 10 }, (_, i) => currentYear - i);

      // Prepare yearly profit map
      const yearlyProfitMap: Record<
        number,
        { totalProfit: number; count: number }
      > = {};
      last10Years.forEach((year) => {
        yearlyProfitMap[year] = { totalProfit: 0, count: 0 };
      });

      // Calculate total profit and yearly profit
      let totalProfit = 0;

      businesses.forEach((biz) => {
        if (biz.profit) {
          totalProfit += Number(biz.profit);
        }

        if (biz.foundedDate) {
          const foundedYear = new Date(biz.foundedDate).getFullYear();
          if (last10Years.includes(foundedYear)) {
            yearlyProfitMap[foundedYear].totalProfit += Number(biz.profit || 0);
            yearlyProfitMap[foundedYear].count += 1;
          }
        }
      });

      // Create graph array of average annual profit
      const graph = last10Years
        .sort((a, b) => a - b) // ascending order
        .map((year) => ({
          year,
          profit:
            yearlyProfitMap[year].count > 0
              ? yearlyProfitMap[year].totalProfit / yearlyProfitMap[year].count
              : 0,
        }));

      return {
        totalProfit,
        graph,
      };
      //calculate and return total profit of all businesses
      // as well as graph of average anual profit of last 10 year businesses
      // you can get the year from foundedDate
    },
    // check the deal if it is opened for the business
    isBusinessInDealProcess: async (_: any, { id }: { id: string }) => {
      const ongoingDeal = await dealRepo.findOne({
        where: {
          business: { id },
          // if only cancelled deals are not considered ongoing and all others statuses are ongoing
          status: Not(DealStatus.CANCEL),
        },
      });
      return ongoingDeal ? true : false;
    },

    /**
     * Returns up to `limit` suggested listings for a given business.
     * Priority order:
     *  1. Same category + same city
     *  2. Same category (different city)
     *  3. Similar price range (±30%)
     * Excludes the source business and any SOLD/deleted listings.
     */
    getSuggestedListings: async (
      _: any,
      { businessId, limit = 6 }: { businessId: string; limit?: number },
    ) => {
      const source = await businessRepo.findOne({
        where: { id: businessId },
        relations: ['category'],
      });
      if (!source) return [];

      const price    = Number(source.price ?? 0);
      const priceMin = price * 0.7;
      const priceMax = price * 1.3;
      const categoryId = source.category?.id;
      const city       = source.city;

      // Build a scored query: same-category+city first, then same-category, then price-similar
      const qb = businessRepo
        .createQueryBuilder('b')
        .leftJoinAndSelect('b.seller', 'seller')
        .leftJoinAndSelect('b.category', 'category')
        .where('b.id != :id', { id: businessId })
        .andWhere('b.businessStatus = :status', { status: BusinessStatus.ACTIVE })
        .andWhere('b.isDeleted = false');

      // Must match at least one of: same category, same city, similar price
      qb.andWhere(
        '(b.category_id = :categoryId OR b.city = :city OR CAST(b.price AS numeric) BETWEEN :priceMin AND :priceMax)',
        { categoryId: categoryId ?? '', city: city ?? '', priceMin, priceMax },
      );

      // Score: 0 = best match (same category + city), 1 = same category, 2 = same city, 3 = price only
      qb.addSelect(
        `CASE
          WHEN b.category_id = :categoryId AND b.city = :city THEN 0
          WHEN b.category_id = :categoryId THEN 1
          WHEN b.city = :city THEN 2
          ELSE 3
        END`,
        'match_score',
      )
        .setParameters({ categoryId: categoryId ?? '', city: city ?? '' })
        .orderBy('match_score', 'ASC')
        .addOrderBy('b.createdAt', 'DESC')
        .take(limit);

      return qb.getMany();
    },
  },
  Mutation: {
    createBusiness: async (
      _: any,
      { input }: { input: CreateBusinessInput },
      context: any,
    ) => {
      const ctxUser = await authenticate(context);
      if (!ctxUser) throw new Error("Unauthorized");

      const actor = await userRepo.findOne({
        where: { id: ctxUser.userId },
      });
      if (!actor) throw new Error("Actor not found");

      // 🟢 Determine OWNER
      let owner;
      let isAdminCreatingForUser = false;
      if (input.createdBy && input.createdBy !== ctxUser.userId) {
        // Admin creating business for another user
        owner = await userRepo.findOne({ where: { id: input.createdBy } });
        if (!owner) throw new Error("Owner not found");
        isAdminCreatingForUser = true;
      } else {
        // User or admin creating business for themselves
        owner = actor;
      }

      // 🟢 Category
      const category = await categoryRepo.findOne({
        where: { id: input.categoryId },
      });
      if (!category) throw new Error("Category not found");
      // 🟢 Create business
      const newBusiness = businessRepo.create({
        ...input,
        businesses: owner,
        category,
        createdBy: owner.id, // always actor
      } as DeepPartial<Business>);

      const savedBusiness = await businessRepo.save(newBusiness);

      // ---------------------------
      // SAVE RELATIONS
      // ---------------------------
      const saveMany = async (items: any[], repo: any) => {
        if (!items?.length) return;
        await repo.save(
          items.map((i) => repo.create({ ...i, business: savedBusiness })),
        );
      };

      await saveMany(input.assets ?? [], assetRepo);
      await saveMany(input.liabilities ?? [], liabilityRepo);
      await saveMany(input.inventoryItems ?? [], inventoryRepo);
      await saveMany(input.documents ?? [], documentRepo);

      // ---------------------------
      // REFERENCE
      // ---------------------------
      let reference;
      do {
        reference = Math.floor(100000 + Math.random() * 900000);
      } while (await businessRepo.findOne({ where: { reference } }));

      savedBusiness.reference = reference;
      await businessRepo.save(savedBusiness);

      // ---------------------------
      // OWNER NOTIFICATION
      // ---------------------------
      await notificationRepository.save(
        notificationRepository.create({
          name: "New Business",
          message: "Your business has been added successfully!",
          user: owner,
        }),
      );

      await sendEmail({
        to: owner.email,
        subject: "Business Creation",
        html: baseEmailTemplate({
          title: " ",
          message: `
            <p>Dear <strong>${owner.name || "User"}</strong>,</p>

            <p>Your business listing has been successfully submitted to Jusoor.</p>

            <p>
              Your listing is now under review as part of our verification process,
              ensuring a trusted and transparent marketplace for all users.
            </p>

            <p>
              Once approved, your business will be visible to verified buyers across the platform.
            </p>

            <p>Jusoor shortens the path.</p>

            <p style="margin-top:24px;">
              Warm regards,<br />
              <strong>Jusoor Team</strong>
            </p>
          `,
        }),
      });

      const admins = await userRepo.find({
        where: {
          isDeleted: false,
          role: { name: Not("Customer") },
        },
      });

      for (const admin of admins) {
        const message = isAdminCreatingForUser
          ? `A new business <b>${savedBusiness.businessTitle}</b> was added by <b>${actor.name}</b> on behalf of <b>${owner.name}</b>.`
          : `A new business <b>${savedBusiness.businessTitle}</b> was added by <b>${owner.name}</b>.`;

        await notificationRepository.save(
          notificationRepository.create({
            name: "New Business",
            message,
            user: admin,
          }),
        );

        await sendEmail({
          to: admin.email,
          subject: "Business Creation",
          html: baseEmailTemplate({
            title: " ",
            message: `
              <p>Dear Admin,</p>

              <p>
                A new business listing has been successfully submitted to Jusoor and is pending review.
              </p>

              <p>Regards,<br />Jusoor System</p>
            `,
            actionText: "Review Business",
            actionUrl: `https://admin.jusoor-sa.co/businesslisting/details/${savedBusiness.id}`,
          }),
        });
      }
      return savedBusiness;
    },
    updateBusiness: async (
      _: any,
      { input }: { input: UpdateBusinessInput },
    ) => {
      logger.info(`UpdateBusiness Input: ${JSON.stringify(input, null, 2)}`);
      const business = await businessRepo.findOne({
        where: { id: input.id },
        relations: ["seller"],
      });
      if (!business) throw new Error("business not found");

      if (input.savedById) {
        const user = await userRepo.findOne({ where: { id: input.savedById } });
        if (!user) throw new Error("User not found");
        if (!business.savedBy) {
          business.savedBy = [];
        }
        const alreadySaved = business.savedBy.some((u) => u.id === user.id);
        if (!alreadySaved) {
          business.savedBy.push(user);
        }
      }
      const updateData = { ...input, savedById: undefined };
      if (input.createdBy !== undefined && input.createdBy !== null) {
        const newCreator = await userRepo.findOne({
          where: { id: input.createdBy },
        });
        if (!newCreator) throw new Error("Creator user not found");
        business.createdBy = input.createdBy;
        logger.info(
          `Updated createdBy from ${business.createdBy} to ${input.createdBy}`,
        );
      }
      Object.assign(business, { ...updateData, createdBy: undefined });

      if (input.businessStatus === BusinessStatus.ACTIVE) {
        await sendEmail({
          to: business.seller.email,
          subject: "Business Verification",
          html: baseEmailTemplate({
            title: " ",
            message: `
              <p>Dear <strong>${business.seller.name || "User"}</strong>,</p>

              <p>Your business is now live on Jusoor.</p>

              <p>
                Your listing has been successfully verified and is now visible to verified buyers across the platform.
              </p>

              <p>You may begin receiving interest and offers at any time.</p>

              <p>Jusoor shortens the path.</p>

              <p style="margin-top:24px;">
                Warm regards,<br />
                <strong>Jusoor Team</strong>
              </p>
            `,
            actionText: "View Your Business",
            actionUrl: `https://jusoor-sa.co/singleviewlisting/${business.id}`,
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
            name: "New Business",
            message: `A user added a new business: ${business.businessTitle}`,
            user: admin,
          });
          const savedAdminNotification =
            await notificationRepository.save(adminNotification);
          await pubsub.publish("NEW_NOTIFICATION", {
            newNotification: savedAdminNotification,
          });
        }
      }

      return await businessRepo.save(business);
    },
    updateBusinessDeal: async (
      _: any,
      { input }: { input: UpdateBusinessProcessInput },
    ) => {
      const business = await businessRepo.findOne({ where: { id: input.id } });
      if (!business) throw new Error("business not found");

      if (input.jasoorPaymentBankRecipt) {
        const documents = await documentRepo.create({
          title: input.jasoorPaymentBankRecipt.title,
          fileName: input.jasoorPaymentBankRecipt.fileName,
          fileType: input.jasoorPaymentBankRecipt.fileType,
          filePath: input.jasoorPaymentBankRecipt.filePath,
          description: input.jasoorPaymentBankRecipt.description || "",
          business,
        });
        await documentRepo.save(documents);
      }
      if (input.buyerPaymentBankRecipt) {
        const documents = await documentRepo.create({
          title: input.buyerPaymentBankRecipt.title,
          fileName: input.buyerPaymentBankRecipt.fileName,
          fileType: input.buyerPaymentBankRecipt.fileType,
          filePath: input.buyerPaymentBankRecipt.filePath,
          description: input.buyerPaymentBankRecipt.description || "",
          business,
        });
        await documentRepo.save(documents);
      }
      if (input.commercialRegistrationNumber) {
        const documents = await documentRepo.create({
          title: input.commercialRegistrationNumber.title,
          fileName: input.commercialRegistrationNumber.fileName,
          fileType: input.commercialRegistrationNumber.fileType,
          filePath: input.commercialRegistrationNumber.filePath,
          description: input.commercialRegistrationNumber.description || "",
          business,
        });
        await documentRepo.save(documents);
      }
      if (input.ownershipTransferLetter) {
        const documents = await documentRepo.create({
          title: input.ownershipTransferLetter.title,
          fileName: input.ownershipTransferLetter.fileName,
          fileType: input.ownershipTransferLetter.fileType,
          filePath: input.ownershipTransferLetter.filePath,
          description: input.ownershipTransferLetter.description || "",
          business,
        });
        await documentRepo.save(documents);
      }
      return await businessRepo.save(business);
    },
    deleteBusiness: async (_: any, { id }: { id: string }) => {
      const business = await businessRepo.findOne({ where: { id } });
      if (!business) throw new Error("Business not found");
      business.isDeleted = true;
      await businessRepo.save(business);
      return true;
    },
    saveBusiness: async (_: any, { id }: { id: string }, context: any) => {
      const ctxUser = await authenticate(context);
      if (!ctxUser) throw new Error("Unauthorized");
      const user = await userRepo.findOne({ where: { id: ctxUser.userId } });
      if (!user) throw new Error("User not found");

      const business = await businessRepo.findOne({
        where: { id },
        relations: ["savedBy"],
      });
      if (!business) throw new Error("Business not found");

      const isSaved =
        business.savedBy?.some((savedUser) => savedUser.id === user.id) ||
        false;

      if (isSaved) {
        // Remove user from savedBy
        await businessRepo
          .createQueryBuilder()
          .relation(Business, "savedBy")
          .of(business) // business entity or business.id
          .remove(user); // user entity or user.id
      } else {
        // Add user to savedBy
        await businessRepo
          .createQueryBuilder()
          .relation(Business, "savedBy")
          .of(business)
          .add(user);
      }
      return true;
    },
    viewBusiness: async (_: any, { id }: { id: string }, context: any) => {
      let userId: string | null = null;

      // Try to extract userId from context or rawAuthorization token
      if (context?.userId) {
        userId = context.userId;
      } else if (context?.rawAuthorization) {
        userId = getUserIdFromToken(context.rawAuthorization);
      }

      const business = await businessRepo.findOne({
        where: { id },
        relations: ["seller"],
      });
      if (!business) throw new Error("Business not found");

      const user = userId
        ? await userRepo.findOne({ where: { id: userId } })
        : null;

      // Only track views for logged-in users to avoid duplicate anonymous views
      if (user) {
        // Create or update the BusinessView record for logged-in users
        let businessView = await businessViewRepo.findOne({
          where: {
            user: { id: user.id },
            business: { id: business.id },
          },
        });

        // make user one count against one business
        if (!businessView) {
          // Only create a new record if it doesn't exist
          const newView = businessViewRepo.create({
            user,
            business,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          await businessViewRepo.save(newView);
        }
      }
      // For anonymous users, we simply return true without tracking
      // This allows public access while preventing duplicate anonymous views

      return true;
    },
  },
};

export default businessResolver;
