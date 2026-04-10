import { gql } from "apollo-server-express";

const offer = gql`
  scalar DateTime
  enum OfferStatus {
    PENDING
    ACCEPTED
    REJECTED
    MEETING
  }

  type Offer {
    id: ID!
    price: Float!
    commission: Float
    message: String
    status: OfferStatus!
    createdAt: DateTime!
    createdBy: String
    isProceedToPay: Boolean!
    counterOffers: [Offer]
    parentOffer: Offer
    buyer: User!
    business: Business!
    meeting: Meeting
  }

  input CreateOfferInput {
    businessId: ID!
    price: Float!
    message: String
    parentOfferId: ID
    status: OfferStatus
    isProceedToPay: Boolean
  }

  input UpdateOfferStatusInput {
    id: ID!
    status: OfferStatus
    price: Float
  }

  input CounterOfferInput {
    parentOfferId: ID!
    price: Float!
    message: String
  }

  type OfferReturn {
    offers: [Offer!]!
    count: Int
  }

  type OfferCheck {
    exists: Boolean!
    isProceedToPay: Boolean!
  }

  type Query {
    getOffersByBusiness(businessId: ID!): [Offer!]!
    getOffersByUser(
      limit: Int
      offSet: Int
      status: String
      search: String
      isProceedToPay: Boolean
    ): OfferReturn!
    getOffersBySeller(status: OfferStatus, search: String): [Offer!]!
    getOffersById(id: String): Offer!
    getOfferByBusinessId(
      id: ID
      limit: Int
      offSet: Int
      search: String
      status: OfferStatus
      isProceedToPay: Boolean
    ): OfferReturn
    checkOfferExists(businessId: ID!, buyerId: ID!): OfferCheck!
  }

  type Mutation {
    createOffer(input: CreateOfferInput!): Offer!
    updateOfferStatus(input: UpdateOfferStatusInput!): Offer!
    counterOffer(input: CounterOfferInput!): Offer!
    setMeetingDate(offerId: ID!, meetingDate: DateTime!): Offer!
  }
`;

export default offer;
