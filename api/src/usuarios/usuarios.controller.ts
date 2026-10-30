import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AtualizarSituacaoUsuarioDto, AtualizarUsuarioDto, CriarUsuarioDto } from './dto/usuario.dto';
import { UsuariosService } from './usuarios.service';

type RequisicaoAutenticada = { user?: { sub?: string; id?: string } };

@Controller('usuarios')
@UseGuards(JwtAuthGuard, AdminGuard)
export class UsuariosController {
  constructor(private readonly usuarios: UsuariosService) {}

  @Get()
  listar() {
    return this.usuarios.listar();
  }

  @Post()
  criar(@Body() dados: CriarUsuarioDto) {
    return this.usuarios.criar(dados);
  }

  @Patch(':id')
  atualizar(@Param('id') id: string, @Body() dados: AtualizarUsuarioDto, @Req() req: RequisicaoAutenticada) {
    return this.usuarios.atualizar(id, dados, req.user?.sub ?? req.user?.id);
  }

  @Patch(':id/situacao')
  alterarSituacao(@Param('id') id: string, @Body() dados: AtualizarSituacaoUsuarioDto, @Req() req: RequisicaoAutenticada) {
    return this.usuarios.alterarSituacao(id, dados, req.user?.sub ?? req.user?.id);
  }
}
