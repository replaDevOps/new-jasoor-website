/**
 * dashboard.ts — All queries used by the Dashboard page.
 * Field names match OLD frontend graphql/query/user.js and graphql/query/offer.js exactly.
 */
import { gql } from '@apollo/client';

// ── User ──────────────────────────────────────────────────────────────────────

export const GET_USER_DETAILS = gql`
  query GetUserDetails($getUserDetailsId: ID!) {
    getUserDetails(id: $getUserDetailsId) {
      id
      name
      email
      phone
      city
      district
      status
    }
  }
`;

// ── Stats ─────────────────────────────────────────────────────────────────────

/** Seller stats */
export const GET_PROFILE_STATISTICS = gql`
  query GetProfileStatistics($startDate: String, $endDate: String) {
    getProfileStatistics(startDate: $startDate, endDate: $endDate) {
      finalizedDealsCount
      listedBusinessesCount
      pendingMeetingsCount
      receivedOffersCount
      scheduledMeetingsCount
      viewedBusinessesCount
    }
  }
`;

/** Buyer stats */
export const GET_BUYER_STATISTICS = gql`
  query GetBuyerStatistics($startDate: String, $endDate: String) {
    getBuyerStatistics(startDate: $startDate, endDate: $endDate) {
      finalizedDealsCount
      scheduledMeetingsCount
      favouriteBusinessesCount
    }
  }
`;

// ── Listings ──────────────────────────────────────────────────────────────────

export const GET_SELLER_BUSINESSES = gql`
  query GetAllSellerBusinesses($limit: Int, $offSet: Int) {
    getAllSellerBusinesses(limit: $limit, offSet: $offSet) {
      totalActiveCount
      totalCount
      totalPendingCount
      businesses {
        id
        offerCount
        businessStatus
        isByTakbeer
        businessTitle
        description
        revenue
        profit
        price
        capitalRecovery
        savedBy { id }
        category { id name arabicName }
      }
    }
  }
`;

export const GET_FAVORITE_BUSINESSES = gql`
  query GetFavoritBusiness($limit: Int, $offSet: Int) {
    getFavoritBusiness(limit: $limit, offSet: $offSet) {
      businesses {
        id
        businessStatus
        offerCount
        isByTakbeer
        businessTitle
        description
        revenue
        profit
        isSaved
        price
        capitalRecovery
        savedBy { id }
        category { id name arabicName }
      }
      totalCount
    }
  }
`;

// ── Offers ────────────────────────────────────────────────────────────────────

export const GET_OFFERS_BY_USER = gql`
  query GetOffersByUser($status: OfferStatus, $search: String) {
    getOffersByUser(status: $status, search: $search) {
      id
      price
      createdAt
      status
      createdBy
      isProceedToPay
      commission
      buyer { id name }
      business {
        id
        businessTitle
        price
        businessStatus
        seller { id name }
      }
    }
  }
`;

export const GET_OFFERS_BY_SELLER = gql`
  query GetOffersBySeller($status: OfferStatus, $search: String) {
    getOffersBySeller(status: $status, search: $search) {
      id
      price
      createdAt
      status
      createdBy
      isProceedToPay
      commission
      buyer { id name }
      business {
        id
        businessTitle
        price
        businessStatus
        seller { id name }
      }
    }
  }
`;

// ── Deals ─────────────────────────────────────────────────────────────────────

export const GET_BUYER_INPROGRESS_DEALS = gql`
  query GetBuyerInprogressDeals($limit: Int, $offSet: Int, $search: String) {
    getBuyerInprogressDeals(limit: $limit, offSet: $offSet, search: $search) {
      totalCount
      deals {
        id
        status
        price
        createdAt
        buyer { id name }
        business { id businessTitle seller { id name } }
        isDsaBuyer
        isDsaSeller
        isBuyerCompleted
        isSellerCompleted
        isCommissionVerified
        isDocVedifiedBuyer
        isDocVedifiedSeller
        isPaymentVedifiedSeller
        isDocVedifiedAdmin
        isPaymentVedifiedAdmin
        isCommissionUploaded
        ndaPdfPath
        arabicNdaPdfPath
      }
    }
  }
`;

export const GET_SELLER_INPROGRESS_DEALS = gql`
  query GetSellerInprogressDeals($limit: Int, $offSet: Int, $search: String) {
    getSellerInprogressDeals(limit: $limit, offSet: $offSet, search: $search) {
      totalCount
      deals {
        id
        status
        price
        createdAt
        buyer { id name }
        business { id businessTitle }
        isDsaBuyer
        isDsaSeller
        isBuyerCompleted
        isSellerCompleted
        isCommissionVerified
        isDocVedifiedBuyer
        isDocVedifiedSeller
        isPaymentVedifiedSeller
        isDocVedifiedAdmin
        isPaymentVedifiedAdmin
        isCommissionUploaded
        ndaPdfPath
        arabicNdaPdfPath
      }
    }
  }
`;

// ── Meetings ──────────────────────────────────────────────────────────────────

export const GET_SENT_MEETINGS = gql`
  query GetMySentMeetingRequests($search: String, $isBuyer: Boolean, $limit: Int, $offSet: Int) {
    getMySentMeetingRequests(search: $search, isBuyer: $isBuyer, limit: $limit, offSet: $offSet) {
      totalCount
      items {
        id
        createdAt
        requestedDate
        requestedEndDate
        receiverAvailabilityDate
        status
        requestedTo { name }
        business { businessTitle price }
        offer { id price }
      }
    }
  }
`;

