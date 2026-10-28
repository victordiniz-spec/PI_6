import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";

import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AdminGuard } from "../auth/admin.guard";

import { CriarOrdemDto } from "./dto/criar-ordem.dto";

import { OrdensProducaoService } from "./ordens-producao.service";

@Controller("ordens-producao")
@UseGuards(JwtAuthGuard)
export class OrdensProducaoController {
  constructor(
    private readonly ordensService:
      OrdensProducaoService,
  ) {}

  // Listagem de OPs
  @Get()
  listar() {
    return this.ordensService.listar();
  }

  // Consulta pelo numero
  @Get(":numero")
  buscar(
    @Param("numero") numero: string,
  ) {
    return this.ordensService.buscarPorNumero(
      numero,
    );
  }

  // Somente administradores criam OPs
  @Post()
  @UseGuards(AdminGuard)
  criar(
    @Body() dados: CriarOrdemDto,
  ) {
    return this.ordensService.criar(dados);
  }
}
