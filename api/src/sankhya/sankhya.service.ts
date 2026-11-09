
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

type RespostaSankhya = {
  status?: string | number;
  statusMessage?: string;
  responseBody?: unknown;
};

type RegistroProduto = {
  f0?: { $?: unknown };
  f1?: { $?: unknown };
  f2?: { $?: unknown };
};

type Entidades = {
  entity?: RegistroProduto | RegistroProduto[];
  hasMoreResult?: string | boolean;
};

type ProdutoBasico = {
  codigo: string;
  descricao: string;
};

type Classificacao = 'IMPORTAR' | 'IGNORAR' | 'FALHA';

@Injectable()
export class SankhyaService {
  private token: string | null = null;
  private tokenExpiraEm = 0;
  private autenticacaoPendente: Promise<string> | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  // =====================================================
  // CONFIGURACAO E AUTENTICACAO
  // =====================================================

  private configuracao() {
    const base = this.config.get<string>(
      'SANKHYA_BASE_URL',
    );
    const auth = this.config.get<string>(
      'SANKHYA_AUTH_URL',
    );
    const gateway = this.config.get<string>(
      'SANKHYA_GATEWAY_URL',
    );

    const clientId = this.config.get<string>(
      'SANKHYA_CLIENT_ID',
    );
    const clientSecret = this.config.get<string>(
      'SANKHYA_CLIENT_SECRET',
    );
    const xToken = this.config.get<string>(
      'SANKHYA_X_TOKEN',
    );

    if (
      !clientId ||
      !clientSecret ||
      !xToken ||
      (!base && !auth)
    ) {
      throw new InternalServerErrorException(
        'Integracao Sankhya nao configurada.',
      );
    }

    let authUrl: URL;
    let gatewayUrl: URL;

    try {
      authUrl = new URL(
        auth || '/authenticate',
        base || 'https://api.sandbox.sankhya.com.br',
      );

      gatewayUrl = new URL(
        gateway || base || authUrl.origin,
      );
    } catch {
      throw new InternalServerErrorException(
        'URLs Sankhya invalidas.',
      );
    }

    if (
      authUrl.protocol !== 'https:' ||
      gatewayUrl.protocol !== 'https:' ||
      authUrl.origin !== gatewayUrl.origin
    ) {
      throw new InternalServerErrorException(
        'Autenticacao e Gateway devem usar HTTPS e o mesmo ambiente.',
      );
    }

    return {
      authUrl: authUrl.toString(),
      gatewayUrl: gatewayUrl.origin,
      clientId,
      clientSecret,
      xToken,
    };
  }

