// src/wompi/wompi.module.ts
import { Module } from '@nestjs/common';
import { WompiService } from './wompi.service';

@Module({
  providers: [WompiService],
  exports:   [WompiService],
})
export class WompiModule {}
