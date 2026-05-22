// src/notifications/notifications.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [
    JwtModule.register({}), // el secret se pasa dinámicamente en el gateway
  ],
  providers: [NotificationsGateway, NotificationsService],
  exports:   [NotificationsService],
})
export class NotificationsModule {}
