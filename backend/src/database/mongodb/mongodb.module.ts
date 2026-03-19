//src/database/mongodb/mongodb.module.ts
import { Global, Module } from '@nestjs/common';
import { mongodbProvider, MONGO_CLIENT } from './mongodb.provider';

@Global()
@Module({
  providers: [mongodbProvider],
  exports: [MONGO_CLIENT],
})
export class MongodbModule {}