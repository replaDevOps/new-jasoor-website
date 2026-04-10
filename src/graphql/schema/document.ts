import { gql } from "apollo-server";

const document = gql`
  scalar DateTime
  scalar Upload

  type Document {
    id: ID!
    title: String!
    fileName: String
    fileType: String
    filePath: String
    description: String
    userId: ID
    user: User
  }

  input CreateDocumentInput {
    title: String!
    fileName: String
    fileType: String
    filePath: String
    description: String
    businessId: ID
  }

  input UpdateDocumentInput {
    id: ID
    title: String
    fileName: String
    fileType: String
    filePath: String
    description: String
    businessId: ID
  }

  input UploadIdentityInput {
    title: String!
    fileName: String!
    fileType: String!
    filePath: String!
    description: String
  }

  type Query {
    getDocuments(limit: Int, offset: Int): [Document!]!
    getDocument(id: ID!): Document
  }

  type Mutation {
    createDocument(input: CreateDocumentInput!): Document!
    updateDocument(input: UpdateDocumentInput!): Document!
    uploadDocument(input: UpdateDocumentInput!): Document!
    deleteDocument(id: ID!): Boolean!
    uploadFile(file: Upload!, title: String!, description: String): Document!
    uploadIdentityDocument(input: UploadIdentityInput!): Document!
  }
`;

export default document;
