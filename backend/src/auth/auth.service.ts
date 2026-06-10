// src/auth/auth.service.ts
import {
  Injectable, Inject,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Pool } from 'pg';
import { POSTGRES_POOL } from '../database/postgres/postgres.provider';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(POSTGRES_POOL) private readonly pool: Pool,
    private readonly usersService: UsersService,
    private readonly jwtService:   JwtService,
    private readonly emailService:  EmailService,
  ) {}

  // ── Recuperación de contraseña (código por email) ─────────────────────

  /** Paso 1: genera un código de 6 dígitos, lo guarda hasheado y lo envía.
   *  NUNCA revela si el email existe (evita enumeración de cuentas). */
  async forgotPassword(email: string): Promise<{ ok: true }> {
    const user = await this.usersService.findByEmail(email.toLowerCase().trim());
    if (user) {
      const code     = String(Math.floor(100000 + Math.random() * 900000)); // 6 dígitos
      const codeHash = await bcrypt.hash(code, 10);
      // Invalida códigos anteriores no usados de este usuario
      await this.pool.query(
        `UPDATE password_resets SET used = true WHERE user_id = $1 AND used = false`,
        [user.id],
      );
      await this.pool.query(
        `INSERT INTO password_resets (user_id, token_hash, expires_at)
         VALUES ($1, $2, NOW() + INTERVAL '15 minutes')`,
        [user.id, codeHash],
      );
      this.emailService.sendPasswordReset(user.name, user.email, code).catch(() => null);
    }
    return { ok: true }; // respuesta idéntica exista o no la cuenta
  }

  /** Paso 2: valida el código vigente y actualiza la contraseña. */
  async resetPassword(email: string, code: string, newPassword: string): Promise<{ ok: true }> {
    const genError = new BadRequestException('El código es inválido o ya expiró');
    const user = await this.usersService.findByEmail(email.toLowerCase().trim());
    if (!user) throw genError;

    const { rows } = await this.pool.query<{ id: string; token_hash: string }>(
      `SELECT id, token_hash FROM password_resets
        WHERE user_id = $1 AND used = false AND expires_at > NOW()
        ORDER BY created_at DESC LIMIT 1`,
      [user.id],
    );
    const record = rows[0];
    if (!record) throw genError;

    const match = await bcrypt.compare(code.trim(), record.token_hash);
    if (!match) throw genError;

    const newHash = await bcrypt.hash(newPassword, 10);
    await this.usersService.updatePassword(user.id, newHash);
    await this.pool.query('UPDATE password_resets SET used = true WHERE id = $1', [record.id]);
    // Cierra sesiones activas por seguridad
    await this.usersService.updateRefreshToken(user.id, null).catch(() => null);
    return { ok: true };
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) return null;
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return null;
    return user;
  }

  private generateTokens(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role, name: user.name };
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '15m',
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });
    return { accessToken, refreshToken };
  }

  async login(user: any) {
    const { accessToken, refreshToken } = this.generateTokens(user);
    const refreshHash = await bcrypt.hash(refreshToken, 10);
    await this.usersService.updateRefreshToken(user.id, refreshHash);
    return { accessToken, refreshToken };
  }

  async register(name: string, email: string, password: string, role: 'buyer' | 'owner' = 'buyer') {
    const existing = await this.usersService.findByEmail(email);
    if (existing) throw new ConflictException('El email ya está en uso');

    const hash = await bcrypt.hash(password, 10);
    // Pasamos el rol al crear el usuario (solo buyer u owner)
    const user = await this.usersService.create(name, email, hash, role);

    // El registro por email empieza SIN verificar → enviamos enlace de verificación.
    await this.sendEmailVerification(user);

    return this.login(user);
  }

  // ── Verificación de email ─────────────────────────────────────────────

  /** Genera un token, lo guarda hasheado (SHA-256, vence en 24 h) y manda el enlace. */
  private async sendEmailVerification(user: { id: string; name: string; email: string }): Promise<void> {
    const token     = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expires   = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 h
    await this.usersService.setEmailVerification(user.id, tokenHash, expires);
    this.emailService.sendVerification(user.name, user.email, token).catch(() => null);
  }

  /** Verifica el token del enlace del email. */
  async verifyEmail(token: string): Promise<{ ok: true }> {
    if (!token || token.length < 16) throw new BadRequestException('Enlace de verificación inválido');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const ok = await this.usersService.verifyEmailByToken(tokenHash);
    if (!ok) throw new BadRequestException('El enlace es inválido o ya expiró');
    return { ok: true };
  }

  /** Reenvía el enlace de verificación (no revela si el email existe o ya está verificado). */
  async resendVerification(email: string): Promise<{ ok: true }> {
    const user = await this.usersService.findByEmail(email.toLowerCase().trim());
    if (user && (user as { email_verified?: boolean }).email_verified === false) {
      await this.sendEmailVerification(user);
    }
    return { ok: true };
  }

  async refresh(userId: string, rawRefreshToken: string) {
    const user = await this.usersService.findById(userId);
    if (!user?.refresh_token_hash) throw new ForbiddenException('Acceso denegado');
    const valid = await bcrypt.compare(rawRefreshToken, user.refresh_token_hash);
    if (!valid) throw new ForbiddenException('Token inválido');
    return this.login(user);
  }

  async logout(userId: string) {
    await this.usersService.updateRefreshToken(userId, null);
    return { message: 'Sesión cerrada' };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    const match = await bcrypt.compare(currentPassword, user.password_hash ?? '');
    if (!match) throw new UnauthorizedException('Contraseña actual incorrecta');
    const newHash = await bcrypt.hash(newPassword, 10);
    await this.usersService.updatePassword(userId, newHash);
    return { message: 'Contraseña actualizada correctamente' };
  }

  /**
   * Login o registro con proveedor OAuth (Google, Facebook).
   * Flujo:
   *  1. Buscar usuario por oauth_provider + oauth_id
   *  2. Si no existe, buscar por email (para vincular cuenta existente)
   *  3. Si tampoco existe, crear nuevo usuario buyer
   *  4. Generar tokens JWT y devolverlos
   */
  async loginOAuth(profile: {
    provider: string;
    oauthId:  string;
    email:    string;
    name:     string;
  }) {
    let user = await this.usersService.findByOAuth(profile.provider, profile.oauthId);

    if (!user) {
      // ¿Ya tiene cuenta con ese email? → vincular
      user = await this.usersService.findByEmail(profile.email);
      if (user) {
        await this.usersService.linkOAuth(user.id, profile.provider, profile.oauthId);
        user = (await this.usersService.findById(user.id))!;
      } else {
        // Crear cuenta nueva
        user = await this.usersService.createOAuthUser(
          profile.name,
          profile.email,
          profile.provider,
          profile.oauthId,
          'buyer',
        );
        this.emailService.sendWelcome(profile.name, profile.email).catch(() => null);
      }
    }

    return this.login(user);
  }
}
