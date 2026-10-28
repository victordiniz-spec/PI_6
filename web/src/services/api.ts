
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

// ============================================
// TIPOS DO PRODSYNC ERP
// ============================================

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

// ============================================
// TRATAMENTO DE ERROS DA API
// ============================================

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

// ============================================
// FUNÇÃO CENTRAL DE REQUISIÇÕES
// ============================================

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

  // ============================================
  // VERIFICAÇÃO DE ERROS HTTP
  // ============================================

  if (!response.ok) {
    const payload: unknown = await response
      .json()
      .catch(() => null);

    const data =
      payload &&
      typeof payload === "object"
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

  // ============================================
  // RETORNO DA RESPOSTA
  // ============================================

  return response.json() as Promise<T>;
}

// ============================================
// SERVIÇOS DA API PRODSYNC ERP
// ============================================

export const api = {
  // ------------------------------------------
  // AUTENTICAÇÃO
  // ------------------------------------------

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

  // ------------------------------------------
  // LISTAGEM DE USUÁRIOS
  // ------------------------------------------

  listarUsuarios(token: string) {
    return request<Usuario[]>(
      "/usuarios",
      {
        method: "GET",
      },
      token
    );
  },

  // ------------------------------------------
  // CADASTRO DE USUÁRIOS
  // ------------------------------------------

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
};
