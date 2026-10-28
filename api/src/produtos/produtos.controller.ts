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

import { CriarProdutoDto } from "./dto/criar-produto.dto";
import { ProdutosService } from "./produtos.service";

@Controller("produtos")
@UseGuards(JwtAuthGuard)
export class ProdutosController {
  constructor(
    private readonly produtosService: ProdutosService,
  ) {}

  // ADMIN, SUPERVISOR e OPERADOR autenticados
  @Get()
  listar() {
    return this.produtosService.listar();
  }

  @Get(":id")
  buscar(@Param("id") id: string) {
    return this.produtosService.buscarPorId(id);
  }

  // Somente ADMIN pode cadastrar
  @Post()
  @UseGuards(AdminGuard)
  criar(@Body() dados: CriarProdutoDto) {
    return this.produtosService.criar(dados);
  }
}