export const GET_RECEIVED_MEETINGS = gql`
  query GetReceivedMeetingRequests($search: String, $isBuyer: Boolean, $limit: Int, $offSet: Int) {
    getReceivedMeetingRequests(search: $search, isBuyer: $isBuyer, limit: $limit, offSet: $offSet) {
      totalCount
      items {
        id
        createdAt
        requestedDate
        requestedEndDate
        receiverAvailabilityDate
        status
        requestedTo { name }
        requestedBy { id name }
        business { id businessTitle price businessStatus }
        offer { id price }
      }
    }
  }
`;

// ── Notifications ─────────────────────────────────────────────────────────────

export const GET_NOTIFICATIONS = gql`
  query GetNotifications($userId: ID!, $limit: Int, $offSet: Int) {
    getNotifications(userId: $userId, limit: $limit, offSet: $offSet) {
      count
      notifications {
        id
        createdAt
        isRead
        name
        message
        user { id name }
      }
    }
  }
`;

// ── Wallet / Banks ────────────────────────────────────────────────────────────

export const GET_USER_BANKS = gql`
  query GetUserBanks {
    getUserBanks {
      id
      bankName
      accountNumber
      accountTitle
      iban
      isActive
      createdAt
    }
  }
`;

// ── Real-time subscription ─────────────────────────────────────────────────────

export const NEW_NOTIFICATION_SUBSCRIPTION = gql`
  subscription OnNewNotification {
    newNotification {
      id
      name
      message
      createdAt
      isRead
      user {
        id
        name
      }
    }
  }
`;

// ── Completed deals ────────────────────────────────────────────────────────────

export const GET_BUYER_COMPLETED_DEALS = gql`
  query GetBuyerCompletedDeals($limit: Int, $offSet: Int, $search: String) {
    getBuyerCompletedDeals(limit: $limit, offSet: $offSet, search: $search) {
      totalCount
      deals {
        id
        buyer { id name }
        status
        business { id businessTitle seller { id name } }
        price
        createdAt
      }
    }
  }
`;

export const GET_SELLER_COMPLETED_DEALS = gql`
  query GetSellerCompletedDeals($limit: Int, $offSet: Int, $search: String) {
    getSellerCompletedDeals(limit: $limit, offSet: $offSet, search: $search) {
      totalCount
      deals {
        id
        buyer { id name }
        business { id businessTitle }
        price
        createdAt
      }
    }
  }
`;

export const GET_DEAL = gql`
  query GetDeal($getDealId: ID!) {
    getDeal(id: $getDealId) {
      id
      price
      status
      isDsaSeller
      isDsaBuyer
      isPaymentVedifiedSeller
      isDocVedifiedSeller
      isDocVedifiedAdmin
      isCommissionVerified
      isPaymentVedifiedAdmin
      isBuyerCompleted
      isSellerCompleted
      isDocVedifiedBuyer
      isCommissionUploaded
      createdAt
      ndaPdfPath
      arabicNdaPdfPath
      business {
        id
        businessTitle
        seller { id name }
        documents { id title filePath }
      }
      buyer { id name }
      offer { id price status commission }
    }
  }
`;

export const GET_SELLER_SOLD_BUSINESSES = gql`
  query GetAllSellerSoldBusinesses($limit: Int, $offSet: Int) {
    getAllSellerSoldBusinesses(limit: $limit, offSet: $offSet) {
      businesses {
        id
        businessStatus
        isByTakbeer
        businessTitle
        description
        revenue
        profit
        price
        capitalRecovery
        category { id name arabicName }
      }
      totalCount
    }
  }
`;

export const GET_BANKS_FOR_DEAL = gql`
  query GetBankDetailsByDealId($dealId: ID!) {
    getBankDetailsByDealId(dealId: $dealId) {
      id
      isSend
      bank {
        id
        bankName
        iban
        accountTitle
      }
    }
  }
`;

export const GET_ACTIVE_ADMIN_BANK = gql`
  query GetActiveAdminBank {
    getActiveAdminBank {
      id
      accountTitle
      bankName
      accountNumber
      iban
    }
  }
`;

export const GET_USER_ACTIVE_BANK = gql`
  query GetUserActiveBanks($getUserActiveBanksId: ID) {
    getUserActiveBanks(id: $getUserActiveBanksId) {
      id
      accountTitle
      bankName
      iban
      isActive
    }
  }
`;

export const GET_READY_SCHEDULED_MEETINGS = gql`
  query GetMeetingsReadyForScheduling($search: String, $isBuyer: Boolean, $limit: Int, $offSet: Int) {
    getMeetingsReadyForScheduling(search: $search, isBuyer: $isBuyer, limit: $limit, offSet: $offSet) {
      totalCount
      items {
        id
        createdAt
        requestedDate
        requestedEndDate
        receiverAvailabilityDate
        status
        requestedBy { id name }
        requestedTo { id name }
        business { businessTitle price seller { id } }
        offer { id price }
      }
    }
  }
`;

export const GET_SCHEDULED_MEETINGS = gql`
  query GetScheduledMeetings($search: String, $isBuyer: Boolean, $limit: Int, $offSet: Int) {
    getScheduledMeetings(search: $search, isBuyer: $isBuyer, limit: $limit, offSet: $offSet) {
      totalCount
      items {
        id
        createdAt
        adminAvailabilityDate
        status
        meetingLink
        requestedTo { name }
        requestedBy { id name }
        business { businessTitle price seller { id } }
        offer { id price }
      }
    }
  }
`;
