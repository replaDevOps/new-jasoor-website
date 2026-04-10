/**
 * business.ts — Business & Interaction Mutations
 * All operation names and variable names match OLD frontend exactly.
 */
import { gql } from '@apollo/client';

export const CREATE_BUSINESS = gql`
  mutation CreateBusiness($input: CreateBusinessInput!) {
    createBusiness(input: $input) {
      id
    }
  }
`;

export const UPDATE_BUSINESS = gql`
  mutation UpdateBusiness($input: UpdateBusinessInput!) {
    updateBusiness(input: $input) {
      id
    }
  }
`;

export const CREATE_OFFER = gql`
  mutation CreateOffer($input: CreateOfferInput!) {
    createOffer(input: $input) {
      id
    }
  }
`;

/** Used for counter-offers and offer status updates */
export const UPDATE_OFFER_STATUS = gql`
  mutation UpdateOfferStatus($input: UpdateOfferStatusInput!) {
    updateOfferStatus(input: $input) {
      id
    }
  }
`;

/** requestMeeting — buyer books a meeting after accepting eNDA */
export const REQUEST_MEETING = gql`
  mutation RequestMeeting($input: CreateMeetingInput!) {
    requestMeeting(input: $input) {
      id
    }
  }
`;

/** createEnda — buyer directly buys without prior offer (eNDA modal) */
export const CREATE_ENDA = gql`
  mutation CreateEnda($input: AcceptEndaInput!) {
    createEnda(input: $input) {
      id
    }
  }
`;

export const CREATE_CONTACT = gql`
  mutation CreateContactUs($input: CreateContactInput!) {
    createContactUs(input: $input) {
      id
    }
  }
`;

export const VIEW_BUSINESS = gql`
  mutation ViewBusiness($viewBusinessId: ID!) {
    viewBusiness(id: $viewBusinessId)
  }
`;
