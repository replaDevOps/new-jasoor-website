import { gql } from 'apollo-server-core';

const chat = gql`
  scalar DateTime

  type ContactUs {
    id: ID!
    name: String!
    email: String!
    message: String!
    answer: String
    isResponded: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }
    
  type Chat {
    id: ID!
    title: String!
    createdBy: User!
    participants: [ChatParticipant!]!
    messages: [Message!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type ChatParticipant {
    id: ID!
    user: User!
    isAdmin: Boolean!
    joinedAt: DateTime!
  }

  type Message {
    id: ID!
    content: String!
    sender: User!
    chat: Chat!
    createdAt: DateTime!
    updatedAt: DateTime!
  }
 input CreateContactInput {
    name: String!
    email: String!
    message: String!
 }

 type ContactUsReturn {
    contactUs: [ContactUs!]!
    totalCount: Int!
  }
  type Query {
    getChatById(id: ID!): Chat

    getUserChats: [Chat!]!
    getContactUs(id: ID!): ContactUs
    getAllContactUs(limit:Int,offset:Int,search:String,status:Boolean): ContactUsReturn!
  }

  type Mutation {
    createChat(title: String!, memberIds: [ID!]!): Chat!

    sendMessage(chatId: ID!, content: String!): Message!

    createContactUs(input: CreateContactInput!): ContactUs!
    updateContactUs(id: ID!, status:Boolean,answer: String): ContactUs!
  }
`;

export default chat;