import { gql } from "apollo-server-core";

const general = gql`
  scalar DateTime
  scalar JSON

  type FAQ {
    id: ID!
    question: String
    arabicQuestion: String
    answer: String
    arabicAnswer: String
    isArabic: Boolean!
  }

  # Terms schema
  type Terms {
    id: ID!
    term: JSON
    ndaTerm: JSON
    policy: JSON
    dsaTerms: JSON
    arabicTerm: JSON
    arabicNdaTerm: JSON
    arabicPolicy: JSON
    arabicDsaTerms: JSON
    isArabic: Boolean!
    createdAt: DateTime!
  }

  # Article schema
  type Article {
    id: ID!
    title: String
    arabicTitle: String
    image: String
    body: JSON
    arabicBody: JSON
    isArabic: Boolean!
    createdAt: DateTime
  }

  type ReturnArticle {
    articles: [Article!]!
    totalCount: Int!
  }

  type ReturnFAQ {
    faqs: [FAQ!]!
    totalCount: Int!
  }

  type GeneratePdfResponse {
    success: Boolean!
    url: String
    base64: String
    filename: String
  }

  input TermsInput {
    term: JSON
    ndaTerm: JSON
    policy: JSON
    dsaTerms: JSON
    arabicTerm: JSON
    arabicNdaTerm: JSON
    arabicPolicy: JSON
    arabicDsaTerms: JSON
    isArabic: Boolean!
  }

  input CreateArticle {
    title: String
    arabicTitle: String
    image: String
    body: JSON
    arabicBody: JSON
    isArabic: Boolean!
  }

  input CreateFAQ {
    question: String
    arabicQuestion: String
    answer: String
    arabicAnswer: String
    isArabic: Boolean!
  }

  type Query {
    getFAQs(
      search: String
      isArabic: Boolean
      limit: Int
      offset: Int
    ): ReturnFAQ!
    getFAQ(id: ID!): FAQ

    getArticles(
      search: String
      isArabic: Boolean
      limit: Int
      offset: Int
    ): ReturnArticle!
    getArticle(id: ID!): Article

    getTerms: [Terms!]!
    getNDATerms: [Terms!]!
    getDSATerms: [Terms!]!
    getPrivacyPolicy: [Terms!]!
  }

  type Mutation {
    # Article mutations
    createArticle(input: CreateArticle): Article!
    updateArticle(id: ID!, input: CreateArticle): Article!
    deleteArticle(id: ID!): Boolean!

    # FAQ mutations
    createFAQ(input: CreateFAQ): FAQ!
    updateFAQ(id: ID!, input: CreateFAQ): FAQ!
    deleteFAQ(id: ID!): Boolean!

    # Terms mutations
    createTerms(input: TermsInput): Terms!
    updateTerms(id: ID!, input: TermsInput): Terms!
    deleteTerms(id: ID!): Boolean!

    generateTermsPdf(
      termsId: ID!
      variables: JSON!
      saveToDisk: Boolean
    ): GeneratePdfResponse!
  }
`;

export default general;
