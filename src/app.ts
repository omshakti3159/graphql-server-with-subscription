import { ApolloServer } from '@apollo/server';
import { createServer } from 'http';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { makeExecutableSchema } from '@graphql-tools/schema';
import bodyParser from 'body-parser';
import express from 'express';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { PubSub } from 'graphql-subscriptions';
import { GraphQLSchema } from 'graphql';

const port = 3000;

const pubsub = new PubSub();
const comments:any[] = []

export const resolvers ={
    Query: {
      comments: ():any[] => [...comments],
    },
    Mutation: {
      postComment: (parent:any, args:any, context:any) => {
        const newComment = { id: Date.now().toString(), content: args.content };
        comments.push(newComment);
        pubsub.publish('NEW_COMMENT', { newComment });
        return newComment;
      },
    },
    Subscription: {
      newComment: {
        subscribe: () => pubsub.asyncIterator(['NEW_COMMENT']),
      },
    },
  };


const typeDefs = `
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



const schema:GraphQLSchema = makeExecutableSchema({ typeDefs, resolvers });

const app = express();
const httpServer = createServer(app);

const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql'
});

const wsServerCleanup = useServer({schema}, wsServer);

const apolloServer = new ApolloServer({
    schema,
    plugins: [
       // Proper shutdown for the HTTP server.
       ApolloServerPluginDrainHttpServer({ httpServer }),

       // Proper shutdown for the WebSocket server.
       {
        async serverWillStart() {
            return {
                async drainServer() {
                    await wsServerCleanup.dispose();
                }
            }
        }
       }
    ]
});

await apolloServer.start();

app.use('/graphql', bodyParser.json(), expressMiddleware(apolloServer));

httpServer.listen(port, () => {
    console.log(`🚀 Query endpoint ready at http://localhost:${port}/graphql`);
    console.log(`🚀 Subscription endpoint ready at ws://localhost:${port}/graphql`);
});