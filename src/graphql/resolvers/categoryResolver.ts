import { dataSource } from "../../datasource";
import {
  Inventory,
  Liability,
  Category,
  CategoryGrowth,
  GrowthYear,
  Asset,
} from "../../entity";
import {
  UpdateInput,
  CreateCategoryInput,
  UpdateCategoryInput,
  CategoryFilterInput,
} from "types";
import { ILike } from "typeorm";
import { logger } from "../../utils/logger";

const categoryGrowthRepo = dataSource.getRepository(CategoryGrowth);
const categoryYearRepo = dataSource.getRepository(GrowthYear);
const categoryRepo = dataSource.getRepository(Category);
const inventoryRepo = dataSource.getRepository(Inventory);
const assetRepo = dataSource.getRepository(Asset);
const liabilityRepo = dataSource.getRepository(Liability);

const categoryResolver = {
  Query: {
    getAllCategories: async (
      _: any,
      {
        limit,
        offSet,
        filter,
        isAdminCategory,
      }: {
        limit: number;
        offSet: number;
        filter?: CategoryFilterInput;
        isAdminCategory?: boolean;
      }
    ) => {
      const where: any = { isDeleted: false };
      if (!isAdminCategory) {
        where.status = "ACTIVE";
      }

      if (filter) {
        const { name, isDigital, status } = filter;

        if (name) {
          where.name = ILike(`%${name}%`);
        }
        if (isDigital !== undefined) {
          where.isDigital = isDigital;
        }
        if (isAdminCategory && status) {
          where.status = status;
        }
      }

      const [categories, totalcount] = await categoryRepo.findAndCount({
        relations: ["businesses", "growthRecords", "growthRecords.years"],
        where,
        take: limit,
        skip: offSet,
        order: { createdAt: "DESC" },
      });

      return { categories, totalcount };
    },
    getCategoryById: async (_: any, { id }: { id: string }) => {
      return await categoryRepo.findOne({
        where: { id },
        relations: ["businesses", "growthRecords", "growthRecords.years"],
      });
    },
  },
  Mutation: {
    createCategory: async (
      _: any,
      { input }: { input: CreateCategoryInput }
    ) => {
      const { growthRecords, ...categoryData } = input;

      const newCategory = categoryRepo.create(categoryData);
      await categoryRepo.save(newCategory);

      if (growthRecords && growthRecords.length) {
        for (const record of growthRecords) {
          const growthYears = record.years.map((year) =>
            categoryYearRepo.create({ ...year })
          );

          const newGrowth = categoryGrowthRepo.create({
            category: newCategory,
            regionName: record.regionName,
            populationDensity: record.populationDensity,
            industryDemand: record.industryDemand,
            years: growthYears,
          });

          await categoryGrowthRepo.save(newGrowth);
        }
      }

      return await categoryRepo.findOne({
        where: { id: newCategory.id },
        relations: ["growthRecords", "growthRecords.years"],
      });
    },
    updateCategory: async (
      _: any,
      { input }: { input: UpdateCategoryInput }
    ) => {
      const category = await categoryRepo.findOne({
        where: { id: input.id },
        relations: ["growthRecords", "growthRecords.years"],
      });
      if (!category) throw new Error("Category not found");

      const { growthRecords, ...categoryData } = input;

      // Update basic category fields
      Object.assign(category, categoryData);
      await categoryRepo.save(category);

      if (growthRecords && growthRecords.length) {
        // Map existing growth records by id (if id exists in input)
        const existingGrowthMap = new Map(
          category.growthRecords.map((g) => [g.id, g])
        );

        for (const record of growthRecords) {
          if (record.id && existingGrowthMap.has(record.id)) {
            // Update existing growth record
            const existingGrowth = existingGrowthMap.get(record.id);
            if (existingGrowth) {
              existingGrowth.regionName = record.regionName;
              existingGrowth.populationDensity = record.populationDensity;
              existingGrowth.industryDemand = record.industryDemand;
            }

            // Update years
            const existingYearsMap = new Map(
              existingGrowth?.years.map((y) => [y.id, y]) || []
            );
            for (const year of record.years) {
              if (year.id && existingYearsMap.has(year.id)) {
                // Update existing year
                const existingYear = existingYearsMap.get(year.id);
                if (existingYear) {
                  Object.assign(existingYear, year);
                }
              } else {
                // Add new year
                const newYear = categoryYearRepo.create({ ...year });
                if (existingGrowth) {
                  existingGrowth.years.push(newYear);
                }
              }
            }

            // Delete removed years
            const inputYearIds = record.years
              .filter((y) => y.id)
              .map((y) => y.id);
            if (existingGrowth) {
              for (const oldYear of existingGrowth.years) {
                if (oldYear.id && !inputYearIds.includes(oldYear.id)) {
                  await categoryYearRepo.delete(oldYear.id);
                }
              }
            }

            if (existingGrowth) {
              await categoryGrowthRepo.save(existingGrowth);
            }
          } else {
            // New growth record
            const growthYears = record.years.map((y) =>
              categoryYearRepo.create({ ...y })
            );
            const newGrowth = categoryGrowthRepo.create({
              category,
              regionName: record.regionName,
              populationDensity: record.populationDensity,
              industryDemand: record.industryDemand,
              years: growthYears,
            });
            await categoryGrowthRepo.save(newGrowth);
          }
        }

        // Delete growth records removed in input
        const inputGrowthIds = growthRecords
          .filter((r) => r.id)
          .map((r) => r.id);
        for (const oldGrowth of category.growthRecords) {
          if (!inputGrowthIds.includes(oldGrowth.id)) {
            await categoryYearRepo.delete(oldGrowth.years.map((y) => y.id));
            await categoryGrowthRepo.delete(oldGrowth.id);
          }
        }
      }

      return await categoryRepo.findOne({
        where: { id: category.id },
        relations: ["growthRecords", "growthRecords.years"],
      });
    },
    deleteCategory: async (_: any, { id }: { id: string }) => {
      const category = await categoryRepo.findOne({ where: { id } });
      if (!category) throw new Error("Category not found");
      category.isDeleted = true;
      await categoryRepo.save(category);
      return true;
    },

    updateAsset: async (_: any, { input }: { input: UpdateInput }) => {
      const asset = await assetRepo.findOne({ where: { id: input.id } });
      if (!asset) throw new Error("asset not found");

      Object.assign(asset, input);
      return await assetRepo.save(asset);
    },
    deleteAsset: async (_: any, { id }: { id: string }) => {
      const asset = await assetRepo.findOne({ where: { id } });
      if (!asset) throw new Error("asset not found");
      asset.isDeleted = true;
      await assetRepo.save(asset);
      return true;
    },

    updateLiability: async (_: any, { input }: { input: UpdateInput }) => {
      const liability = await liabilityRepo.findOne({
        where: { id: input.id },
      });
      if (!liability) throw new Error("liability not found");

      Object.assign(liability, input);
      return await liabilityRepo.save(liability);
    },
    deleteLiability: async (_: any, { id }: { id: string }) => {
      const liability = await liabilityRepo.findOne({ where: { id } });
      if (!liability) throw new Error("liability not found");
      liability.isDeleted = true;
      await liabilityRepo.save(liability);
      return true;
    },

    updateInventory: async (_: any, { input }: { input: UpdateInput }) => {
      const inventory = await inventoryRepo.findOne({
        where: { id: input.id },
      });
      if (!inventory) throw new Error("inventory not found");

      Object.assign(inventory, input);
      return await inventoryRepo.save(inventory);
    },
    deleteInventory: async (_: any, { id }: { id: string }) => {
      const inventory = await inventoryRepo.findOne({ where: { id } });
      if (!inventory) throw new Error("inventory not found");
      inventory.isDeleted = true;
      await inventoryRepo.save(inventory);
      return true;
    },
  },
};

export default categoryResolver;
