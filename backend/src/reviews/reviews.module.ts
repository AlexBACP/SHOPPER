import { Module } from '@nestjs/common';
import { ReviewsController } from './reviews.controller';
import { ReviewsService }    from './reviews.service';
import { PostgresModule }    from '../database/postgres/postgres.module';
import { MongodbModule }     from '../database/mongodb/mongodb.module';

@Module({
  imports:     [PostgresModule, MongodbModule],
  controllers: [ReviewsController],
  providers:   [ReviewsService],
  exports:     [ReviewsService],
})
export class ReviewsModule {}
