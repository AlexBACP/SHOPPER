// src/email/email.module.ts
import { Global, Module } from '@nestjs/common';
import { EmailService } from './email.service';

@Global()   // disponible en toda la app sin importar el módulo
@Module({
  providers: [EmailService],
  exports:   [EmailService],
})
export class EmailModule {}
