import { gql } from 'apollo-server';

const endaAcceptance = gql`
input AcceptEndaInput {
  userId: ID!
  businessId: ID # optional if global
  acceptNdaTerms: Boolean!
  acceptPlatformTerms: Boolean!
  acceptCommission: Boolean!
  commissionRate: Float
  signatureText: String
}

type EndaAcceptance {
  id: ID!
  user: User!
  business: Business
  acceptNdaTerms: Boolean!
  acceptPlatformTerms: Boolean!
  acceptCommission: Boolean!
  commissionRate: Float
  acceptedAt: DateTime!
  signatureText: String
  pdfUrl: String
}

type Mutation {
  createEnda(input: AcceptEndaInput!): EndaAcceptance!
  acceptEnda(id: ID!,userId:ID): EndaAcceptance!
}
type Query {
  getEndaByBusinessId(businessId: ID):EndaAcceptance!
}
`;

export default endaAcceptance;
