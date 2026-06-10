// src/users/user.controller.ts
import {
  Controller, Get, Patch, Delete,
  Param, Body, UseGuards, HttpCode,
} from '@nestjs/common';
import { IsEnum, IsString, MinLength, MaxLength } from 'class-validator';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';

// ── DTOs ────────────────────────────────────────────────
class UpdateRoleDto {
  @IsEnum(Role)
  role: Role;
}

class UpdateMeDto {
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  name: string;
}

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ── NUEVO: cualquier usuario autenticado puede editar su nombre
  @Patch('me')
  updateMe(@Body() dto: UpdateMeDto, @CurrentUser() user: any) {
    return this.usersService.updateMe(user.id, dto.name);
  }

  // ── Admin en adelante ───────────────────────────────

  // GET /users → lista todos los usuarios
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  // PATCH /users/:id/role → cambia el rol de un usuario
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Patch(':id/role')
  updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() requester: any,
  ) {
    return this.usersService.updateRole(id, dto.role, requester.id, requester.role);
  }

  // DELETE /users/:id → invalida la sesión del usuario
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Delete(':id')
  @HttpCode(200)
  deactivate(@Param('id') id: string, @CurrentUser() requester: any) {
    return this.usersService.deactivate(id, requester.id, requester.role);
  }
}