import { gql } from "apollo-server";

const business = gql`
  enum status {
    ALL
    ACTIVE
    INACTIVE
    UNDER_REVIEW
    REJECT
    SOLD
  }

  type BusinessView {
    id: ID!
    user: User!
    business: Business!
    count: Int!
    lastViewed: String!
  }

  type Business {
    id: ID!
    isByTakbeer: Boolean!
    reference: Int
    meetingDate: DateTime
    businessStatus: status
    createdAt: DateTime
    isSold: Boolean!
    isAbleInActive: Boolean!

    # Section 1: Business Details
    businessTitle: String!
    district: String
    city: String
    foundedDate: DateTime
    numberOfEmployees: String
    description: String
    url: String

    # Section 2: Finance & Growth
    revenue: Float
    revenueTime: String
    profitMargen: Float
    profittime: String
    profit: Float
    price: Float
    capitalRecovery: Float
    multiple: Float
    isStatsVerified: Boolean

    # Section 3: Vision
    supportDuration: Float
    supportSession: Float
    growthOpportunities: String
    reason: String
    isSupportVerified: Boolean!

    isSaved: Boolean!
    savedCount: Int!
    viewCount: Int!
    category: Category
    seller: User!
    buyer: User!
    assets: [Asset!]
    liabilities: [Liability!]
    inventoryItems: [Inventory!]
    documents: [Document!]!
    offers: [Offer!]
    savedBy: [User!]!
    views: [BusinessView!]!
    meetings: [Meeting!]

    offerCount: Int
    createdBy: String
  }

  input CreateBusinessInput {
    businessTitle: String!
    district: String
    city: String
    foundedDate: DateTime
    numberOfEmployees: String
    description: String
    url: String
    revenue: Float
    revenueTime: String
    profitMargen: Float
    profittime: String
    profit: Float
    price: Float
    capitalRecovery: Float
    multiple: Float
    supportDuration: Float
    supportSession: Float
    growthOpportunities: String
    reason: String
    isByTakbeer: Boolean!

    businessStatus: status
    categoryId: ID!
    assets: [CreateInput!]
    liabilities: [CreateInput!]
    inventoryItems: [CreateInput!]
    documents: [CreateDocumentInput]
    createdBy: String
  }

  input UpdateBusinessInput {
    id: ID!
    businessTitle: String
    district: String
    city: String
    foundedDate: DateTime
    numberOfEmployees: String
    description: String
    url: String
    revenue: Float
    revenueTime: String
    profitMargen: Float
    profittime: String
    profit: Float
    price: Float
    capitalRecovery: Float
    multiple: Float
    supportDuration: Float
    supportSession: Float
    growthOpportunities: String
    reason: String
    isByTakbeer: Boolean
    isStatsVerified: Boolean
    isSupportVerified: Boolean

    businessStatus: status
    categoryId: ID
    assets: [CreateInput!]
    liabilities: [CreateInput!]
    inventoryItems: [CreateInput!]
    documents: [CreateDocumentInput]
    createdBy: String
    isSold: Boolean
  }

  input CreateInput {
    name: String!
    quantity: Float!
    purchaseYear: Int!
    price: Float!
    businessId: ID
  }

  input CreateCategoryInput {
    name: String!
    isDigital: Boolean
  }

  input BusinessFilterInput {
    district: String
    city: String
    priceRange: [Float]
    revenueRange: [Float]
    profitRange: [Float]
    profitMargenRange: [Float]
    employeesRange: String
    operationalYearRange: String
    hasAssets: Boolean
    multiple: Int
    startDate: DateTime
    endDate: DateTime
    businessStatus: status
    categoryId: ID
  }

  input AdminBusinessFilterInput {
    startDate: DateTime
    endDate: DateTime
    businessStatus: status
    categoryId: ID
  }

  input UpdateBusinessProcessInput {
    id: ID
    jasoorPaymentBankRecipt: CreateDocumentInput
    buyerPaymentBankRecipt: CreateDocumentInput
    commercialRegistrationNumber: CreateDocumentInput
    ownershipTransferLetter: CreateDocumentInput
  }

  type BusinessReturn {
    businesses: [Business!]
    business: Business!
    totalCount: Int
    totalActiveCount: Int
    totalPendingCount: Int
    totalViews: Int
    numberOfOffers: Int
    numberOfFavorites: Int
  }

  enum SortOrder {
    ASC
    DESC
  }

  input BusinessSortInput {
    price: SortOrder
  }

  type BusinessStatsReturn {
    totalBusinesses: Int!
    completedDeals: Int!
    requestMeetings: Int!
    scheduleMeetings: Int!
    todaysMeetings: Int!
  }

  type BusinessStatsGraph {
    month: String!
    businessCount: Int!
  }

  type BusinessStatsResponse {
    monthlyStats: [BusinessStatsGraph!]!
    totalBusinesses: Int!
  }

  type BusinessPriceTierReturn {
    priceTier: String!
    count: Int!
  }

  type CategoryCountReturn {
    category: String!
    count: Int!
    icon: String
    arabicCategory: String
  }

  type BusinessCategoryGraphReturn {
    year: Int
    profit: Float
  }
  type BusinessCategoryReturn {
    totalProfit: Float!
    graph: [BusinessCategoryGraphReturn!]!
  }
  type Query {
    getAllBusinesses(
      limit: Int
      offSet: Int
      filter: BusinessFilterInput
      sort: BusinessSortInput
      search: String
    ): BusinessReturn!
    getAdminBusinesses(
      limit: Int
      offSet: Int
      filter: AdminBusinessFilterInput
      search: String
    ): BusinessReturn!
    getBusinessById(id: ID!, userId: ID): BusinessReturn
    getRandomBusinesses(id: ID, userId: ID): [Business!]!
    getAllBusinessesByCategory(
      category: String!
      limit: Int
      offSet: Int
      sort: BusinessSortInput
      filter: BusinessFilterInput
      search: String
    ): BusinessReturn!
    getAllBusinessesByCity(
      city: String!
      limit: Int
      offSet: Int
    ): BusinessReturn!
    getAllBusinessesByRevenue(
      revenue: [Float]!
      limit: Int
      offSet: Int
      sort: BusinessSortInput
      filter: BusinessFilterInput
      search: String
    ): BusinessReturn!
    getAllBusinessesByProfit(
      profit: [Float]!
      limit: Int
      offSet: Int
    ): BusinessReturn!
    getAllBusinessesByDistrict(
      district: String!
      limit: Int
      offSet: Int
    ): BusinessReturn!

    getAllSellerBusinesses(limit: Int, offSet: Int): BusinessReturn!
    getAllSellerSoldBusinesses(limit: Int, offSet: Int): BusinessReturn!
    getAllBuyerBusinesses(limit: Int, offSet: Int): BusinessReturn!
    getAllBuyerBoughtBusinesses(limit: Int, offSet: Int): BusinessReturn!

    getFavoritBusiness(limit: Int, offSet: Int): BusinessReturn!
    similerBusinessAvgAnualProfit(id: ID): BusinessCategoryReturn!

    getBusinessStats: BusinessStatsReturn!
    getBusinessStatsGraph(year: Int): BusinessStatsResponse!
    getBusinessByPriceTier: [BusinessPriceTierReturn!]!
    getBusinessByRevenueTier: [BusinessPriceTierReturn!]!
    getCountByEachCategory: [CategoryCountReturn!]!
    isBusinessInDealProcess(id: ID!): Boolean!
    getSuggestedListings(businessId: ID!, limit: Int): [Business!]!
  }

  type Mutation {
    createBusiness(input: CreateBusinessInput!): Business!
    updateBusiness(input: UpdateBusinessInput!): Business!
    updateBusinessDeal(input: UpdateBusinessProcessInput): Business!
    deleteBusiness(id: ID!): Boolean!

    saveBusiness(id: ID!): Boolean!
    viewBusiness(id: ID!): Boolean!
  }
`;

export default business;
