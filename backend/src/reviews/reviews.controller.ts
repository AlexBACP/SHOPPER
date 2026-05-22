// src/reviews/reviews.controller.ts
import {
  Controller, Post, Get, Delete,
  Body, Param, UseGuards, HttpCode,
  BadRequestException,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

class CrearResenaDto {
  product_id: string;
  rating:     number;
  comment?:   string;
}

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  /** Crear reseña — requiere estar autenticado */
  @Post()
  @UseGuards(JwtAuthGuard)
  crear(@Body() dto: CrearResenaDto, @CurrentUser() user: any) {
    if (!dto.product_id) throw new BadRequestException('product_id requerido');
    if (!dto.rating || dto.rating < 1 || dto.rating > 5) {
      throw new BadRequestException('rating debe ser entre 1 y 5');
    }
    return this.reviewsService.crear(user.id, dto.product_id, dto.rating, dto.comment);
  }

  /** Listar reseñas de un producto — público */
  @SkipThrottle()
  @Get('product/:productId')
  obtener(@Param('productId') productId: string) {
    return this.reviewsService.obtenerPorProducto(productId);
  }

  /** Resumen (promedio + total) de un producto — público */
  @SkipThrottle()
  @Get('product/:productId/summary')
  resumen(@Param('productId') productId: string) {
    return this.reviewsService.resumen(productId);
  }

  /** Reseña del usuario actual para un producto */
  @SkipThrottle()
  @Get('product/:productId/mine')
  @UseGuards(JwtAuthGuard)
  mia(@Param('productId') productId: string, @CurrentUser() user: any) {
    return this.reviewsService.resenaDelUsuario(productId, user.id);
  }

  /** Eliminar propia reseña */
  @Delete(':id')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  eliminar(@Param('id') id: string, @CurrentUser() user: any) {
    return this.reviewsService.eliminar(id, user.id);
  }
}
