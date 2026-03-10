import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async crearUsuario(nombre: string, email: string) {
    return this.prisma.user.create({
      data: { nombre, email },
    });
  }

  async listarUsuarios() {
    return this.prisma.user.findMany();
  }
}
