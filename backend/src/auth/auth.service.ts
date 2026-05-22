// src/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService:   JwtService,
    private readonly emailService:  EmailService,
  ) {}

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

    this.emailService.sendWelcome(name, email).catch(() => null);

    return this.login(user);
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
