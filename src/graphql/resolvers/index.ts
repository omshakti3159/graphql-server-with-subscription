const { PubSub } = require('@apollo/server');

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