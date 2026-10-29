
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";

type SituacaoMaquina =
  | "ATIVA"
  | "MANUTENCAO"
  | "INATIVA";

type CriarMaquinaDto = {
  codigo: string;
  nome: string;
  descricao?: string;
};

type AtualizarMaquinaDto = {
  codigo?: string;
  nome?: string;
  descricao?: string | null;
};

type AtualizarSituacaoDto = {
  situacao: SituacaoMaquina;
};

@Injectable()
export class MaquinasService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // ========================================
  // VALIDAÇÕES
  // ========================================

  private validarTexto(
    valor: unknown,
    campo: string,
    tamanhoMaximo: number,
  ): string {
    if (typeof valor !== "string") {
      throw new BadRequestException(
        `${campo} deve ser um texto.`,
      );
    }

    const texto = valor.trim();

    if (!texto) {
      throw new BadRequestException(
        `${campo} é obrigatório.`,
      );
    }

    if (texto.length > tamanhoMaximo) {
      throw new BadRequestException(
        `${campo} deve ter no máximo ${tamanhoMaximo} caracteres.`,
      );
    }

    return texto;
  }

  private validarCodigo(valor: unknown): string {
    const codigo = this.validarTexto(
      valor,
      "Código",
      30,
    ).toUpperCase();

    if (!/^[A-Z0-9_-]+$/.test(codigo)) {
      throw new BadRequestException(
        "O código deve conter apenas letras, números, hífen ou sublinhado.",
      );
    }

    return codigo;
  }

  private validarSituacao(
    valor: unknown,
  ): SituacaoMaquina {
    if (
      valor !== "ATIVA" &&
      valor !== "MANUTENCAO" &&
      valor !== "INATIVA"
    ) {
      throw new BadRequestException(
        "Situação inválida. Utilize ATIVA, MANUTENCAO ou INATIVA.",
      );
    }

    return valor;
  }

  // ========================================
  // LISTAR
  // ========================================

  async listar() {
    return this.prisma.maquina.findMany({
      orderBy: {
        codigo: "asc",
      },
      include: {
        _count: {
          select: {
            tablets: true,
          },
        },
      },
    });
  }

  // ========================================
  // BUSCAR PELO ID
  // ========================================

  async buscarPorId(id: string) {
    const maquina =
      await this.prisma.maquina.findUnique({
        where: { id },
        include: {
          tablets: {
            select: {
              id: true,
              identificador: true,
              nome: true,
              situacao: true,
              criadoEm: true,
            },
          },
        },
      });

    if (!maquina) {
      throw new NotFoundException(
        "Máquina não encontrada.",
      );
    }

    return maquina;
  }

  // ========================================
  // CADASTRAR
  // ========================================

  async criar(dados: CriarMaquinaDto) {
    if (
      !dados ||
      typeof dados !== "object" ||
      Array.isArray(dados)
    ) {
      throw new BadRequestException(
        "Informe os dados da máquina.",
      );
    }

    const codigo = this.validarCodigo(
      dados.codigo,
    );

    const nome = this.validarTexto(
      dados.nome,
      "Nome",
      100,
    );

    let descricao: string | null = null;

    if (dados.descricao !== undefined) {
      descricao = this.validarTexto(
        dados.descricao,
        "Descrição",
        500,
      );
    }

    const existente =
      await this.prisma.maquina.findUnique({
        where: { codigo },
      });

    if (existente) {
      throw new ConflictException(
        "Já existe uma máquina cadastrada com esse código.",
      );
    }

    return this.prisma.maquina.create({
      data: {
        codigo,
        nome,
        descricao,
        situacao: "ATIVA",
      },
    });
  }

  // ========================================
  // ATUALIZAR CADASTRO
  // ========================================

  async atualizar(
    id: string,
    dados: AtualizarMaquinaDto,
  ) {
    if (
      !dados ||
      typeof dados !== "object" ||
      Array.isArray(dados)
    ) {
      throw new BadRequestException(
        "Informe os dados que deseja atualizar.",
      );
    }

    await this.buscarPorId(id);

    const atualizacao: {
      codigo?: string;
      nome?: string;
      descricao?: string | null;
    } = {};

    if (dados.codigo !== undefined) {
      atualizacao.codigo =
        this.validarCodigo(dados.codigo);

      const outraMaquina =
        await this.prisma.maquina.findUnique({
          where: {
            codigo: atualizacao.codigo,
          },
        });

      if (
        outraMaquina &&
        outraMaquina.id !== id
      ) {
        throw new ConflictException(
          "O código já pertence a outra máquina.",
        );
      }
    }

    if (dados.nome !== undefined) {
      atualizacao.nome =
        this.validarTexto(
          dados.nome,
          "Nome",
          100,
        );
    }

    if (dados.descricao !== undefined) {
      atualizacao.descricao =
        dados.descricao === null
          ? null
          : this.validarTexto(
              dados.descricao,
              "Descrição",
              500,
            );
    }

    if (Object.keys(atualizacao).length === 0) {
      throw new BadRequestException(
        "Nenhum campo válido foi informado para atualização.",
      );
    }

    return this.prisma.maquina.update({
      where: { id },
      data: atualizacao,
    });
  }

  // ========================================
  // ALTERAR SITUAÇÃO
  // ========================================

  async alterarSituacao(
    id: string,
    dados: AtualizarSituacaoDto,
  ) {
    if (
      !dados ||
      typeof dados !== "object" ||
      Array.isArray(dados)
    ) {
      throw new BadRequestException(
        "Informe a situação da máquina.",
      );
    }

    const situacao =
      this.validarSituacao(dados.situacao);

    await this.buscarPorId(id);

    // Impede reativar tablets automaticamente.
    // A autorização dos dispositivos será
    // controlada em um módulo separado.
    return this.prisma.maquina.update({
      where: { id },
      data: { situacao },
    });
  }
}
