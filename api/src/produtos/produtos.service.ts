import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { CriarProdutoDto } from "./dto/criar-produto.dto";

@Injectable()
export class ProdutosService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async listar() {
    return this.prisma.produto.findMany({
      orderBy: {
        descricao: "asc",
      },
    });
  }

  async buscarPorId(id: string) {
    const produto = await this.prisma.produto.findUnique({
      where: { id },
    });

    if (!produto) {
      throw new NotFoundException(
        "Produto não encontrado.",
      );
    }

    return produto;
  }

  async criar(dados: CriarProdutoDto) {
    const codigo = dados.codigo.trim().toUpperCase();
    const descricao = dados.descricao.trim();

    if (!codigo || !descricao) {
      throw new BadRequestException(
        "Código e descrição são obrigatórios.",
      );
    }

    const existente =
      await this.prisma.produto.findUnique({
        where: { codigo },
      });

    if (existente) {
      throw new BadRequestException(
        "Já existe um produto com esse código.",
      );
    }

    try {
      return await this.prisma.produto.create({
        data: {
          codigo,
          descricao,
          cor: dados.cor?.trim(),
          acabamento: dados.acabamento?.trim(),
          larguraMm: dados.larguraMm,
          espessuraMm: dados.espessuraMm,
          unidade: dados.unidade?.trim() || "UN",
        },
      });
    } catch (error) {
      // Evita expor detalhes internos do PostgreSQL.
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "P2002"
      ) {
        throw new BadRequestException(
          "Já existe um produto com esse código.",
        );
      }

      throw error;
    }
  }
}