  private async autenticar(): Promise<string> {
    const cfg = this.configuracao();

    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
    });

    let resposta: Response;

    try {
      resposta = await fetch(cfg.authUrl, {
        method: 'POST',
        headers: {
          'Content-Type':
            'application/x-www-form-urlencoded',
          Accept: 'application/json',
          'X-Token': cfg.xToken,
        },
        body,
        signal: AbortSignal.timeout(15000),
        redirect: 'error',
      });
    } catch {
      throw new ServiceUnavailableException(
        'Falha de conexao com a autenticacao Sankhya.',
      );
    }

    if (!resposta.ok) {
      throw new ServiceUnavailableException(
        `Autenticacao Sankhya: HTTP ${resposta.status}.`,
      );
    }

    let dados: {
      access_token?: string;
      expires_in?: string | number;
    };

    try {
      dados = await resposta.json();
    } catch {
      throw new ServiceUnavailableException(
        'Resposta de autenticacao invalida.',
      );
    }

    if (
      typeof dados.access_token !== 'string' ||
      !dados.access_token
    ) {
      throw new ServiceUnavailableException(
        'Sankhya nao retornou access_token.',
      );
    }

    const duracao = Number(dados.expires_in);
    const segundos =
      Number.isFinite(duracao) && duracao > 0
        ? duracao
        : 300;

    this.token = dados.access_token;
    this.tokenExpiraEm =
      Date.now() + Math.max(1, segundos - 30) * 1000;

    return this.token;
  }

  async obterToken(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiraEm) {
      return this.token;
    }

    if (!this.autenticacaoPendente) {
      this.autenticacaoPendente =
        this.autenticar().finally(() => {
          this.autenticacaoPendente = null;
        });
    }

    return this.autenticacaoPendente;
  }

  async testarConexao() {
    await this.obterToken();

    return {
      conectado: true,
      mensagem: 'Autenticacao Sankhya realizada.',
      ambiente: new URL(
        this.configuracao().authUrl,
      ).hostname,
      autenticadoEm: new Date().toISOString(),
    };
  }

  // =====================================================
  // GATEWAY E VALIDACOES
  // =====================================================

  private async consultarServico(
    nomeServico: string,
    corpo: object,
  ): Promise<RespostaSankhya> {
    const url = new URL(
      '/gateway/v1/mge/service.sbr',
      this.configuracao().gatewayUrl,
    );

    url.searchParams.set('serviceName', nomeServico);
    url.searchParams.set('outputType', 'json');

    const enviar = (token: string) =>
      fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(corpo),
        signal: AbortSignal.timeout(15000),
        redirect: 'error',
      });

    let resposta: Response;

    try {
      resposta = await enviar(await this.obterToken());

      if (resposta.status === 401) {
        this.token = null;
        this.tokenExpiraEm = 0;
        resposta = await enviar(await this.obterToken());
      }
    } catch {
      throw new ServiceUnavailableException(
        'Falha de comunicacao com o Gateway Sankhya.',
      );
    }

    if (!resposta.ok) {
      throw new ServiceUnavailableException(
        `Gateway Sankhya: HTTP ${resposta.status}.`,
      );
    }

    let dados: RespostaSankhya;

    try {
      dados = await resposta.json();
    } catch {
      throw new ServiceUnavailableException(
        'Resposta JSON invalida do Gateway.',
      );
    }

    if (
      !dados ||
      (dados.status !== '1' && dados.status !== 1)
    ) {
      throw new ServiceUnavailableException(
        'Consulta nao concluida pelo Sankhya.',
      );
    }

    return dados;
  }

  private validarPagina(pagina: number) {
    if (
      !Number.isInteger(pagina) ||
      pagina < 0 ||
      pagina > 1000
    ) {
      throw new BadRequestException(
        'Pagina deve estar entre 0 e 1000.',
      );
    }
  }

  private validarOp(numeroOp: number) {
    if (
      !Number.isSafeInteger(numeroOp) ||
      numeroOp <= 0
    ) {
      throw new BadRequestException(
        'Numero da OP invalido.',
      );
    }
  }

  private validarIntervalo(
    inicio: number,
    fim: number,
  ) {
    if (
      !Number.isSafeInteger(inicio) ||
      !Number.isSafeInteger(fim) ||
      inicio <= 0 ||
      fim < inicio ||
      fim - inicio >= 20
    ) {
      throw new BadRequestException(
        'Informe intervalo de no maximo 20 numeros de OP.',
      );
    }
  }

  private numero(valor: unknown): number | null {
    if (
      valor === null ||
      valor === undefined ||
      String(valor).trim() === ''
    ) {
      return null;
    }

    const numero = Number(String(valor).trim());

    return Number.isFinite(numero) ? numero : null;
  }

  private texto(valor: unknown): string {
    return String(valor ?? '').trim();
  }

  private lerDataset(
    resposta: RespostaSankhya,
    campos: string[],
    descricao: string,
  ): Record<string, unknown>[] {
    const body = resposta.responseBody as
      | { result?: unknown }
      | undefined;

    if (!body || !Array.isArray(body.result)) {
      throw new ServiceUnavailableException(
        `Estrutura de ${descricao} invalida.`,
      );
    }

    return body.result.map((linha: unknown) => {
      if (
        !Array.isArray(linha) ||
        linha.length !== campos.length
      ) {
        throw new ServiceUnavailableException(
          `Quantidade de campos incorreta em ${descricao}.`,
        );
      }

      return Object.fromEntries(
        campos.map((campo, indice) => [
          campo,
          linha[indice],
        ]),
      ) as Record<string, unknown>;
    });
  }

  // =====================================================
  // PRODUTOS
  // =====================================================

  private async consultarRegistrosProdutos(
    pagina: number,
    comUnidade = false,
  ) {
    this.validarPagina(pagina);

    const servico = 'CRUDServiceProvider.loadRecords';

    const corpo = {
      serviceName: servico,
      requestBody: {
        dataSet: {
          rootEntity: 'Produto',
          includePresentationFields: 'N',
          ignoreCalculatedFields: 'true',
          offsetPage: String(pagina),
          entity: {
            fieldset: {
              list: comUnidade
                ? 'CODPROD,DESCRPROD,CODVOL'
                : 'CODPROD,DESCRPROD',
            },
          },
        },
      },
    };

    const resposta = await this.consultarServico(
      servico,
      corpo,
    );

    const body = resposta.responseBody as
      | { entities?: Entidades }
      | undefined;

    if (!body?.entities) {
      throw new ServiceUnavailableException(
        'Estrutura de produtos nao encontrada.',
      );
    }

    const entidade = body.entities;

    const registros = entidade.entity
      ? Array.isArray(entidade.entity)
        ? entidade.entity
        : [entidade.entity]
      : [];

    return {
      body,
      registros,
      temMais:
        entidade.hasMoreResult === true ||
        entidade.hasMoreResult === 'true',
    };
  }

  private async consultarPaginaProdutos(pagina: number) {
    const resultado =
      await this.consultarRegistrosProdutos(pagina);

    const produtos: ProdutoBasico[] = [];
    let invalidos = 0;

    for (const item of resultado.registros) {
      const codigo =
        this.texto(item.f0?.$).toUpperCase();
      const descricao = this.texto(item.f1?.$);

      if (!codigo || !descricao) {
        invalidos++;
        continue;
      }

      produtos.push({ codigo, descricao });
    }

    return {
      produtos,
      invalidos,
      quantidadeRecebida:
        resultado.registros.length,
      hasMoreResult: resultado.temMais,
    };
  }

  async listarProdutos(pagina = 0) {
    const resultado =
      await this.consultarRegistrosProdutos(pagina);

    return {
      sucesso: true,
      origem: 'SANKHYA',
      ambiente: new URL(
        this.configuracao().gatewayUrl,
      ).hostname,
      entidade: 'Produto',
      pagina,
      campos: ['CODPROD', 'DESCRPROD'],
      dados: resultado.body,
    };
  }

  async visualizarProdutos(pagina = 0) {
    return {
      sucesso: true,
      origem: 'SANKHYA',
      pagina,
      ...(await this.consultarPaginaProdutos(pagina)),
    };
  }

  async sincronizarProdutos(
    paginaInicial = 0,
    quantidadePaginas = 1,
  ) {
    this.validarPagina(paginaInicial);

    if (
      !Number.isInteger(quantidadePaginas) ||
      quantidadePaginas < 1 ||
      quantidadePaginas > 10 ||
      paginaInicial + quantidadePaginas - 1 > 1000
    ) {
      throw new BadRequestException(
        'Informe de 1 a 10 paginas validas.',
      );
    }

    const encontrados =
      new Map<string, ProdutoBasico>();

    let totalRecebido = 0;
    let invalidos = 0;
    let paginasConsultadas = 0;
    let temMaisPaginas = false;

    for (
      let i = 0;
      i < quantidadePaginas;
      i++
    ) {
      const pagina = paginaInicial + i;
      const resultado =
        await this.consultarPaginaProdutos(pagina);

      paginasConsultadas++;
      totalRecebido += resultado.quantidadeRecebida;
      invalidos += resultado.invalidos;

      for (const produto of resultado.produtos) {
        if (!encontrados.has(produto.codigo)) {
          encontrados.set(produto.codigo, produto);
        }
      }

      temMaisPaginas = resultado.hasMoreResult;

      if (!temMaisPaginas) break;
    }

    const produtos = [...encontrados.values()];

    const existentes = await this.prisma.produto.findMany({
      where: {
        codigo: {
          in: produtos.map((p) => p.codigo),
        },
      },
      select: { codigo: true },
    });

    const codigos = new Set(
      existentes.map((p) => p.codigo),
    );

    const novos = produtos.filter(
      (p) => !codigos.has(p.codigo),
    );

    let importados = 0;

    if (novos.length > 0) {
      const resultado =
        await this.prisma.produto.createMany({
          data: novos.map((p) => ({
            codigo: p.codigo,
            descricao: p.descricao,
            unidade: 'UN',
            ativo: true,
          })),
          skipDuplicates: true,
        });

      importados = resultado.count;
    }

    return {
      sucesso: true,
      origem: 'SANKHYA',
      mensagem: 'Sincronizacao de produtos concluida.',
      paginasConsultadas,
      totalRecebido,
      validosUnicos: produtos.length,
      invalidos,
      importados,
      ignorados: produtos.length - importados,
      temMaisPaginas,
      proximaPagina: temMaisPaginas
        ? paginaInicial + paginasConsultadas
        : null,
    };
  }

  // =====================================================
  // UNIDADES DE MEDIDA
  // =====================================================

  async consultarUnidadesProdutos(pagina = 0) {
    const resultado =
      await this.consultarRegistrosProdutos(
        pagina,
        true,
      );

    const produtos = resultado.registros.map((item) => ({
      codigo: this.texto(item.f0?.$),
      descricao: this.texto(item.f1?.$),
      unidade: this.texto(item.f2?.$),
    }));

    return {
      sucesso: true,
      origem: 'SANKHYA',
      pagina,
      quantidade: produtos.length,
      temMaisPaginas: resultado.temMais,
      produtos,
    };
  }

  async visualizarDiferencasUnidades(pagina = 0) {
    const resultado =
      await this.consultarUnidadesProdutos(pagina);

    const unidades = new Map<string, string>();

    for (const p of resultado.produtos) {
      const codigo = p.codigo.toUpperCase();
      const unidade = p.unidade.toUpperCase();

      if (
        codigo &&
        unidade &&
        !unidades.has(codigo)
      ) {
        unidades.set(codigo, unidade);
      }
    }

    const locais = await this.prisma.produto.findMany({
      where: {
        codigo: {
          in: [...unidades.keys()],
        },
      },
      select: {
        codigo: true,
        descricao: true,
        unidade: true,
      },
    });

    const diferencas = locais
      .map((local) => {
        const unidadeSankhya =
          unidades.get(local.codigo);
        const unidadeAtual =
          local.unidade.trim().toUpperCase();

        if (
          !unidadeSankhya ||
          unidadeAtual === unidadeSankhya
        ) {
          return null;
        }

        return {
          codigo: local.codigo,
          descricao: local.descricao,
          unidadeAtual: local.unidade,
          unidadeSankhya,
          atualizavel: unidadeAtual === 'UN',
        };
      })
      .filter(
        (p): p is NonNullable<typeof p> =>
          p !== null,
      );

    return {
      sucesso: true,
      pagina,
      consultadosSankhya: resultado.quantidade,
      encontradosLocalmente: locais.length,
      diferentes: diferencas.length,
      atualizaveis: diferencas.filter(
        (p) => p.atualizavel,
      ).length,
      temMaisPaginas: resultado.temMaisPaginas,
      diferencas,
    };
  }

  async atualizarUnidadesProdutos(
    pagina = 0,
    confirmar = false,
  ) {
    this.validarPagina(pagina);

    if (confirmar !== true) {
      throw new BadRequestException(
        'Envie confirmar: true.',
      );
    }

    const previa =
      await this.visualizarDiferencasUnidades(pagina);

    const candidatos = previa.diferencas.filter(
      (p) => p.atualizavel,
    );

    const alterados: Array<{
      codigo: string;
      de: string;
      para: string;
    }> = [];

    let ignoradosPorAlteracaoConcorrente = 0;

    for (const p of candidatos) {
      const resultado =
        await this.prisma.produto.updateMany({
          where: {
            codigo: p.codigo,
            unidade: 'UN',
          },
          data: {
            unidade: p.unidadeSankhya,
          },
        });

      if (resultado.count === 1) {
        alterados.push({
          codigo: p.codigo,
          de: 'UN',
          para: p.unidadeSankhya,
        });
      } else {
        ignoradosPorAlteracaoConcorrente++;
      }
    }

    return {
      sucesso: true,
      origem: 'SANKHYA',
      pagina,
      consultadosSankhya: previa.consultadosSankhya,
      diferentes: previa.diferentes,
      atualizados: alterados.length,
      preservados:
        previa.diferentes - alterados.length,
      ignoradosPorAlteracaoConcorrente,
      temMaisPaginas: previa.temMaisPaginas,
      alterados,
    };
  }

  // =====================================================
  // PRODUTO ACABADO DE UMA OP
  // =====================================================

  async consultarProdutosOrdem(numeroOp: number) {
    this.validarOp(numeroOp);

    const campos = [
      'IDIPROC',
      'CODPRODPA',
      'Produto.DESCRPROD',
      'REFERENCIA',
      'CONTROLEPA',
      'QTDPRODUZIR',
      'SALDOOP',
      'NROLOTE',
      'CONCLUIDO',
      'DTVAL',
      'DTFAB',
      'QTDPRODUZIR_ORIGINAL',
      'Produto.CODVOL',
      'Produto.DECQTD',
      'Produto.TIPCONTEST',
      'Produto.TITCONTEST',
      'Produto.USALOTEDTFAB',
      'Produto.USALOTEDTVAL',
      'CabecalhoInstanciaProcesso.IDPROC',
    ];

    const servico = 'DatasetSP.loadRecords';

    const corpo = {
      serviceName: servico,
      requestBody: {
        dataSetID: '001',
        entityName: 'ProdutoAcabadoAProduzir',
        parentEntityName:
          'CabecalhoInstanciaProcesso',
        standAlone: false,
        tryJoinedFields: true,
        parallelLoader: true,
        useDefaultRowsLimit: true,
        criteria: {
          expression: '(IDIPROC = ?)',
          parameters: [
            { type: 'N', value: String(numeroOp) },
          ],
        },
        fields: campos,
      },
    };

    const resposta = await this.consultarServico(
      servico,
      corpo,
    );

    const registros = this.lerDataset(
      resposta,
      campos,
      'produtos acabados',
    );

    const produtos = registros.map((r) => {
      const id = this.numero(r.IDIPROC);

      if (id !== numeroOp) {
        throw new ServiceUnavailableException(
          'Produto retornado pertence a outra OP.',
        );
      }

      return {
        numeroOp: id,
        codigoProduto: this.texto(r.CODPRODPA),
        descricaoProduto:
          this.texto(r['Produto.DESCRPROD']),
        quantidadePlanejada:
          this.numero(r.QTDPRODUZIR),
        saldoAProduzir: this.numero(r.SALDOOP),
        lote: this.texto(r.NROLOTE),
        unidade: this.texto(r['Produto.CODVOL']),
        concluido: this.texto(r.CONCLUIDO),
        codigoProcesso: this.texto(
          r['CabecalhoInstanciaProcesso.IDPROC'],
        ),
      };
    });

    return {
      sucesso: true,
      origem: 'SANKHYA',
      somenteLeitura: true,
      numeroOp,
      total: produtos.length,
      produtos,
      observacao:
        'Apontamentos historicos ainda nao integrados.',
    };
  }

  // =====================================================
  // CABECALHO DE UMA OP
  // =====================================================

  async consultarCabecalhoOrdem(numeroOp: number) {
    this.validarOp(numeroOp);

    const campos = [
      'IDIPROC',
      'PERIODOMPS',
      'DECQTD',
      'NROLOTE',
      'QTDPRODUZIR',
      'SALDOOP',
      'STATUSPROC',
      'CODPRODPA',
      'REFERENCIA',
      'DESCRPRODPA',
      'CONTROLEPA',
      'COMPLDESCPA',
      'DHINC',
      'DHINST',
      'DHTERMINO',
      'DESCRICAO',
      'CODPARCTERC',
      'Parceiro.NOMEPARC',
      'DTPREVENT',
      'TEMPOATRAVESS',
      'DTINICIOMAX',
      'NUNOTA',
      'CODUSUFINAL',
      'Usuario.NOMEUSU',
      'CODEXEC',
      'NUMPS',
      'SEQNOTA',
      'NOMEEXEC',
      'NOMERPA',
      'IDICOP',
      'QTDRPA',
      'PRIORIDADE',
      'IDPROC',
      'ProcessoProdutivo.DESCRABREV',
      'MULTIPRODUTO',
      'CODPLP',
      'PlantaManufatura.NOME',
      'CODPARC',
      'Parceiro2.NOMEPARC',
      'IDWFLOW',
      'CODUSUINC',
      'Usuario2.NOMEUSU',
      'IDIPROCPAI',
      'CODGRUPOPRODPA',
      'AD_CONTROLEJM',
      'AD_ORDCARGA',
      'AD_CODLOCALDEST',
      'LocalEstoque_AD001.DESCRLOCAL',
      'ProcessoProdutivo.CODPRC',
      'ProcessoProdutivo.TIPOPROC',
      'ProcessoProdutivo.DESCRABREV',
      'ProcessoProdutivo.VERSAO',
      'ProcessoProdutivo.CODPLP',
      'ProcessoProdutivo.TIPONROLOTE',
      'ProcessoProdutivo.PRODPARATERCEIRO',
      'ProcessoProdutivo.PROCDESMONTE',
      'ProcessoProdutivo.USATERCEIRO',
      'ProcessoProdutivo.DEFTERCEIRO',
      'ProcessoProdutivo.TIPEXECATV',
      'TOTALTEMPPREVISTO',
      'TOTALTEMPREALIZADO',
    ];

    const servico = 'DatasetSP.loadRecords';

    const corpo = {
      serviceName: servico,
      requestBody: {
        dataSetID: '00G',
        entityName: 'CabecalhoInstanciaProcesso',
        standAlone: false,
        tryJoinedFields: true,
        parallelLoader: true,
        useDefaultRowsLimit: true,
        criteria: {
          expression: '(this.IDIPROC = ?)',
          parameters: [
            { type: 'N', value: numeroOp },
          ],
        },
        fields: campos,
        standAloneFieldsMD: {
          TOTALTEMPPREVISTO: {
            fieldType: 'S',
            userType: 'S',
          },
          TOTALTEMPREALIZADO: {
            fieldType: 'S',
            userType: 'S',
          },
        },
      },
    };

    const resposta = await this.consultarServico(
      servico,
      corpo,
    );

    const registros = this.lerDataset(
      resposta,
      campos,
      'cabecalho',
    );

    const ordens = registros.map((r) => {
      const id = this.numero(r.IDIPROC);

      if (id !== numeroOp) {
        throw new ServiceUnavailableException(
          'Cabecalho retornado pertence a outra OP.',
        );
      }

      return {
        numeroOp: id,
        statusCodigo: this.texto(r.STATUSPROC),
        codigoProduto: this.texto(r.CODPRODPA),
        descricaoProduto: this.texto(r.DESCRPRODPA),
        quantidadePlanejada:
          this.numero(r.QTDPRODUZIR),
        saldoAProduzir: this.numero(r.SALDOOP),
        lote: this.texto(r.NROLOTE),
        processoId: this.texto(r.IDPROC),
        processoDescricao: this.texto(
          r['ProcessoProdutivo.DESCRABREV'],
        ),
        plantaCodigo: this.texto(r.CODPLP),
        plantaDescricao: this.texto(
          r['PlantaManufatura.NOME'],
        ),
        dataInclusao: this.texto(r.DHINC),
        dataInicializacao: this.texto(r.DHINST),
        dataFinalizacao: this.texto(r.DHTERMINO),
        prioridade: this.texto(r.PRIORIDADE),
        tempoTotalPrevisto:
          this.texto(r.TOTALTEMPPREVISTO),
        tempoTotalRealizado:
          this.texto(r.TOTALTEMPREALIZADO),
      };
    });

    return {
      sucesso: true,
      origem: 'SANKHYA',
      somenteLeitura: true,
      numeroOp,
      total: ordens.length,
      ordens,
      observacao:
        'STATUSPROC preserva o codigo do ERP.',
    };
  }

  // =====================================================
  // PREVIA DE UMA OP
  // =====================================================

  async visualizarOrdem(numeroOp: number) {
    this.validarOp(numeroOp);

    const [cabecalho, produtos] =
      await Promise.all([
        this.consultarCabecalhoOrdem(numeroOp),
        this.consultarProdutosOrdem(numeroOp),
      ]);

    const registro = cabecalho.ordens[0] ?? null;
    const item = produtos.produtos[0] ?? null;

    const codigo =
      item?.codigoProduto ||
      registro?.codigoProduto ||
      '';

    const produtoLocal = codigo
      ? await this.prisma.produto.findUnique({
          where: { codigo },
          select: {
            id: true,
            codigo: true,
            descricao: true,
            unidade: true,
            ativo: true,
          },
        })
      : null;

    const prontoParaImportar =
      cabecalho.ordens.length === 1 &&
      produtos.produtos.length === 1 &&
      !!item?.codigoProduto &&
      !!produtoLocal?.ativo &&
      item?.codigoProduto ===
        produtoLocal?.codigo;

    return {
      sucesso: true,
      origem: 'SANKHYA',
      somenteLeitura: true,
      numeroOp,
      cabecalho: registro,
      produtos: produtos.produtos,
      produtoLocal,
      prontoParaImportar,
      observacao:
        'Previa sem gravacao. Status e quantidades devem ser validados.',
    };
  }

  // =====================================================
  // IMPORTACAO INDIVIDUAL DE OP
  // =====================================================

  async importarOrdem(
    numeroOp: number,
    confirmar = false,
  ) {
    this.validarOp(numeroOp);

    if (confirmar !== true) {
      throw new BadRequestException(
        'Envie confirmar: true para importar.',
      );
    }

    const numero = String(numeroOp);

    const existente =
      await this.prisma.ordemProducao.findUnique({
        where: { numero },
        select: { id: true },
      });

    if (existente) {
      return {
        sucesso: true,
        origem: 'SANKHYA',
        importada: false,
        jaExistia: true,
        numeroOp,
        mensagem:
          'OP ja cadastrada. Nenhum dado alterado.',
      };
    }

    const previa =
      await this.visualizarOrdem(numeroOp);

    const cabecalho = previa.cabecalho;
    const item = previa.produtos[0];
    const produto = previa.produtoLocal;

    if (
      !previa.prontoParaImportar ||
      !cabecalho ||
      !item ||
      !produto?.ativo
    ) {
      throw new BadRequestException(
        'OP nao atende aos requisitos de importacao.',
      );
    }

    if (
      cabecalho.numeroOp !== numeroOp ||
      item.numeroOp !== numeroOp ||
      item.codigoProduto !== produto.codigo
    ) {
      throw new BadRequestException(
        'Dados da OP ou produto inconsistentes.',
      );
    }

    // Por enquanto, so status A foi validado.
    if (cabecalho.statusCodigo !== 'A') {
      throw new BadRequestException(
        'Status da OP ainda nao autorizado para importacao.',
      );
    }

    const quantidade = item.quantidadePlanejada;
    const saldo = item.saldoAProduzir;

    if (
      quantidade === null ||
      !Number.isSafeInteger(quantidade) ||
      quantidade <= 0 ||
      saldo === null ||
      !Number.isFinite(saldo) ||
      saldo < 0 ||
      saldo > quantidade
    ) {
      throw new BadRequestException(
        'Quantidade ou saldo invalido.',
      );
    }

    if (
      cabecalho.lote &&
      item.lote &&
      cabecalho.lote !== item.lote
    ) {
      throw new BadRequestException(
        'Lote divergente entre cabecalho e produto.',
      );
    }

    const observacoes = [
      'Importada do Sankhya Sandbox.',
      `Lote: ${item.lote || 'nao informado'}.`,
      `Saldo Sankhya: ${saldo} ${item.unidade}.`,
      `Status original: ${cabecalho.statusCodigo}.`,
      'Quantidade produzida local iniciada em 0.',
      'Apontamentos historicos nao conciliados.',
    ].join(' ');

    try {
      const ordem =
        await this.prisma.ordemProducao.create({
          data: {
            numero,
            produtoId: produto.id,
            quantidadePlanejada: quantidade,
            quantidadeProduzida: 0,
            situacao: 'EM_PRODUCAO',
            observacoes,
          },
          include: {
            produto: {
              select: {
                id: true,
                codigo: true,
                descricao: true,
                cor: true,
                acabamento: true,
                unidade: true,
              },
            },
          },
        });

      return {
        sucesso: true,
        origem: 'SANKHYA',
        importada: true,
        jaExistia: false,
        numeroOp,
        ordem,
        aviso:
          'Quantidade produzida local ainda nao representa a producao historica do Sankhya.',
      };
    } catch (erro: unknown) {
      if (
        erro &&
        typeof erro === 'object' &&
        'code' in erro &&
        erro.code === 'P2002'
      ) {
        return {
          sucesso: true,
          origem: 'SANKHYA',
          importada: false,
          jaExistia: true,
          numeroOp,
          mensagem:
            'OP ja cadastrada. Nenhuma alteracao.',
        };
      }

      throw erro;
    }
  }

  // =====================================================
  // LISTAGEM DE OPS POR INTERVALO
  // =====================================================

  async listarOrdensSankhya(
    inicio = 42880,
    fim = 42899,
  ) {
    this.validarIntervalo(inicio, fim);

    const servico = 'DatasetSP.loadRecords';

    const campos = [
      'IDIPROC',
      'STATUSPROC',
      'NROLOTE',
      'DHINC',
      'IDPROC',
    ];

    const corpo = {
      serviceName: servico,
      requestBody: {
        dataSetID: '00G',
        entityName: 'CabecalhoInstanciaProcesso',
        standAlone: false,
        tryJoinedFields: true,
        parallelLoader: true,
        useDefaultRowsLimit: true,
        criteria: {
          expression:
            '(this.IDIPROC >= ? AND this.IDIPROC <= ?)',
          parameters: [
            { type: 'N', value: inicio },
            { type: 'N', value: fim },
          ],
        },
        fields: campos,
      },
    };

    const resposta = await this.consultarServico(
      servico,
      corpo,
    );

    const registros = this.lerDataset(
      resposta,
      campos,
      'listagem de OPs',
    );

    const ordens = registros.map((r) => ({
      numeroOp: this.numero(r.IDIPROC),
      statusCodigo: this.texto(r.STATUSPROC),
      lote: this.texto(r.NROLOTE),
      dataInclusao: this.texto(r.DHINC),
      processoId: this.texto(r.IDPROC),
    }));

    if (
      ordens.some(
        (op) =>
          op.numeroOp === null ||
          op.numeroOp < inicio ||
          op.numeroOp > fim,
      )
    ) {
      throw new ServiceUnavailableException(
        'Sankhya retornou OP fora do intervalo.',
      );
    }

    ordens.sort(
      (a, b) =>
        (b.numeroOp ?? 0) - (a.numeroOp ?? 0),
    );

    return {
      sucesso: true,
      origem: 'SANKHYA',
      somenteLeitura: true,
      intervalo: { inicio, fim },
      total: ordens.length,
      ordens,
      observacao:
        'Consulta por intervalo de ate 20 numeros.',
    };
  }

  // =====================================================
  // PREVIA DE IMPORTACAO EM LOTE
  // =====================================================

  async visualizarImportacaoLote(
    inicio = 42880,
    fim = 42899,
  ) {
    const lista =
      await this.listarOrdensSankhya(inicio, fim);

    const numeros = lista.ordens
      .map((op) => op.numeroOp)
      .filter((n): n is number => n !== null);

    const existentes =
      await this.prisma.ordemProducao.findMany({
        where: {
          numero: {
            in: numeros.map(String),
          },
        },
        select: { numero: true },
      });

    const jaExistem = new Set(
      existentes.map((op) => op.numero),
    );

    const resultados: Array<{
      numeroOp: number;
      classificacao: Classificacao;
      jaCadastrada: boolean;
      motivos: string[];
      codigoProduto?: string;
      quantidadePlanejada?: number | null;
      statusCodigo?: string;
    }> = [];

    // Sequencial para evitar excesso de chamadas.
    for (const numeroOp of numeros) {
      const jaCadastrada =
        jaExistem.has(String(numeroOp));

      if (jaCadastrada) {
        resultados.push({
          numeroOp,
          classificacao: 'IGNORAR',
          jaCadastrada: true,
          motivos: ['OP ja cadastrada no PostgreSQL.'],
        });
        continue;
      }

      try {
        const previa =
          await this.visualizarOrdem(numeroOp);

        const cabecalho = previa.cabecalho;
        const item = previa.produtos[0];
        const produto = previa.produtoLocal;

        const motivos: string[] = [];

        if (!cabecalho) {
          motivos.push('Cabecalho nao encontrado.');
        } else {
          if (cabecalho.numeroOp !== numeroOp) {
            motivos.push('Numero da OP inconsistente.');
          }

          if (cabecalho.statusCodigo !== 'A') {
            motivos.push(
              `Status ${cabecalho.statusCodigo} nao mapeado para importacao.`,
            );
          }
        }

        if (previa.produtos.length !== 1) {
          motivos.push(
            'OP sem produto unico ou com varios produtos acabados.',
          );
        }

        if (!item?.codigoProduto) {
          motivos.push('Codigo do produto ausente.');
        }

        if (!produto?.ativo) {
          motivos.push(
            'Produto nao cadastrado ou inativo no PRODSYNC.',
          );
        }

        if (
          item &&
          produto &&
          item.codigoProduto !== produto.codigo
        ) {
          motivos.push('Produto divergente.');
        }

        const qtd = item?.quantidadePlanejada;
        const saldo = item?.saldoAProduzir;

        if (
          qtd == null ||
          !Number.isSafeInteger(qtd) ||
          qtd <= 0
        ) {
          motivos.push('Quantidade planejada invalida.');
        }

        if (
          saldo == null ||
          !Number.isFinite(saldo) ||
          saldo < 0 ||
          qtd == null ||
          saldo > qtd
        ) {
          motivos.push('Saldo invalido.');
        }

        if (
          cabecalho?.lote &&
          item?.lote &&
          cabecalho.lote !== item.lote
        ) {
          motivos.push('Lote divergente.');
        }

        resultados.push({
          numeroOp,
          classificacao:
            motivos.length === 0
              ? 'IMPORTAR'
              : 'IGNORAR',
          jaCadastrada: false,
          motivos,
          codigoProduto: item?.codigoProduto,
          quantidadePlanejada:
            item?.quantidadePlanejada,
          statusCodigo: cabecalho?.statusCodigo,
        });
      } catch {
        resultados.push({
          numeroOp,
          classificacao: 'FALHA',
          jaCadastrada: false,
          motivos: [
            'Falha ao consultar detalhes da OP.',
          ],
        });
      }
    }

    return {
      sucesso: true,
      origem: 'SANKHYA',
      somenteLeitura: true,
      intervalo: { inicio, fim },
      total: resultados.length,
      importar: resultados.filter(
        (r) => r.classificacao === 'IMPORTAR',
      ).length,
      ignorar: resultados.filter(
        (r) => r.classificacao === 'IGNORAR',
      ).length,
      falhas: resultados.filter(
        (r) => r.classificacao === 'FALHA',
      ).length,
      ordens: resultados,
    };
  }

  // =====================================================
  // IMPORTACAO CONTROLADA EM LOTE
  // =====================================================

  async importarLote(
    inicio = 42880,
    fim = 42899,
    confirmar = false,
  ) {
    if (confirmar !== true) {
      throw new BadRequestException(
        'Envie confirmar: true para importar.',
      );
    }

    const previa =
      await this.visualizarImportacaoLote(inicio, fim);

    const importadas: number[] = [];
    const ignoradas: Array<{
      numeroOp: number;
      motivos: string[];
    }> = [];
    const falhas: Array<{
      numeroOp: number;
      motivo: string;
    }> = [];

    for (const op of previa.ordens) {
      if (op.classificacao !== 'IMPORTAR') {
        if (op.classificacao === 'FALHA') {
          falhas.push({
            numeroOp: op.numeroOp,
            motivo: op.motivos[0],
          });
        } else {
          ignoradas.push({
            numeroOp: op.numeroOp,
            motivos: op.motivos,
          });
        }
        continue;
      }

      try {
        const resultado =
          await this.importarOrdem(
            op.numeroOp,
            true,
          );

        if (resultado.importada) {
          importadas.push(op.numeroOp);
        } else {
          ignoradas.push({
            numeroOp: op.numeroOp,
            motivos: ['OP ja cadastrada.'],
          });
        }
      } catch {
        falhas.push({
          numeroOp: op.numeroOp,
          motivo:
            'Falha na importacao individual da OP.',
        });
      }
    }

    return {
      sucesso: falhas.length === 0,
      origem: 'SANKHYA',
      somenteLeituraSankhya: true,
      intervalo: { inicio, fim },
      importadas,
      ignoradas,
      falhas,
      resumo: {
        importadas: importadas.length,
        ignoradas: ignoradas.length,
        falhas: falhas.length,
      },
      observacao:
        'Nenhuma escrita enviada ao Sankhya.',
    };
  }

  // =====================================================
  // VARREDURA DE MULTIPLOS INTERVALOS
  // NOVA FUNCIONALIDADE - SOMENTE LEITURA
  // =====================================================

  async varrerOrdensSankhya(
    inicio: number,
    fim: number,
    maxBlocos = 10,
  ) {
    if (
      !Number.isSafeInteger(inicio) ||
      !Number.isSafeInteger(fim) ||
      inicio <= 0 ||
      fim < inicio
    ) {
      throw new BadRequestException(
        'Informe inicio e fim validos.',
      );
    }

    if (
      !Number.isInteger(maxBlocos) ||
      maxBlocos < 1 ||
      maxBlocos > 10
    ) {
      throw new BadRequestException(
        'maxBlocos deve estar entre 1 e 10.',
      );
    }

    const encontradas = new Map<
      number,
      {
        numeroOp: number;
        statusCodigo: string;
        lote: string;
        dataInclusao: string;
        processoId: string;
      }
    >();

    let cursor = inicio;
    let blocosConsultados = 0;
    const avisos: string[] = [];

    while (
      cursor <= fim &&
      blocosConsultados < maxBlocos
    ) {
      const fimBloco = Math.min(
        cursor + 19,
        fim,
      );

      const resultado =
        await this.listarOrdensSankhya(
          cursor,
          fimBloco,
        );

      for (const op of resultado.ordens) {
        if (op.numeroOp !== null) {
          encontradas.set(op.numeroOp, {
            numeroOp: op.numeroOp,
            statusCodigo: op.statusCodigo,
            lote: op.lote,
            dataInclusao: op.dataInclusao,
            processoId: op.processoId,
          });
        }
      }

      // Quando o limite de resultados for atingido,
      // nao podemos garantir que a consulta veio completa.
      if (resultado.total >= 20) {
        avisos.push(
          `Intervalo ${cursor}-${fimBloco}: verificar limite de resultados do DatasetSP.`,
        );
      }

      blocosConsultados++;
      cursor = fimBloco + 1;
    }

    const ordens = [...encontradas.values()].sort(
      (a, b) => b.numeroOp - a.numeroOp,
    );

    return {
      sucesso: true,
      origem: 'SANKHYA',
      somenteLeitura: true,
      intervaloSolicitado: { inicio, fim },
      blocosConsultados,
      totalEncontrado: ordens.length,
      varreduraConcluida: cursor > fim,
      proximoInicio:
        cursor <= fim ? cursor : null,
      ordens,
      avisos,
      observacao:
        'Consulta incremental por blocos de 20 IDs. Nao garante historico completo ate validar os limites do Gateway.',
    };
  }
}
