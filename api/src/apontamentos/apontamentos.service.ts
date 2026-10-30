
import {
  BadRequestException,
  ConflictException,
  Injectable,
} from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { CriarApontamentoDto } from "./dto/criar-apontamento.dto";

@Injectable()
export class ApontamentosService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // ==========================================
  // LISTAR HISTÓRICO DE PRODUÇÃO
  // ==========================================

  async listar(filtros: {
    ordemId?: string;
    maquinaId?: string;
    operadorId?: string;
  }) {
    const registros =
      await this.prisma.apontamentoProducao.findMany({
        where: {
          ...(filtros.ordemId
            ? { ordemProducaoId: filtros.ordemId }
            : {}),

          ...(filtros.maquinaId
            ? { maquinaId: filtros.maquinaId }
            : {}),

          ...(filtros.operadorId
            ? { operadorId: filtros.operadorId }
            : {}),
        },

        include: {
          ordemProducao: {
            select: {
              numero: true,
              produto: {
                select: {
                  descricao: true,
                },
              },
            },
          },

          maquina: {
            select: {
              codigo: true,
              nome: true,
            },
          },

          operador: {
            select: {
              nome: true,
              email: true,
            },
          },
        },

        orderBy: {
          criadoEm: "desc",
        },

        take: 500,
      });

    // Mantém os nomes esperados pelo Web.
    return registros.map((registro) => ({
      ...registro,
      ordemId: registro.ordemProducaoId,
      ordem: registro.ordemProducao,
      quantidadeBoa: registro.quantidadeProduzida,
      observacoes: null,
    }));
  }

  // ==========================================
  // REGISTRAR APONTAMENTO
  // ==========================================

  async criar(dados: CriarApontamentoDto) {
    if (
      !Number.isSafeInteger(dados.quantidadeBoa) ||
      dados.quantidadeBoa < 1 ||
      !Number.isSafeInteger(
        dados.quantidadeRejeitada,
      ) ||
      dados.quantidadeRejeitada < 0
    ) {
      throw new BadRequestException(
        "Informe quantidades válidas.",
      );
    }

    // Mantém a atualização da OP e a
    // criação do histórico na mesma transação.
    return this.prisma.$transaction(async (tx) => {
      const [ordem, maquina, operador] =
        await Promise.all([
          tx.ordemProducao.findUnique({
            where: {
              id: dados.ordemId,
            },
          }),

          tx.maquina.findUnique({
            where: {
              id: dados.maquinaId,
            },
          }),

          tx.usuario.findUnique({
            where: {
              id: dados.operadorId,
            },
          }),
        ]);

      // Validar ordem de produção
      if (!ordem) {
        throw new BadRequestException(
          "Ordem de produção não encontrada.",
        );
      }

      // Validar máquina
      if (
        !maquina ||
        maquina.situacao !== "ATIVA"
      ) {
        throw new BadRequestException(
          "Selecione uma máquina ativa.",
        );
      }

      // Validar operador
      if (!operador || !operador.ativo) {
        throw new BadRequestException(
          "Selecione um operador ativo.",
        );
      }

      if (operador.perfil !== "OPERADOR") {
        throw new BadRequestException(
          "O usuário selecionado não possui perfil de operador.",
        );
      }

      // Validar situação da OP
      if (
        ordem.situacao === "FINALIZADA" ||
        ordem.situacao === "CANCELADA"
      ) {
        throw new ConflictException(
          "Não é permitido apontar em OP finalizada ou cancelada.",
        );
      }

      // Validar quantidade planejada
      if (
        ordem.quantidadeProduzida +
          dados.quantidadeBoa >
        ordem.quantidadePlanejada
      ) {
        throw new BadRequestException(
          "A quantidade produzida ultrapassa o planejamento da OP.",
        );
      }

      // ======================================
      // ATUALIZAR QUANTIDADE DA OP
      // ======================================

      const atualizado =
        await tx.ordemProducao.updateMany({
          where: {
            id: ordem.id,

            quantidadeProduzida:
              ordem.quantidadeProduzida,

            situacao: {
              notIn: [
                "FINALIZADA",
                "CANCELADA",
              ],
            },
          },

          data: {
            quantidadeProduzida: {
              increment: dados.quantidadeBoa,
            },

            ...(ordem.situacao === "PENDENTE"
              ? {
                  situacao: "EM_PRODUCAO" as const,
                  iniciadaEm: new Date(),
                }
              : {}),
          },
        });

      if (atualizado.count !== 1) {
        throw new ConflictException(
          "A OP foi modificada. Atualize e tente novamente.",
        );
      }

      // ======================================
      // SALVAR HISTÓRICO DO APONTAMENTO
      // ======================================

      const apontamento =
        await tx.apontamentoProducao.create({
          data: {
            ordemProducaoId: dados.ordemId,
            maquinaId: dados.maquinaId,
            operadorId: dados.operadorId,

            quantidadeProduzida:
              dados.quantidadeBoa,

            quantidadeRejeitada:
              dados.quantidadeRejeitada,
          },

          include: {
            ordemProducao: {
              select: {
                numero: true,
              },
            },

            maquina: {
              select: {
                nome: true,
              },
            },

            operador: {
              select: {
                nome: true,
              },
            },
          },
        });

      // Compatibilidade com os nomes
      // utilizados no frontend atual.
      return {
        ...apontamento,
        ordemId: apontamento.ordemProducaoId,
        ordem: apontamento.ordemProducao,
        quantidadeBoa:
          apontamento.quantidadeProduzida,
        observacoes: null,
      };
    });
  }
}
