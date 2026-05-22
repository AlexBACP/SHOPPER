// src/upload/upload.module.ts
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';

@Module({
  imports: [
    // Guarda el archivo en memoria (Buffer) para mandarlo directo a Cloudinary
    MulterModule.register({ storage: memoryStorage() }),
  ],
  providers:   [UploadService],
  controllers: [UploadController],
  exports:     [UploadService],
})
export class UploadModule {}
