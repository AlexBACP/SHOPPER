// src/reviews/reviews.module.ts
import { Module } from '@nestjs/common';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { PostgresModule } from '../database/postgres/postgres.module';

@Module({
  imports:     [PostgresModule],
  controllers: [ReviewsController],
  providers:   [ReviewsService],
  exports:     [ReviewsService],
})
export class ReviewsModule {}
