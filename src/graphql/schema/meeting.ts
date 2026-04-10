import { gql } from "apollo-server";

const meeting = gql`
  enum MeetingStatus {
    REQUESTED # User sent request, waiting for admin action
    ACCEPTED
    REJECTED # Request rejected before scheduling
    APPROVED # Approved but not yet held
    HELD # Meeting successfully held
    CANCELED # Meeting canceled after approval
    RESCHEDULED # Meeting rescheduled to a new date
    TIMELAPSED
  }

  type Meeting {
    id: ID!
    requestedTo: User!
    requestedBy: User
    business: Business!
    requestedDate: DateTime!
    requestedEndDate: DateTime
    receiverAvailabilityDate: DateTime
    adminAvailabilityDate: DateTime
    status: MeetingStatus!
    approvedDate: String
    createdAt: DateTime!
    meetingLink: String
    isCancel: Boolean!
    offer: Offer
    createdBy: String!
    updatedBy: String!
  }

  input CreateMeetingInput {
    businessId: ID!
    offerId: ID
    requestedDate: DateTime!
    requestedEndDate: DateTime
  }
  input UpdateMeetingInput {
    id: ID!
    businessId: ID
    offerId: ID
    requestedDate: DateTime
    receiverAvailabilityDate: DateTime
    requestedEndDate: DateTime
    adminAvailabilityDate: DateTime
    status: MeetingStatus
    meetingLink: String
    isCancel: Boolean
    offerPrice: Int
  }

  enum MeetingFilterType {
    SENT
    RECEIVED
    ACCEPTED
    PENDING
    SCHEDULED
    REQUESTED
    REJECTED
    APPROVED
    HELD
    CANCELED
    RESCHEDULED
    TIMELAPSED
  }
  type MeetingPage {
    items: [Meeting!]!
    totalCount: Int!
  }
  type MeetingCountRetun {
    todayMeetings: Int
    totalScheduleMeetings: Int
    totalPendingMeetings: Int
  }

  type Query {
    getMeetingsByBusiness(
      businessId: ID!
      limit: Int
      offSet: Int
    ): MeetingPage!
    getMeetings(
      id: ID!
      filter: MeetingFilterType
      search: String
      limit: Int
      offset: Int
    ): MeetingPage!
    getMySentMeetingRequests(
      isBuyer: Boolean
      search: String
      limit: Int
      offSet: Int
    ): MeetingPage!
    getReceivedMeetingRequests(
      isBuyer: Boolean
      search: String
      limit: Int
      offSet: Int
    ): MeetingPage!
    getMeetingsReadyForScheduling(
      isBuyer: Boolean
      search: String
      limit: Int
      offSet: Int
    ): MeetingPage!
    getScheduledMeetings(
      isBuyer: Boolean
      search: String
      status: Boolean
      limit: Int
      offSet: Int
    ): MeetingPage!
    getBuyerCount: Int
    getSellerCount: Int
    checkMeetingExists(businessId: ID!, buyerId: ID!): Boolean!

    getAdminPendingMeetings(
      search: String
      status: MeetingFilterType
      limit: Int
      offset: Int
    ): MeetingPage!
    getAdminScheduledMeetings(
      search: String
      status: MeetingFilterType
      limit: Int
      offset: Int
    ): MeetingPage!
    getAdminMeetingCounts: MeetingCountRetun
    getAdminCancelMeetings(
      search: String
      limit: Int
      offset: Int
    ): MeetingPage!
  }

  type Mutation {
    requestMeeting(input: CreateMeetingInput!): Meeting!
    updateMeeting(input: UpdateMeetingInput!): Meeting!
    approveMeeting(meetingId: ID!, offerId: ID): Boolean!
    rejectMeeting(meetingId: ID!): Boolean!
  }
`;

export default meeting;
