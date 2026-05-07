/**
 * dashboard.ts — Dashboard mutations
 * Matches OLD frontend graphql/mutation/login.js + mutations.js exactly.
 */
import { gql } from '@apollo/client';

export const UPDATE_USER = gql`
  mutation UpdateUser($input: UpdateUserInput!) {
    updateUser(input: $input) {
      id
    }
  }
`;

export const CHANGE_PASSWORD = gql`
  mutation AdminChangePassword(
    $adminChangePasswordId: ID
    $oldPassword: String
    $newPassword: String
  ) {
    adminChangePassword(
      id: $adminChangePasswordId
      oldPassword: $oldPassword
      newPassword: $newPassword
    )
  }
`;

export const UPDATE_OFFER_STATUS = gql`
  mutation UpdateOfferStatus($input: UpdateOfferStatusInput!) {
    updateOfferStatus(input: $input) {
      id
    }
  }
`;

export const COUNTER_OFFER = gql`
  mutation CounterOffer($input: CounterOfferInput!) {
    counterOffer(input: $input) {
      id
    }
  }
`;

export const MARK_NOTIFICATION_AS_READ = gql`
  mutation MarkNotificationAsRead($userId: ID!) {
    markNotificationAsRead(id: $userId)
  }
`;

export const ADD_BANK = gql`
  mutation AddBank($input: BankInput!) {
    addBank(input: $input) {
      id
    }
  }
`;

export const DELETE_BANK = gql`
  mutation DeleteBank($deleteBankId: ID!) {
    deleteBank(id: $deleteBankId)
  }
`;

export const SET_ACTIVE_BANK = gql`
  mutation SetActiveBank($setActiveBankId: ID!) {
    setActiveBank(id: $setActiveBankId)
  }
`;

export const APPROVE_MEETING = gql`
  mutation ApproveMeeting($meetingId: ID!, $offerId: ID) {
    approveMeeting(meetingId: $meetingId, offerId: $offerId)
  }
`;

export const CREATE_SAVE_BUSINESS = gql`
  mutation SaveBusiness($saveBusinessId: ID!) {
    saveBusiness(id: $saveBusinessId)
  }
`;

export const UPDATE_DEAL = gql`
  mutation UpdateDeal($input: UpdateDealInput!) {
    updateDeal(input: $input) {
      id
      isDsaBuyer
      isDsaSeller
      isDocVedifiedBuyer
      isDocVedifiedSeller
      isCommissionVerified
      isCommissionUploaded
      isBuyerCompleted
      isSellerCompleted
    }
  }
`;

export const UPLOAD_DOCUMENT = gql`
  mutation UploadDocument($input: UpdateDocumentInput!) {
    uploadDocument(input: $input) {
      id
      filePath
    }
  }
`;

export const SEND_BANK_TO_BUYER = gql`
  mutation SendBankToBuyer($dealId: ID!, $bankId: ID!) {
    sendBankToBuyer(dealId: $dealId, bankId: $bankId)
  }
`;

export const REJECT_MEETING = gql`
  mutation RejectMeeting($rejectMeetingId: ID!) {
    rejectMeeting(id: $rejectMeetingId)
  }
`;

export const UPDATE_MEETING = gql`
  mutation UpdateMeeting($input: UpdateMeetingInput!) {
    updateMeeting(input: $input) {
      id
      status
      receiverAvailabilityDate
    }
  }
`;
