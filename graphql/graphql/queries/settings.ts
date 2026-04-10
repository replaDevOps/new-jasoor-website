/**
 * settings.ts — App settings queries
 */
import { gql } from '@apollo/client';

export const GET_SETTING = gql`
  query GetSetting {
    getSetting {
      commissionRate
      faceBook
      instagram
      whatsApp
    }
  }
`;

export const GET_CUSTOMER_ROLE = gql`
  query GetCustomerRole {
    getCustomerRole {
      id
      name
    }
  }
`;
