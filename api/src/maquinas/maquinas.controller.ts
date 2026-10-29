
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";

import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AdminGuard } from "../auth/admin.guard";

import { MaquinasService } from "./maquinas.service";

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
  situacao: "ATIVA" | "MANUTENCAO" | "INATIVA";
};

@Controller("maquinas")
@UseGuards(JwtAuthGuard)
export class MaquinasController {
  constructor(
    private readonly maquinasService:
      MaquinasService,
  ) {}

  // Usuário autenticado pode consultar
  @Get()
  listar() {
    return this.maquinasService.listar();
  }

  @Get(":id")
  buscar(@Param("id") id: string) {
    return this.maquinasService.buscarPorId(id);
  }

  // Somente ADMIN pode cadastrar
  @Post()
  @UseGuards(AdminGuard)
  criar(@Body() dados: CriarMaquinaDto) {
    return this.maquinasService.criar(dados);
  }

  // Somente ADMIN pode editar
  @Patch(":id")
  @UseGuards(AdminGuard)
  atualizar(
    @Param("id") id: string,
    @Body() dados: AtualizarMaquinaDto,
  ) {
    return this.maquinasService.atualizar(
      id,
      dados,
    );
  }

  // Somente ADMIN altera situação
  @Patch(":id/situacao")
  @UseGuards(AdminGuard)
  alterarSituacao(
    @Param("id") id: string,
    @Body() dados: AtualizarSituacaoDto,
  ) {
    return this.maquinasService.alterarSituacao(
      id,
      dados,
    );
  }
}
