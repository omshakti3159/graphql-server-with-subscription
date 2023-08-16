export const typeDefs = `
  type Comment {
    id: ID!
    content: String!
  }
  
  type Query {
    comments: [Comment!]!
  }
  
  type Mutation {
    postComment(content: String!): Comment!
  }
  
  type Subscription {
    newComment: Comment!
  }
`