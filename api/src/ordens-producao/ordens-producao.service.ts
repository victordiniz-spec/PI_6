import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { CriarOrdemDto } from "./dto/criar-ordem.dto";

@Injectable()
export class OrdensProducaoService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  private readonly incluirProduto = {
    produto: {
      select: {
        id: true,
        codigo: true,
        descricao: true,
        cor: true,
        acabamento: true,
        unidade: true,
      },
    },
  };

  // Listar ordens cadastradas
  async listar() {
    return this.prisma.ordemProducao.findMany({
      include: this.incluirProduto,
      orderBy: {
        criadoEm: "desc",
      },
    });
  }

  // Consultar OP pelo numero
  async buscarPorNumero(numero: string) {
    const numeroNormalizado =
      numero.trim().toUpperCase();

    const ordem =
      await this.prisma.ordemProducao.findUnique({
        where: {
          numero: numeroNormalizado,
        },
        include: this.incluirProduto,
      });

    if (!ordem) {
      throw new NotFoundException(
        "Ordem de produção não encontrada.",
      );
    }

    return ordem;
  }

  // Criar nova OP
  async criar(dados: CriarOrdemDto) {
    const numero =
      dados.numero.trim().toUpperCase();

    if (!/^[A-Z0-9-]{1,40}$/.test(numero)) {
      throw new BadRequestException(
        "O número da OP deve conter apenas letras, números ou hífen.",
      );
    }

    // Verifica se o produto existe
    const produto =
      await this.prisma.produto.findUnique({
        where: {
          id: dados.produtoId,
        },
      });

    if (!produto || !produto.ativo) {
      throw new BadRequestException(
        "Produto inexistente ou inativo.",
      );
    }

    // Verifica se a OP já existe
    const existente =
      await this.prisma.ordemProducao.findUnique({
        where: {
          numero,
        },
      });

    if (existente) {
      throw new ConflictException(
        "Já existe uma OP com esse número.",
      );
    }

    try {
      return await this.prisma.ordemProducao.create({
        data: {
          numero,
          produtoId: dados.produtoId,
          quantidadePlanejada:
            dados.quantidadePlanejada,
          quantidadeProduzida: 0,
          situacao: "PENDENTE",
          observacoes:
            dados.observacoes?.trim() || null,
        },
        include: this.incluirProduto,
      });
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error
      ) {
        if (error.code === "P2002") {
          throw new ConflictException(
            "Já existe uma OP com esse número.",
          );
        }

        if (error.code === "P2003") {
          throw new BadRequestException(
            "Produto associado à OP é inválido.",
          );
        }
      }

      throw error;
    }
  }
}
