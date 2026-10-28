
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:3000/api";

// ==========================================
// PERFIS E USUÁRIOS
// ==========================================

export type Perfil =
  | "ADMIN"
  | "SUPERVISOR"
  | "OPERADOR";

export type Usuario = {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
  ativo?: boolean;
  criadoEm?: string;
};

export type LoginResponse = {
  accessToken: string;
  tokenType: string;
  usuario: Usuario;
};

export type CreateUserData = {
  nome: string;
  email: string;
  senha: string;
  perfil: Perfil;
};

// ==========================================
// PRODUTOS
// ==========================================

export type Produto = {
  id: string;
  codigo: string;
  descricao: string;
  cor: string | null;
  acabamento: string | null;
  larguraMm: number | null;
  espessuraMm: number | null;
  unidade: string;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
};

// Mantém compatibilidade com a tela de OPs
export type ProdutoERP = Produto;

export type CriarProduto = {
  codigo: string;
  descricao: string;
  cor?: string;
  acabamento?: string;
  larguraMm?: number;
  espessuraMm?: number;
  unidade?: string;
};

// ==========================================
// ORDENS DE PRODUÇÃO
// ==========================================

export type SituacaoOP =
  | "PENDENTE"
  | "EM_PRODUCAO"
  | "PAUSADA"
  | "FINALIZADA"
  | "CANCELADA";

export type OrdemProducao = {
  id: string;
  numero: string;
  produtoId: string;
  produto: ProdutoERP;
  quantidadePlanejada: number;
  quantidadeProduzida: number;
  situacao: SituacaoOP;
  observacoes: string | null;
  dataPrevisao?: string | null;
  iniciadaEm?: string | null;
  finalizadaEm?: string | null;
  criadoEm: string;
  atualizadoEm: string;
};

export type CriarOrdemData = {
  numero: string;
  produtoId: string;
  quantidadePlanejada: number;
  observacoes?: string;
};

// ==========================================
// TRATAMENTO DE ERROS
// ==========================================

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);

    this.name = "ApiError";
    this.status = status;

    Object.setPrototypeOf(
      this,
      ApiError.prototype
    );
  }
}

// ==========================================
// FUNÇÃO CENTRAL DE REQUISIÇÕES
// ==========================================

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(
      `${API_BASE_URL}${path}`,
      {
        ...options,
        headers: {
          "Content-Type": "application/json",

          ...(token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {}),

          ...options.headers,
        },
      }
    );
  } catch {
    throw new ApiError(
      "Não foi possível conectar à API. Verifique se o servidor NestJS está executando na porta 3000.",
      0
    );
  }

  // Verifica erros HTTP
  if (!response.ok) {
    const payload: unknown = await response
      .json()
      .catch(() => null);

    const data =
      payload && typeof payload === "object"
        ? (payload as Record<string, unknown>)
        : {};

    const raw = data.message;

    const message = Array.isArray(raw)
      ? raw.join(" • ")
      : typeof raw === "string"
        ? raw
        : `Falha na requisição (${response.status}).`;

    throw new ApiError(
      message,
      response.status
    );
  }

  return response.json() as Promise<T>;
}

// ==========================================
// API PRINCIPAL DO PRODSYNC
// ==========================================

export const api = {
  // ---------------------------------------
  // LOGIN
  // ---------------------------------------

  login(email: string, senha: string) {
    return request<LoginResponse>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          senha,
        }),
      }
    );
  },

  // ---------------------------------------
  // USUÁRIOS
  // ---------------------------------------

  listarUsuarios(token: string) {
    return request<Usuario[]>(
      "/usuarios",
      {
        method: "GET",
      },
      token
    );
  },

  criarUsuario(
    token: string,
    dados: CreateUserData
  ) {
    return request<Usuario>(
      "/usuarios",
      {
        method: "POST",
        body: JSON.stringify({
          nome: dados.nome.trim(),
          email: dados.email.trim().toLowerCase(),
          senha: dados.senha,
          perfil: dados.perfil,
        }),
      },
      token
    );
  },

  // ---------------------------------------
  // PRODUTOS
  // ---------------------------------------

  listarProdutos(token: string) {
    return request<Produto[]>(
      "/produtos",
      {
        method: "GET",
      },
      token
    );
  },

  criarProduto(
    token: string,
    dados: CriarProduto
  ) {
    return request<Produto>(
      "/produtos",
      {
        method: "POST",
        body: JSON.stringify(dados),
      },
      token
    );
  },

  // ---------------------------------------
  // ORDENS DE PRODUÇÃO
  // ---------------------------------------

  listarOrdens(token: string) {
    return request<OrdemProducao[]>(
      "/ordens-producao",
      {
        method: "GET",
      },
      token
    );
  },

  buscarOrdem(
    token: string,
    numero: string
  ) {
    return request<OrdemProducao>(
      `/ordens-producao/${encodeURIComponent(numero)}`,
      {
        method: "GET",
      },
      token
    );
  },

  criarOrdem(
    token: string,
    dados: CriarOrdemData
  ) {
    return request<OrdemProducao>(
      "/ordens-producao",
      {
        method: "POST",
        body: JSON.stringify({
          numero: dados.numero.trim().toUpperCase(),
          produtoId: dados.produtoId,
          quantidadePlanejada:
            dados.quantidadePlanejada,
          observacoes: dados.observacoes,
        }),
      },
      token
    );
  },
};

// ==========================================
// COMPATIBILIDADE COM A TELA DE PRODUTOS
// ==========================================

// Mantém o objeto produtosApi que a tela
// Produtos.tsx já utiliza.

export const produtosApi = {
  listar(token: string) {
    return api.listarProdutos(token);
  },

  criar(
    token: string,
    dados: CriarProduto
  ) {
    return api.criarProduto(token, dados);
  },
};
