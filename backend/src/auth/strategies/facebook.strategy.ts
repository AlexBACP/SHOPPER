import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { AuthService } from '../auth.service';

/**
 * Estrategia Facebook OAuth.
 *
 * Variables de entorno requeridas:
 *   FACEBOOK_APP_ID      — App ID de Meta for Developers
 *   FACEBOOK_APP_SECRET  — App Secret de Meta for Developers
 *   BACKEND_URL          — URL base del backend (ej: http://localhost:3001)
 *
 * En Meta for Developers, agregar el callback como URI válida:
 *   http://localhost:3001/auth/facebook/callback   (desarrollo)
 *   https://api.tusitio.com/auth/facebook/callback (producción)
 */
@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(private readonly authService: AuthService) {
    super({
      clientID:      process.env.FACEBOOK_APP_ID     || 'FACEBOOK_NOT_CONFIGURED',
      clientSecret:  process.env.FACEBOOK_APP_SECRET || 'FACEBOOK_NOT_CONFIGURED',
      callbackURL:   `${process.env.BACKEND_URL ?? 'http://localhost:3001'}/auth/facebook/callback`,
      scope:         ['email', 'public_profile'],
      profileFields: ['id', 'displayName', 'emails'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: (err: Error | null, user?: any) => void,
  ): Promise<void> {
    const email: string   = (profile.emails?.[0] as any)?.value ?? `fb_${profile.id}@noemail.com`;
    const name: string    = profile.displayName ?? email.split('@')[0];
    const oauthId: string = profile.id;

    try {
      const user = await this.authService.loginOAuth({
        provider: 'facebook',
        oauthId,
        email,
        name,
      });
      done(null, user);
    } catch (err) {
      done(err as Error);
    }
  }
}
