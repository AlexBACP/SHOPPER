import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';

/**
 * Estrategia Google OAuth 2.0.
 *
 * Variables de entorno requeridas:
 *   GOOGLE_CLIENT_ID      — Client ID de Google Cloud Console
 *   GOOGLE_CLIENT_SECRET  — Client Secret de Google Cloud Console
 *   BACKEND_URL           — URL base del backend (ej: http://localhost:3001)
 */
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly authService: AuthService) {
    super({
      clientID:     process.env.GOOGLE_CLIENT_ID     || 'GOOGLE_NOT_CONFIGURED',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'GOOGLE_NOT_CONFIGURED',
      callbackURL:  `${process.env.BACKEND_URL ?? 'http://localhost:3001'}/auth/google/callback`,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<void> {
    const email: string   = profile.emails?.[0]?.value ?? '';
    const name: string    = profile.displayName ?? email.split('@')[0];
    const oauthId: string = profile.id;

    try {
      const user = await this.authService.loginOAuth({
        provider: 'google',
        oauthId,
        email,
        name,
      });
      done(null, user);
    } catch (err) {
      done(err as Error, undefined);
    }
  }
}
