import { gql } from "apollo-server";

const category = gql`
  enum PopulationDensity {
    LOW
    MEDIUM
    HIGH
  }
  type GrowthYear {
    id: ID!
    year: Int!
    localBusinessGrowth: Float
  }

  type CategoryGrowth {
    id: ID!
    category: Category!
    regionName: String!
    years: [GrowthYear!]!
    populationDensity: PopulationDensity
    industryDemand: PopulationDensity
  }

  type Category {
    id: ID!
    name: String!
    icon: String
    arabicName: String
    status: status
    isDigital: Boolean!
    businesses: [Business!]!
    growthRecords: [CategoryGrowth!]!
  }

  type Asset {
    id: ID!
    name: String!
    quantity: Float!
    purchaseYear: Int!
    price: Float!
    isActive: Boolean!
    business: Business!
  }

  type Liability {
    id: ID!
    name: String!
    quantity: Float!
    purchaseYear: Int!
    price: Float!
    isActive: Boolean!
    business: Business!
  }

  type Inventory {
    id: ID!
    name: String!
    quantity: Float!
    purchaseYear: Int!
    price: Float!
    isActive: Boolean!
    business: Business!
  }

  input GrowthYearInput {
    year: Int!
    localBusinessGrowth: Float
  }

  input CategoryGrowthInput {
    regionName: String!
    years: [GrowthYearInput!]!
    populationDensity: PopulationDensity
    industryDemand: PopulationDensity
  }

  input CreateCategoryInput {
    name: String!
    arabicName: String
    isDigital: Boolean
    icon: String
    status: status
    growthRecords: [CategoryGrowthInput!]
  }

  input UpdateGrowthYearInput {
    id: ID
    year: Int!
    localBusinessGrowth: Float
  }

  input UpdateCategoryGrowthInput {
    id: ID
    regionName: String!
    years: [UpdateGrowthYearInput!]!
    populationDensity: PopulationDensity
    industryDemand: PopulationDensity
  }

  input UpdateCategoryInput {
    id: ID!
    name: String
    arabicName: String
    isDigital: Boolean
    icon: String
    status: status
    growthRecords: [UpdateCategoryGrowthInput!]
  }

  input UpdateInput {
    id: ID!
    name: String
    quantity: Float
    purchaseYear: Int
    price: Float
    businessId: ID
    isActive: Boolean
  }

  input CategoryFilter {
    name: String
    isDigital: Boolean
    status: status
  }
  type CategoryReturn {
    categories: [Category!]!
    totalcount: Int
  }

  type Query {
    getAllCategories(
      limit: Int
      offSet: Int
      filter: CategoryFilter
      isAdminCategory: Boolean
    ): CategoryReturn!
    getCategoryById(id: ID!): Category
  }

  type Mutation {
    createCategory(input: CreateCategoryInput!): Category!
    updateCategory(input: UpdateCategoryInput!): Category!
    deleteCategory(id: ID!): Boolean!

    updateAsset(input: UpdateInput!): Asset!
    deleteAsset(id: ID!): Boolean!

    updateLiability(input: UpdateInput!): Liability!
    deleteLiability(id: ID!): Boolean!

    updateInventory(input: UpdateInput!): Inventory!
    deleteInventory(id: ID!): Boolean!
  }
`;

export default category;
