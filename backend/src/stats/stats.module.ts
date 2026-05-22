// src/stats/stats.module.ts
import { Module } from '@nestjs/common';
import { StatsController } from './stats.controller';
import { PostgresModule } from '../database/postgres/postgres.module';
import { MongodbModule } from '../database/mongodb/mongodb.module';

@Module({
  imports:     [PostgresModule, MongodbModule],
  controllers: [StatsController],
})
export class StatsModule {}
