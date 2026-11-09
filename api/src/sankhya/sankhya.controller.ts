
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { SankhyaService } from './sankhya.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@Controller('sankhya')
@UseGuards(JwtAuthGuard, AdminGuard)
export class SankhyaController {
  constructor(
    private readonly sankhyaService: SankhyaService,
  ) {}

  // =====================================================
  // CONEXAO
  // =====================================================

  @Get('status')
  async verificarStatus() {
    return this.sankhyaService.testarConexao();
  }

  // =====================================================
  // PRODUTOS
  // =====================================================

  @Get('produtos')
  async listarProdutos(
    @Query('pagina') pagina?: string,
  ) {
    return this.sankhyaService.listarProdutos(
      pagina === undefined ? 0 : Number(pagina),
    );
  }

  @Get('produtos/previa')
  async visualizarProdutos(
    @Query('pagina') pagina?: string,
  ) {
    return this.sankhyaService.visualizarProdutos(
      pagina === undefined ? 0 : Number(pagina),
    );
  }

  @Post('produtos/sincronizar')
  async sincronizarProdutos(
    @Body()
    dados: {
      paginaInicial?: number;
      quantidadePaginas?: number;
    },
  ) {
    return this.sankhyaService.sincronizarProdutos(
      dados?.paginaInicial ?? 0,
      dados?.quantidadePaginas ?? 1,
    );
  }

  // =====================================================
  // UNIDADES DE MEDIDA
  // =====================================================

  @Get('produtos/unidades')
  async consultarUnidadesProdutos(
    @Query('pagina') pagina?: string,
  ) {
    return this.sankhyaService.consultarUnidadesProdutos(
      pagina === undefined ? 0 : Number(pagina),
    );
  }

  @Get('produtos/unidades/diferencas')
  async diferencasUnidades(
    @Query('pagina') pagina?: string,
  ) {
    return this.sankhyaService.visualizarDiferencasUnidades(
      pagina === undefined ? 0 : Number(pagina),
    );
  }

  @Post('produtos/unidades/atualizar')
  async atualizarUnidades(
    @Body()
    dados: {
      pagina?: number;
      confirmar?: boolean;
    },
  ) {
    return this.sankhyaService.atualizarUnidadesProdutos(
      dados?.pagina ?? 0,
      dados?.confirmar ?? false,
    );
  }

  // =====================================================
  // CONSULTA DE VARIAS OPS
  // =====================================================

  // Intervalo de ate 20 numeros
  @Get('ordens/listagem')
  async listarOrdensSankhya(
    @Query('inicio') inicio?: string,
    @Query('fim') fim?: string,
  ) {
    return this.sankhyaService.listarOrdensSankhya(
      inicio === undefined ? 42880 : Number(inicio),
      fim === undefined ? 42899 : Number(fim),
    );
  }

  // NOVO: consulta varios intervalos de OPs.
  // Nao grava registros no PostgreSQL.
  @Get('ordens/varredura')
  async varrerOrdensSankhya(
    @Query('inicio') inicio?: string,
    @Query('fim') fim?: string,
    @Query('maxBlocos') maxBlocos?: string,
  ) {
    return this.sankhyaService.varrerOrdensSankhya(
      inicio === undefined ? 42800 : Number(inicio),
      fim === undefined ? 42999 : Number(fim),
      maxBlocos === undefined
        ? 10
        : Number(maxBlocos),
    );
  }

  // =====================================================
  // PREVIA E IMPORTACAO EM LOTE
  // =====================================================

  @Get('ordens/lote/previa')
  async visualizarLote(
    @Query('inicio') inicio?: string,
    @Query('fim') fim?: string,
  ) {
    return this.sankhyaService.visualizarImportacaoLote(
      inicio === undefined ? 42880 : Number(inicio),
      fim === undefined ? 42899 : Number(fim),
    );
  }

  @Post('ordens/lote/importar')
  async importarLote(
    @Body()
    dados: {
      inicio?: number;
      fim?: number;
      confirmar?: boolean;
    },
  ) {
    return this.sankhyaService.importarLote(
      dados?.inicio ?? 42880,
      dados?.fim ?? 42899,
      dados?.confirmar ?? false,
    );
  }

  // =====================================================
  // CONSULTAS DE UMA OP
  // =====================================================

  @Get('ordens/:numero/produtos')
  async consultarProdutosOrdem(
    @Param('numero') numero: string,
  ) {
    return this.sankhyaService.consultarProdutosOrdem(
      Number(numero),
    );
  }

  @Get('ordens/:numero/cabecalho')
  async consultarCabecalhoOrdem(
    @Param('numero') numero: string,
  ) {
    return this.sankhyaService.consultarCabecalhoOrdem(
      Number(numero),
    );
  }

  @Get('ordens/:numero/previa')
  async visualizarOrdem(
    @Param('numero') numero: string,
  ) {
    return this.sankhyaService.visualizarOrdem(
      Number(numero),
    );
  }

  // =====================================================
  // IMPORTAR UMA OP
  // =====================================================

  @Post('ordens/:numero/importar')
  async importarOrdem(
    @Param('numero') numero: string,
    @Body()
    dados: {
      confirmar?: boolean;
    },
  ) {
    return this.sankhyaService.importarOrdem(
      Number(numero),
      dados?.confirmar ?? false,
    );
  }
}
