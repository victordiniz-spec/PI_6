import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { CriarApontamentoDto } from './dto/criar-apontamento.dto';
import { ApontamentosService } from './apontamentos.service';

@Controller('apontamentos')
@UseGuards(JwtAuthGuard, AdminGuard)
export class ApontamentosController {
  constructor(private readonly service: ApontamentosService) {}

  @Get()
  listar(
    @Query('ordemId') ordemId?: string,
    @Query('maquinaId') maquinaId?: string,
    @Query('operadorId') operadorId?: string,
  ) {
    return this.service.listar({ ordemId, maquinaId, operadorId });
  }

  @Post()
  criar(@Body() dados: CriarApontamentoDto) {
    return this.service.criar(dados);
  }
}
