// src/chat/chat.module.ts
import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';

// Los módulos PostgresModule y MongodbModule son @Global(),
// por lo tanto sus providers (POSTGRES_POOL y MONGO_DB) ya
// están disponibles en toda la app sin necesidad de importarlos aquí.
@Module({
  controllers: [ChatController],
})
export class ChatModule {}
