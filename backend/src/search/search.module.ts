// src/search/search.module.ts
import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { PostgresModule } from '../database/postgres/postgres.module';
import { MongodbModule } from '../database/mongodb/mongodb.module';

@Module({
  imports:     [PostgresModule, MongodbModule],
  controllers: [SearchController],
})
export class SearchModule {}
