import { gql } from "apollo-server-express";

const wallet = gql`
  type DealBank {
    id: ID!
    deal: Deal!
    bank: Bank!
    isSend: Boolean!
  }

  type Bank {
    id: ID!
    bankName: String!
    accountTitle: String!
    accountNumber: String
    cardNumber: String
    cardType: String
    iban: String!
    swiftCode: String
    isActive: Boolean!
    isAdmin: Boolean!
    isSend: Boolean!
    createdAt: String
    updatedAt: String
    user: User
  }

  input BankInput {
    bankName: String
    accountTitle: String
    accountNumber: String
    cardNumber: String
    cardType: String
    iban: String
    swiftCode: String
    isActive: Boolean
    isAdmin: Boolean
  }

  input CreateWalletInput {
    address: String!
  }

  type Query {
    getAdminBanks: [Bank!]!
    getActiveAdminBank: Bank!
    getUserBanks(id: ID): [Bank!]!
    getUserActiveBanks(id: ID): Bank!
    getBankDetailsByDealId(dealId: ID!): [DealBank!]!
  }

  type Mutation {
    addBank(input: BankInput!): Bank!
    updateBank(id: ID!, input: BankInput!): Bank!
    setActiveBank(id: ID!): Boolean!
    deleteBank(id: ID!): Boolean!
    addAdminBank(id: ID, input: BankInput!): Bank!
    sendBankToBuyer(id: ID): Bank!
  }
`;
export default wallet;
