// src/upload/upload.controller.ts
import {
  Controller, Post, UploadedFile,
  UseGuards, UseInterceptors, Query,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  // POST /upload/image?folder=stores  → sube logo de tienda
  // POST /upload/image?folder=products → sube imagen de producto
  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 }, // máx 5 MB
    }),
  )
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder: string,
  ) {
    if (!file) throw new BadRequestException('No se recibió ningún archivo');

    const validFolders = ['stores', 'products'];
    const target = validFolders.includes(folder) ? folder : 'products';

    const url = await this.uploadService.uploadImage(
      file.buffer,
      file.mimetype,
      target as 'stores' | 'products',
    );

    return { url };
  }
}