import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { AtualizarSituacaoUsuarioDto, AtualizarUsuarioDto, CriarUsuarioDto, PerfilUsuarioDto } from './dto/usuario.dto';

const camposPublicos = {
  id: true, nome: true, email: true, perfil: true, ativo: true, criadoEm: true, atualizadoEm: true,
} as const;

function nomeValido(valor: unknown): string {
  if (typeof valor !== 'string' || valor.trim().length < 2 || valor.trim().length > 120)
    throw new BadRequestException('O nome deve ter de 2 a 120 caracteres.');
  return valor.trim();
}
function emailValido(valor: unknown): string {
  if (typeof valor !== 'string') throw new BadRequestException('E-mail inválido.');
  const email = valor.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new BadRequestException('E-mail inválido.');
  return email;
}
function perfilValido(valor: unknown): PerfilUsuarioDto {
  if (valor !== 'ADMIN' && valor !== 'SUPERVISOR' && valor !== 'OPERADOR')
    throw new BadRequestException('Perfil de acesso inválido.');
  return valor;
}
function senhaValida(valor: unknown): string {
  if (typeof valor !== 'string' || valor.length < 12 || valor.length > 128)
    throw new BadRequestException('A senha deve conter de 12 a 128 caracteres.');
  return valor;
}

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  listar() {
    return this.prisma.usuario.findMany({ select: camposPublicos, orderBy: { nome: 'asc' } });
  }

  async criar(dados: CriarUsuarioDto) {
    const nome = nomeValido(dados.nome);
    const email = emailValido(dados.email);
    const senha = senhaValida(dados.senha);
    const perfil = perfilValido(dados.perfil ?? 'OPERADOR');
    if (await this.prisma.usuario.findUnique({ where: { email }, select: { id: true } }))
      throw new ConflictException('Já existe um usuário cadastrado com este e-mail.');
    try {
      return await this.prisma.usuario.create({
        data: { nome, email, perfil, senhaHash: await argon2.hash(senha) },
        select: camposPublicos,
      });
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002') throw new ConflictException('E-mail já cadastrado.');
      throw error;
    }
  }

  async atualizar(id: string, dados: AtualizarUsuarioDto, solicitanteId?: string) {
    const atual = await this.prisma.usuario.findUnique({ where: { id } });
    if (!atual) throw new NotFoundException('Usuário não encontrado.');
    if (typeof dados !== 'object' || dados === null || Array.isArray(dados))
      throw new BadRequestException('Dados inválidos.');
    const nome = dados.nome === undefined ? undefined : nomeValido(dados.nome);
    const email = dados.email === undefined ? undefined : emailValido(dados.email);
    const perfil = dados.perfil === undefined ? undefined : perfilValido(dados.perfil);
    const senhaHash = dados.senha === undefined ? undefined : await argon2.hash(senhaValida(dados.senha));
    if (atual.id === solicitanteId && perfil && perfil !== 'ADMIN')
      throw new ForbiddenException('Você não pode retirar seu próprio perfil de administrador.');
    if (atual.perfil === 'ADMIN' && perfil && perfil !== 'ADMIN') {
      const administradores = await this.prisma.usuario.count({ where: { perfil: 'ADMIN', ativo: true } });
      if (atual.ativo && administradores <= 1) throw new ForbiddenException('É necessário manter pelo menos um administrador ativo.');
    }
    try {
      return await this.prisma.usuario.update({
        where: { id }, data: { nome, email, perfil, senhaHash }, select: camposPublicos,
      });
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002') throw new ConflictException('E-mail já cadastrado.');
      throw error;
    }
  }

  async alterarSituacao(id: string, dados: AtualizarSituacaoUsuarioDto, solicitanteId?: string) {
    if (typeof dados?.ativo !== 'boolean') throw new BadRequestException('Informe ativo como verdadeiro ou falso.');
    const atual = await this.prisma.usuario.findUnique({ where: { id } });
    if (!atual) throw new NotFoundException('Usuário não encontrado.');
    if (!dados.ativo && id === solicitanteId)
      throw new ForbiddenException('Você não pode desativar sua própria conta.');
    if (!dados.ativo && atual.ativo && atual.perfil === 'ADMIN') {
      const administradores = await this.prisma.usuario.count({ where: { perfil: 'ADMIN', ativo: true } });
      if (administradores <= 1) throw new ForbiddenException('É necessário manter pelo menos um administrador ativo.');
    }
    return this.prisma.usuario.update({ where: { id }, data: { ativo: dados.ativo }, select: camposPublicos });
  }
}
