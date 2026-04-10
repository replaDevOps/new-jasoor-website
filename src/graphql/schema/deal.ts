import { gql } from "apollo-server-core";

const deal = gql`
  enum DealStatus {
    COMMISSION_TRANSFER_FROM_BUYER_PENDING
    COMMISSION_VERIFICATION_PENDING
    COMMISSION_VERIFIED
    DSA_FROM_SELLER_PENDING
    DSA_FROM_BUYER_PENDING
    BANK_DETAILS_FROM_SELLER_PENDING
    BUYER_PAYMENT_PENDING
    SELLER_PAYMENT_VERIFICATION_PENDING
    DOCUMENT_UPLOAD_PENDING
    WAITING
    PENDING
    BUYERCOMPLETED
    SELLERCOMPLETED
    COMPLETED
    CANCEL
  }

  type Deal {
    id: ID!
    isCommissionUploaded: Boolean
    isCommissionVerified: Boolean
    isPaymentVedifiedAdmin: Boolean
    isDocVedifiedBuyer: Boolean
    isDsaSeller: Boolean
    isDsaBuyer: Boolean
    isPaymentVedifiedSeller: Boolean
    isDocVedifiedSeller: Boolean
    isDocVedifiedAdmin: Boolean
    isBuyerCompleted: Boolean
    isSellerCompleted: Boolean
    offer: Offer
    business: Business
    buyer: User
    price: Float!
    status: DealStatus!
    createdAt: DateTime!
    updatedAt: DateTime!
    isDeleted: Boolean
    commission: Float
    ndaPdfPath: String
    arabicNdaPdfPath: String
    buyerNote: String
    sellerNote: String
  }

  input CreateDealInput {
    offerId: ID!
    businessId: ID!
    meetingId: ID
    buyerId: ID!
    price: Float
  }

  input UpdateDealInput {
    id: ID!
    isCommissionUploaded: Boolean
    isCommissionVerified: Boolean
    isPaymentVedifiedAdmin: Boolean
    isDocVedifiedBuyer: Boolean
    isDsaSeller: Boolean
    isDsaBuyer: Boolean
    isPaymentVedifiedSeller: Boolean
    isDocVedifiedSeller: Boolean
    isDocVedifiedAdmin: Boolean
    isBuyerCompleted: Boolean
    isSellerCompleted: Boolean
    price: Float
    status: DealStatus
    buyerNote: String
    sellerNote: String
    documentUploaded: Boolean
  }

  type DealReturn {
    deals: [Deal!]!
    totalCount: Int!
  }

  type FinanceCount {
    totalPrice: Float!
    revenueGenerated: Float!
    thisMonthRevenue: Float!
  }

  type FinanceAnalytics {
    totalRevenue: Float!
    graphData: [FinanceGraph!]!
  }

  type FinanceGraph {
    month: Int!
    revenue: Float!
  }

  input DealFilter {
    search: String
    startDate: DateTime
    endDate: DateTime
  }

  enum DealType {
    completed
    canceled
    inprogress
  }

  type Query {
    getDeals(
      limit: Int
      offset: Int
      search: String
      status: String
      dealType: DealType
    ): DealReturn!
    # getBuyerDeals(limit: Int, offset: Int,search:String): [Deal!]!
    getBuyerInprogressDeals(
      limit: Int
      offset: Int
      search: String
    ): DealReturn!
    getSellerInprogressDeals(
      limit: Int
      offset: Int
      search: String
    ): DealReturn!
    getBuyerCompletedDeals(limit: Int, offset: Int, search: String): DealReturn!
    getSellerCompletedDeals(
      limit: Int
      offset: Int
      search: String
    ): DealReturn!
    getDeal(id: ID!): Deal

    getFinanceCount: FinanceCount
    getRenenueGraph(year: Int): FinanceAnalytics!
    getCompletedDeals(limit: Int, offset: Int, filter: DealFilter): DealReturn!
    getBankDetailsByDealId(dealId: ID!): [DealBank!]!
  }

  type Mutation {
    createDeal(input: CreateDealInput!): Deal
    updateDeal(input: UpdateDealInput!): Deal
    deleteDeal(id: ID!): Boolean!
  }
`;

export default deal;
