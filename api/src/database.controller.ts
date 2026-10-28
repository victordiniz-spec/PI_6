import { Controller, Get } from "@nestjs/common";
import { PrismaService } from "./prisma/prisma.service";

@Controller("database")
export class DatabaseController {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  @Get("status")
  async verificarBanco() {
    const totalUsuarios =
      await this.prisma.usuario.count();

    return {
      sistema: "PRODSYNC ERP",
      banco: "PostgreSQL",
      conexao: "OK",
      totalUsuarios,
      mensagem: "Banco de dados conectado com sucesso!",
    };
  }
}
