
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";

import {
  createHash,
  randomBytes,
  randomUUID,
} from "node:crypto";

import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class TabletsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  private hashCredencial(
    credencial: string,
  ): string {
    return createHash("sha256")
      .update(credencial)
      .digest("hex");
  }

  // ========================================
  // SOLICITAR CADASTRO
  // ========================================

  async solicitarCadastro() {
    const credencial = randomBytes(32)
      .toString("hex");

    const identificador = randomUUID();

    const tablet = await this.prisma.tablet.create({
      data: {
        identificador,
        situacao: "PENDENTE",
        credencialHash:
          this.hashCredencial(credencial),
      },
      select: {
        id: true,
        identificador: true,
        situacao: true,
        criadoEm: true,
      },
    });

    return {
      ...tablet,
      credencial,
      mensagem:
        "Dispositivo registrado. Aguarde autorização do administrador.",
    };
  }

  // ========================================
  // CONSULTAR ESTADO
  // ========================================

  async consultarEstado(
    credencial: string | undefined,
  ) {
    if (
      !credencial ||
      !/^[a-f0-9]{64}$/.test(credencial)
    ) {
      throw new UnauthorizedException(
        "Credencial do dispositivo inválida.",
      );
    }

    const tablet =
      await this.prisma.tablet.findUnique({
        where: {
          credencialHash:
            this.hashCredencial(credencial),
        },
        select: {
          id: true,
          identificador: true,
          nome: true,
          situacao: true,
          autorizadoEm: true,
          maquina: {
            select: {
              id: true,
              codigo: true,
              nome: true,
              situacao: true,
            },
          },
        },
      });

    if (!tablet) {
      throw new UnauthorizedException(
        "Dispositivo não reconhecido.",
      );
    }

    const liberado =
      tablet.situacao === "AUTORIZADO" &&
      tablet.maquina !== null &&
      tablet.maquina.situacao === "ATIVA";

    return {
      ...tablet,
      liberado,
      mensagem: liberado
        ? "Dispositivo autorizado."
        : tablet.situacao === "BLOQUEADO"
          ? "Dispositivo bloqueado pelo administrador."
          : tablet.situacao === "PENDENTE"
            ? "Aguardando autorização do administrador."
            : "A máquina vinculada não está disponível.",
    };
  }

  // ========================================
  // LISTAR DISPOSITIVOS — ADMIN
  // ========================================

  async listar() {
    return this.prisma.tablet.findMany({
      orderBy: {
        criadoEm: "desc",
      },
      select: {
        id: true,
        identificador: true,
        nome: true,
        situacao: true,
        maquinaId: true,
        autorizadoEm: true,
        criadoEm: true,
        atualizadoEm: true,
        maquina: {
          select: {
            id: true,
            codigo: true,
            nome: true,
            situacao: true,
          },
        },
      },
    });
  }

  // ========================================
  // AUTORIZAR DISPOSITIVO — ADMIN
  // ========================================

  async autorizar(
    tabletId: string,
    dados: {
      maquinaId: string;
      nome?: string;
    },
  ) {
    if (
      !dados ||
      typeof dados.maquinaId !== "string" ||
      !dados.maquinaId.trim()
    ) {
      throw new BadRequestException(
        "Selecione uma máquina.",
      );
    }

    const tablet =
      await this.prisma.tablet.findUnique({
        where: {
          id: tabletId,
        },
      });

    if (!tablet) {
      throw new NotFoundException(
        "Dispositivo não encontrado.",
      );
    }

    if (!tablet.credencialHash) {
      throw new ForbiddenException(
        "Dispositivo sem credencial segura.",
      );
    }

    const maquina =
      await this.prisma.maquina.findUnique({
        where: {
          id: dados.maquinaId.trim(),
        },
      });

    if (!maquina) {
      throw new NotFoundException(
        "Máquina não encontrada.",
      );
    }

    if (maquina.situacao !== "ATIVA") {
      throw new BadRequestException(
        "A máquina precisa estar ativa.",
      );
    }

    let nome = tablet.nome;

    if (dados.nome !== undefined) {
      if (
        typeof dados.nome !== "string" ||
        !dados.nome.trim() ||
        dados.nome.trim().length > 100
      ) {
        throw new BadRequestException(
          "Informe um nome entre 1 e 100 caracteres.",
        );
      }

      nome = dados.nome.trim();
    }

    return this.prisma.tablet.update({
      where: {
        id: tabletId,
      },
      data: {
        nome,
        maquinaId: maquina.id,
        situacao: "AUTORIZADO",
        autorizadoEm: new Date(),
      },
      select: {
        id: true,
        identificador: true,
        nome: true,
        situacao: true,
        autorizadoEm: true,
        maquina: {
          select: {
            id: true,
            codigo: true,
            nome: true,
            situacao: true,
          },
        },
      },
    });
  }

  // ========================================
  // BLOQUEAR DISPOSITIVO — ADMIN
  // ========================================

  async bloquear(tabletId: string) {
    const tablet =
      await this.prisma.tablet.findUnique({
        where: {
          id: tabletId,
        },
      });

    if (!tablet) {
      throw new NotFoundException(
        "Dispositivo não encontrado.",
      );
    }

    return this.prisma.tablet.update({
      where: {
        id: tabletId,
      },
      data: {
        situacao: "BLOQUEADO",
        autorizadoEm: null,
      },
      select: {
        id: true,
        identificador: true,
        nome: true,
        situacao: true,
        maquinaId: true,
      },
    });
  }
}
