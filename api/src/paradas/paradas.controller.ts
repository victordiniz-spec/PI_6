import {
  Body, CanActivate, Controller, ExecutionContext, ForbiddenException,
  Get, Injectable, Param, Patch, Post, Query, Req, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard, type RequisicaoAutenticada } from '../auth/jwt-auth.guard';
import { EncerrarParadaDto, IniciarParadaDto } from './dto/paradas.dto';
import { ParadasService } from './paradas.service';

@Injectable()
class AdminOuSupervisorGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<RequisicaoAutenticada>();
    if (req.usuario?.perfil === 'ADMIN' || req.usuario?.perfil === 'SUPERVISOR') return true;
    throw new ForbiddenException('Somente administradores e supervisores podem gerenciar paradas.');
  }
}

@Controller('paradas')
@UseGuards(JwtAuthGuard, AdminOuSupervisorGuard)
export class ParadasController {
  constructor(private readonly service: ParadasService) {}

  @Get()
  listar(@Query('maquinaId') maquinaId?: string, @Query('ordemProducaoId') ordemProducaoId?: string) {
    return this.service.listar({ maquinaId, ordemProducaoId });
  }

  @Post()
  iniciar(@Body() dados: IniciarParadaDto, @Req() req: RequisicaoAutenticada) {
    return this.service.iniciar(dados, req.usuario!.id);
  }

  @Patch(':id/encerrar')
  encerrar(@Param('id') id: string, @Body() dados: EncerrarParadaDto, @Req() req: RequisicaoAutenticada) {
    return this.service.encerrar(id, dados, req.usuario!.id);
  }
}
