import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';

export type UsuarioAutenticado = { id: string; nome: string; email: string; perfil: 'ADMIN' | 'SUPERVISOR' | 'OPERADOR' };
export type RequisicaoAutenticada = Request & { usuario?: UsuarioAutenticado };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService, private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequisicaoAutenticada>();
    const authorization = req.headers.authorization;
    const [tipo, token] = authorization?.split(' ') ?? [];
    if (tipo !== 'Bearer' || !token) throw new UnauthorizedException('Token de acesso ausente.');
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string }>(token);
      if (!payload.sub) throw new Error('Sem identificador');
      const usuario = await this.prisma.usuario.findUnique({ where: { id: payload.sub } });
      if (!usuario || !usuario.ativo) throw new Error('Inativo ou não encontrado');
      req.usuario = { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil };
      return true;
    } catch { throw new UnauthorizedException('Sessão inválida ou expirada. Faça login novamente.'); }
  }
}
