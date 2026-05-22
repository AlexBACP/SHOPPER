// src/webhooks/webhooks.module.ts
import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WompiModule } from '../wompi/wompi.module';
import { PostgresModule } from '../database/postgres/postgres.module';

@Module({
  imports:     [PostgresModule, WompiModule],
  controllers: [WebhooksController],
})
export class WebhooksModule {}
