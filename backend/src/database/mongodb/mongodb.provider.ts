//src/database/mongodb/mongodb.provider.ts
import { MongoClient } from 'mongodb';

export const MONGO_CLIENT = 'MONGO_CLIENT';

export const mongodbProvider = {
  provide: MONGO_CLIENT,
  useFactory: async (): Promise<MongoClient> => {
    const client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    console.log(' MongoDB conectado');
    return client;
  },
};
