import { Body, ConflictException, Controller, Get, Post, UseGuards } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { AdminGuard } from '../auth/admin.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CriarUsuarioDto } from './dto/criar-usuario.dto';

@Controller('usuarios')
@UseGuards(JwtAuthGuard, AdminGuard)
export class UsuariosController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async listar() {
    return this.prisma.usuario.findMany({
      select: { id: true, nome: true, email: true, perfil: true, ativo: true, criadoEm: true },
      orderBy: { criadoEm: 'desc' },
    });
  }

  @Post()
  async criar(@Body() dados: CriarUsuarioDto) {
    const email = dados.email.trim().toLowerCase();
    const nome = dados.nome.trim();
    if (await this.prisma.usuario.findUnique({ where: { email } })) throw new ConflictException('Já existe um usuário com este e-mail.');
    const senhaHash = await argon2.hash(dados.senha, { type: argon2.argon2id });
    try {
      return await this.prisma.usuario.create({
        data: { nome, email, senhaHash, perfil: dados.perfil, ativo: true },
        select: { id: true, nome: true, email: true, perfil: true, ativo: true, criadoEm: true },
      });
    } catch (err) {
      if (err && typeof err === 'object' && 'code' in err && err.code === 'P2002') throw new ConflictException('Já existe um usuário com este e-mail.');
      throw err;
    }
  }
}
