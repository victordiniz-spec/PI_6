
import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";

import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AdminGuard } from "../auth/admin.guard";

import { TabletsService } from "./tablets.service";

@Controller("tablets")
@UseGuards(JwtAuthGuard)
export class TabletsController {
  constructor(
    private readonly tabletsService: TabletsService,
  ) {}

  // Celular solicita cadastro
  @Post("solicitar")
  solicitarCadastro() {
    return this.tabletsService.solicitarCadastro();
  }

  // Celular consulta a própria autorização
  @Get("estado")
  consultarEstado(
    @Headers("x-prodsync-device-token")
    credencial: string | undefined,
  ) {
    return this.tabletsService.consultarEstado(
      credencial,
    );
  }

  // Administrador lista os dispositivos
  @Get()
  @UseGuards(AdminGuard)
  listar() {
    return this.tabletsService.listar();
  }

  // Administrador autoriza o dispositivo
  @Patch(":id/autorizar")
  @UseGuards(AdminGuard)
  autorizar(
    @Param("id") id: string,
    @Body()
    dados: {
      maquinaId: string;
      nome?: string;
    },
  ) {
    return this.tabletsService.autorizar(
      id,
      dados,
    );
  }

  // Administrador bloqueia o dispositivo
  @Patch(":id/bloquear")
  @UseGuards(AdminGuard)
  bloquear(@Param("id") id: string) {
    return this.tabletsService.bloquear(id);
  }
}
