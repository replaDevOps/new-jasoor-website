import { gql } from 'apollo-server';

const commission = gql`
  enum CommissionType {
    PERCENTAGE
    FIXED
    HYBRID
  }

  type CommissionBracket {
    id: ID!
    fromAmount: Float!
    toAmount: Float!
    type: CommissionType!
    percentageValue: Float!
    fixedValue: Float!
    isActive: Boolean!
    version: Int!
    description: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input CommissionBracketInput {
    fromAmount: Float!
    toAmount: Float!
    type: CommissionType!
    percentageValue: Float
    fixedValue: Float
    description: String
  }

  input UpdateCommissionBracketInput {
    id: ID!
    fromAmount: Float
    toAmount: Float
    type: CommissionType
    percentageValue: Float
    fixedValue: Float
    isActive: Boolean
    description: String
  }

  type Query {
    getCommissionBrackets: [CommissionBracket!]!
    getActiveCommissionBrackets: [CommissionBracket!]!
    previewCommission(price: Float!): Float!
  }

  type Mutation {
    createCommissionBracket(input: CommissionBracketInput!): CommissionBracket!
    updateCommissionBracket(input: UpdateCommissionBracketInput!): CommissionBracket!
    deleteCommissionBracket(id: ID!): Boolean!
    toggleCommissionBracket(id: ID!, isActive: Boolean!): CommissionBracket!
  }
`;

export default commission;
