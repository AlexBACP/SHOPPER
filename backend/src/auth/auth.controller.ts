// src/auth/auth.controller.ts
import {
  Controller, Post, Patch, Get, Body, UseGuards,
  Req, Res, HttpCode, Headers, UnauthorizedException,
} from '@nestjs/common';
import { IsString, MinLength } from 'class-validator';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { FacebookAuthGuard } from './guards/facebook-auth.guard';
import { RegisterDto } from './dto/register.dto';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtService } from '@nestjs/jwt';

class ChangePasswordDto {
  @IsString() currentPassword: string;
  @IsString() @MinLength(8) newPassword: string;
}

const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:3000';

/** Redirige al frontend con los tokens como query params. */
function redirectWithTokens(res: Response, accessToken: string, refreshToken: string) {
  const url = new URL('/auth/callback', FRONTEND_URL);
  url.searchParams.set('access_token',   accessToken);
  url.searchParams.set('refresh_token',  refreshToken);
  res.redirect(url.toString());
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  // ── Email / contraseña ──────────────────────────────────────────

  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.name, dto.email, dto.password, dto.role ?? 'buyer');
  }

  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(200)
  login(@CurrentUser() user: any) {
    return this.authService.login(user);
  }

  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @Post('refresh')
  @HttpCode(200)
  async refresh(@Headers('x-refresh-token') refreshToken: string) {
    if (!refreshToken) throw new UnauthorizedException('Se requiere x-refresh-token');
    try {
      const payload = this.jwtService.decode(refreshToken) as any;
      if (!payload?.sub) throw new Error('Payload inválido');
      return this.authService.refresh(payload.sub, refreshToken);
    } catch {
      throw new UnauthorizedException('Refresh token inválido');
    }
  }

  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(200)
  logout(@CurrentUser() user: any) {
    return this.authService.logout(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  @HttpCode(200)
  changePassword(@CurrentUser() user: any, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(user.id, dto.currentPassword, dto.newPassword);
  }

  // ── Google OAuth ────────────────────────────────────────────────

  @SkipThrottle()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth() {
    // Passport redirige automáticamente a Google — este handler no se ejecuta
  }

  @SkipThrottle()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req: any, @Res() res: Response) {
    const tokens = req.user as { accessToken: string; refreshToken: string };
    redirectWithTokens(res, tokens.accessToken, tokens.refreshToken);
  }

  // ── Facebook OAuth ──────────────────────────────────────────────

  @SkipThrottle()
  @Get('facebook')
  @UseGuards(FacebookAuthGuard)
  facebookAuth() {
    // Passport redirige automáticamente a Facebook
  }

  @SkipThrottle()
  @Get('facebook/callback')
  @UseGuards(FacebookAuthGuard)
  async facebookCallback(@Req() req: any, @Res() res: Response) {
    const tokens = req.user as { accessToken: string; refreshToken: string };
    redirectWithTokens(res, tokens.accessToken, tokens.refreshToken);
  }

  // ── Apple OAuth (placeholder — requiere cuenta Apple Developer) ──

  @SkipThrottle()
  @Get('apple')
  appleAuth(@Res() res: Response) {
    // Apple Sign In requiere configuración adicional en Apple Developer:
    // Service ID, clave privada .p8, Team ID y Key ID.
    // Por ahora redirige al flujo de callback con error informativo.
    const url = new URL('/auth/callback', FRONTEND_URL);
    url.searchParams.set('error', 'apple_not_configured');
    res.redirect(url.toString());
  }
}
