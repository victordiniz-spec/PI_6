import {
  BadRequestException, ConflictException, Injectable, NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EncerrarParadaDto, IniciarParadaDto } from './dto/paradas.dto';

const expandir = {
  maquina: { select: { codigo: true, nome: true } },
  ordemProducao: { select: { numero: true } },
  iniciadoPor: { select: { nome: true } },
  encerradoPor: { select: { nome: true } },
} as const;

@Injectable()
export class ParadasService {
  constructor(private readonly prisma: PrismaService) {}

  listar(filtros: { maquinaId?: string; ordemProducaoId?: string }) {
    return this.prisma.paradaProducao.findMany({
      where: {
        ...(filtros.maquinaId ? { maquinaId: filtros.maquinaId } : {}),
        ...(filtros.ordemProducaoId ? { ordemProducaoId: filtros.ordemProducaoId } : {}),
      },
      include: expandir,
      orderBy: { iniciadoEm: 'desc' },
      take: 500,
    });
  }

  async iniciar(dados: IniciarParadaDto, usuarioId: string) {
    const motivo = dados.motivo?.trim();
    if (!motivo || motivo.length > 80) throw new BadRequestException('Informe um motivo de até 80 caracteres.');
    const observacoes = dados.observacoes?.trim() || null;

    try {
      return await this.prisma.$transaction(async (tx) => {
        // Trava por máquina durante a transação para impedir duas paradas em aberto.
        // A chave do advisory lock fica no escopo da transação PostgreSQL.
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${dados.maquinaId}))`;

        const maquina = await tx.maquina.findUnique({ where: { id: dados.maquinaId } });
        if (!maquina) throw new NotFoundException('Máquina não encontrada.');
        if (maquina.situacao === 'INATIVA') throw new BadRequestException('Máquina inativa não pode receber parada.');

        if (dados.ordemProducaoId) {
          const op = await tx.ordemProducao.findUnique({ where: { id: dados.ordemProducaoId } });
          if (!op) throw new BadRequestException('OP não encontrada.');
        }

        const aberta = await tx.paradaProducao.findFirst({
          where: { maquinaId: dados.maquinaId, encerradoEm: null },
          select: { id: true },
        });
        if (aberta) throw new ConflictException('Esta máquina já possui uma parada em aberto.');

        return tx.paradaProducao.create({
          data: {
            maquinaId: dados.maquinaId,
            ordemProducaoId: dados.ordemProducaoId || null,
            motivo,
            observacoes,
            iniciadoPorId: usuarioId,
          },
          include: expandir,
        });
      });
    } catch (erro) {
      if (erro && typeof erro === 'object' && 'code' in erro && erro.code === 'P2002') {
        throw new ConflictException('Esta máquina já possui uma parada em aberto.');
      }
      throw erro;
    }
  }

  async encerrar(id: string, dados: EncerrarParadaDto, usuarioId: string) {
    const encerradoEm = new Date();
    const atualizado = await this.prisma.paradaProducao.updateMany({
      where: { id, encerradoEm: null },
      data: {
        encerradoEm,
        encerradoPorId: usuarioId,
        observacoesEncerramento: dados.observacoesEncerramento?.trim() || null,
      },
    });
    if (atualizado.count === 0) {
      const existe = await this.prisma.paradaProducao.findUnique({ where: { id }, select: { id: true } });
      if (!existe) throw new NotFoundException('Parada não encontrada.');
      throw new ConflictException('Esta parada já foi encerrada.');
    }
    return this.prisma.paradaProducao.findUnique({ where: { id }, include: expandir });
  }
}
