import { gql } from "apollo-server";

const notification = gql`
  enum CampaignGroup {
    NEW
    OLD
    BOTH
  }

  enum NotificationActionType {
    VIEW_OFFERS
    VIEW_DEALS
    VIEW_MEETINGS
    VIEW_LISTING
    VIEW_ALERTS
  }

  type Notification {
    id: ID!
    name: String!
    message: String
    isRead: Boolean!
    isAdmin: Boolean!
    createdAt: DateTime!
    user: User
    entityType: String
    entityId: String
    actionType: NotificationActionType
  }

  type Setting {
    id: ID!
    commissionRate: String!
    faceBook: String
    instagram: String
    whatsApp: String
    x: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Campaingn {
    id: ID!
    title: String!
    group: CampaignGroup!
    district: [String]!
    schedule: DateTime!
    description: String
    status: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type CampaingnReturn {
    campaigns: [Campaingn!]!
    totalCount: Int!
  }

  input CampaignFilter {
    limit: Int
    offset: Int
    search: String
    group: CampaignGroup
    district: String
    status: Boolean
  }

  type NotificationReturn {
    notifications: [Notification!]!
    count: Int
    time: DateTime
  }
  type AlertsResponse {
    groups: [NotificationReturn!]!
    count: Int!
  }
  type Query {
    getNotifications(userId: ID!, limit: Int, offSet: Int): NotificationReturn!
    getNotificationCount: Int
    getNotification(id: ID!): Notification

    getAdminNotifications: NotificationReturn!
    getAlerts(userId: ID, limit: Int, offset: Int): AlertsResponse!
    getSetting: Setting!

    getCampaigns(filter: CampaignFilter): CampaingnReturn!
  }

  type Mutation {
    # createNotification(userId: ID!, title: String!, message: String!): Notification!
    markNotificationAsRead(id: ID!): Boolean!

    createSettings(
      commissionRate: String!
      faceBook: String
      instagram: String
      whatsApp: String
      x: String
    ): Setting!
    updateSettings(
      id: ID!
      commissionRate: String
      faceBook: String
      instagram: String
      whatsApp: String
      x: String
    ): Setting!

    createCampaign(
      title: String!
      group: CampaignGroup!
      district: [String]!
      schedule: DateTime!
      description: String
    ): Campaingn!

    updateCampaign(
      id: ID!
      title: String
      group: CampaignGroup
      district: [String]!
      schedule: DateTime
      description: String
      status: Boolean
    ): Campaingn!

    deleteCampaign(id: ID!): Boolean!
  }

  type Subscription {
    newNotification: Notification!
  }
`;

export default notification;
