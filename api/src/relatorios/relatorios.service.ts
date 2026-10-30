import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type FiltrosRelatorio = {
  inicio?: string;
  fim?: string;
  ordemId?: string;
  maquinaId?: string;
  operadorId?: string;
};

function dataUTC(valor: string | undefined, fimExclusivo = false): Date | undefined {
  if (!valor) return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    throw new BadRequestException('Data inválida. Utilize AAAA-MM-DD.');
  }
  const data = new Date(`${valor}T00:00:00.000Z`);
  if (!Number.isFinite(data.getTime()) || data.toISOString().slice(0, 10) !== valor) {
    throw new BadRequestException('Data inválida.');
  }
  if (fimExclusivo) data.setUTCDate(data.getUTCDate() + 1);
  return data;
}

@Injectable()
export class RelatoriosService {
  constructor(private readonly prisma: PrismaService) {}

  async producao(filtros: FiltrosRelatorio) {
    const inicio = dataUTC(filtros.inicio);
    const fim = dataUTC(filtros.fim, true);
    if (inicio && fim && inicio >= fim) {
      throw new BadRequestException('A data inicial deve ser anterior ou igual à final.');
    }

    // Os filtros e a agregação usam somente dados locais do PRODSYNC.
    const apontamentos = await this.prisma.apontamentoProducao.findMany({
      where: {
        ...(inicio || fim ? { criadoEm: { ...(inicio ? { gte: inicio } : {}), ...(fim ? { lt: fim } : {}) } } : {}),
        ...(filtros.ordemId ? { ordemProducaoId: filtros.ordemId } : {}),
        ...(filtros.maquinaId ? { maquinaId: filtros.maquinaId } : {}),
        ...(filtros.operadorId ? { operadorId: filtros.operadorId } : {}),
      },
      select: {
        id: true, criadoEm: true, quantidadeProduzida: true, quantidadeRejeitada: true,
        ordemProducao: { select: { numero: true, produto: { select: { descricao: true } } } },
        maquina: { select: { codigo: true, nome: true } },
        operador: { select: { nome: true, email: true } },
      },
      orderBy: [{ criadoEm: 'desc' }, { id: 'desc' }],
    });

    type Grupo = { chave: string; nome: string; quantidadeProduzida: number; quantidadeRejeitada: number; apontamentos: number };
    const maquinas = new Map<string, Grupo>();
    const operadores = new Map<string, Grupo>();
    const dias = new Map<string, Grupo>();
    let quantidadeProduzida = 0;
    let quantidadeRejeitada = 0;

    function somar(mapa: Map<string, Grupo>, chave: string, nome: string, boa: number, rejeitada: number) {
      const grupo = mapa.get(chave) ?? { chave, nome, quantidadeProduzida: 0, quantidadeRejeitada: 0, apontamentos: 0 };
      grupo.quantidadeProduzida += boa;
      grupo.quantidadeRejeitada += rejeitada;
      grupo.apontamentos += 1;
      mapa.set(chave, grupo);
    }

    const registros = apontamentos.map((a) => {
      quantidadeProduzida += a.quantidadeProduzida;
      quantidadeRejeitada += a.quantidadeRejeitada;
      somar(maquinas, a.maquina.codigo, `${a.maquina.codigo} — ${a.maquina.nome}`, a.quantidadeProduzida, a.quantidadeRejeitada);
      somar(operadores, a.operador.email, a.operador.nome, a.quantidadeProduzida, a.quantidadeRejeitada);
      const dia = a.criadoEm.toISOString().slice(0, 10);
      somar(dias, dia, dia, a.quantidadeProduzida, a.quantidadeRejeitada);
      return {
        id: a.id,
        criadoEm: a.criadoEm,
        numeroOP: a.ordemProducao.numero,
        produto: a.ordemProducao.produto.descricao,
        maquina: a.maquina.nome,
        codigoMaquina: a.maquina.codigo,
        operador: a.operador.nome,
        quantidadeProduzida: a.quantidadeProduzida,
        quantidadeRejeitada: a.quantidadeRejeitada,
      };
    });
    const total = quantidadeProduzida + quantidadeRejeitada;
    return {
      filtros,
      resumo: {
        apontamentos: registros.length,
        quantidadeProduzida,
        quantidadeRejeitada,
        aproveitamento: total > 0 ? (quantidadeProduzida / total) * 100 : 0,
      },
      porMaquina: [...maquinas.values()].sort((a, b) => b.quantidadeProduzida - a.quantidadeProduzida),
      porOperador: [...operadores.values()].sort((a, b) => b.quantidadeProduzida - a.quantidadeProduzida),
      porDia: [...dias.values()].sort((a, b) => a.chave.localeCompare(b.chave)),
      registros,
    };
  }
}
