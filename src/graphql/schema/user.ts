import { gql } from "apollo-server";

const user = gql`
  scalar DateTime

  enum Gender {
    MALE
    FEMALE
    OTHER
  }

  enum UserStatus {
    inactive
    pending
    verified
    under_review
  }

  type Role {
    id: ID!
    name: String!
    isActive: Boolean!
    createdAt: DateTime!
    viewDashboard: Boolean!
    viewListings: Boolean!
    editListings: Boolean!
    approveRejectListings: Boolean!
    viewMeetingRequests: Boolean!
    scheduleMeetings: Boolean!
    editMeetingDetails: Boolean!
    cancelMeetings: Boolean!
    viewDeals: Boolean!
    trackDealProgress: Boolean!
    verifyDocuments: Boolean!
    finalizeDeal: Boolean!
    viewFinanceDashboard: Boolean!
    downloadFinancialReports: Boolean!
    viewWebsitePages: Boolean!
    editArticle: Boolean!
    deleteArticle: Boolean!
    publishArticle: Boolean!
    viewAlerts: Boolean!
    manageRoles: Boolean!
    users: [User!]!
  }

  type User {
    id: ID!
    name: String
    district: String
    city: String
    phone: String
    email: String!
    picture: String
    password: String!
    otp: Int!
    status: UserStatus
    isProfileCompleted: Boolean
    lastLoginDate: String
    refreshToken: String
    type: String
    language: String

    role: Role
    documents: [Document!]
    notifications: [Notification!]
    businesses: [Business!]
    buyBusinesses: [Business!]
    favouriteBusinesses: [Business!]
    viewedBusinesses: [BusinessView!]
    offers: [Offer!]
    meetings: [Meeting!]
    banks: [Bank!]!
  }

  input CreateRoleInput {
    name: String!
    viewDashboard: Boolean = false
    viewListings: Boolean = false
    editListings: Boolean = false
    approveRejectListings: Boolean = false
    viewMeetingRequests: Boolean = false
    scheduleMeetings: Boolean = false
    editMeetingDetails: Boolean = false
    cancelMeetings: Boolean = false
    viewDeals: Boolean = false
    trackDealProgress: Boolean = false
    verifyDocuments: Boolean = false
    finalizeDeal: Boolean = false
    viewFinanceDashboard: Boolean = false
    downloadFinancialReports: Boolean = false
    viewWebsitePages: Boolean = false
    editArticle: Boolean = false
    deleteArticle: Boolean = false
    publishArticle: Boolean = false
    viewAlerts: Boolean = false
    manageRoles: Boolean = false
  }

  input UpdateRoleInput {
    id: String!
    name: String
    isActive: Boolean
    viewDashboard: Boolean
    viewListings: Boolean
    editListings: Boolean
    approveRejectListings: Boolean
    viewMeetingRequests: Boolean
    scheduleMeetings: Boolean
    editMeetingDetails: Boolean
    cancelMeetings: Boolean
    viewDeals: Boolean
    trackDealProgress: Boolean
    verifyDocuments: Boolean
    finalizeDeal: Boolean
    viewFinanceDashboard: Boolean
    downloadFinancialReports: Boolean
    viewWebsitePages: Boolean
    editArticle: Boolean
    deleteArticle: Boolean
    publishArticle: Boolean
    viewAlerts: Boolean
    manageRoles: Boolean
  }

  input UserInput {
    name: String!
    phone: String
    email: String!
    password: String!
    picture: String
    district: String
    city: String
    otp: Int
    roleId: ID
    isProfileCompleted: Boolean
    lastLoginDate: String
    refreshToken: String
    documents: [CreateDocumentInput]
  }

  input UpdateUserInput {
    id: String!
    name: String
    phone: String
    email: String
    password: String
    picture: String
    district: String
    city: String
    otp: Int
    status: UserStatus
    isProfileCompleted: Boolean
    lastLoginDate: String
    refreshToken: String
    roleId: ID
    documents: [UpdateDocumentInput]
    language: String
  }

  type LogoutResponse {
    message: String!
  }

  type LoginRes {
    token: String!
    refreshToken: String!
    user: User!
  }

  type AuthPayload {
    token: String!
    refreshToken: String!
    user: User!
  }

  type RefreshTokenResponse {
    refreshToken: String!
    token: String!
    user: User!
  }

  type PasswordResetResponse {
    success: Boolean!
    message: String!
  }

  type OTPVerificationResponse {
    success: Boolean!
    message: String!
    resetToken: String
  }

  type UserSummary {
    viewedBusinessesCount: Int
    listedBusinessesCount: Int
    receivedOffersCount: Int
    pendingMeetingsCount: Int
    scheduledMeetingsCount: Int!
    finalizedDealsCount: Int!
    favouriteBusinessesCount: Int
  }

  input UserFilterInput {
    district: String
    city: String
    name: String
    createdType: String
    status: UserStatus
  }

  type userReturn {
    users: [User!]!
    totalCount: Int
  }

  type roleReturn {
    roles: [Role!]!
    totalCount: Int
  }

  type staffRes {
    staff: User!
  }

  type loginOTPResponse {
    success: Boolean!
    message: String!
    email: String!
  }

  type Query {
    getRoles(
      limit: Int
      offset: Int
      search: String
      isActive: Boolean
    ): roleReturn!
    getRole(id: ID): Role!
    getCustomerRole: Role!
    getUser(id: ID!): User
    getNavUser(id: ID!): User
    getUserDetails(id: ID!): User
    getUsers(limit: Int, offset: Int, filter: UserFilterInput): userReturn!
    getCustomers: [User!]!

    checkPassword(oldPassword: String): Boolean

    getProfileStatistics(startDate: String, endDate: String): UserSummary!
    getBuyerStatistics(startDate: String, endDate: String): UserSummary!

    getStaffMembers(
      limit: Int
      offset: Int
      search: String
      status: UserStatus
      roleId: ID
    ): userReturn!
  }

  type Mutation {
    createRole(input: CreateRoleInput!): Role!
    updateRole(input: UpdateRoleInput!): Role!
    deleteRole(id: ID): Boolean!

    login(email: String, password: String!): LoginRes!
    staffLogin(email: String, password: String!): LoginRes!
    logout: LogoutResponse!
    changePassword(newPassword: String): Boolean
    adminChangePassword(
      id: ID
      oldPassword: String
      newPassword: String
    ): Boolean

    requestPasswordReset(email: String!): PasswordResetResponse!
    verifyPasswordResetOTP(
      email: String!
      otp: String!
    ): OTPVerificationResponse!
    requestLoginOTP(email: String!, password: String!): loginOTPResponse!
    verifyLoginOTP(email: String!, otp: String!): OTPVerificationResponse!
    verifyEmailOTP(email: String!, otp: String!): OTPVerificationResponse!

    verifyEmail(email: String!): String
    resetPasswordWithToken(
      resetToken: String!
      newPassword: String!
    ): PasswordResetResponse!

    createUser(input: UserInput!): LoginRes!
    createStaff(input: UserInput!): staffRes!
    updateUser(input: UpdateUserInput!): User!
    deleteUser(id: ID): Boolean!

    generateClientAccountNumber: String
    refreshToken(token: String!): RefreshTokenResponse!
  }
`;

export default user;
