import * as SecureStore from "expo-secure-store";

const API_URL = (
  process.env.EXPO_PUBLIC_API_URL ?? ""
).replace(/\/+$/, "");

const TOKEN_KEY = "prodsync_access_token";

export type SituacaoOP =
  | "PENDENTE"
  | "EM_PRODUCAO"
  | "PAUSADA"
  | "FINALIZADA"
  | "CANCELADA";

export type ProdutoOP = {
  id: string;
  codigo: string;
  descricao: string;
  cor: string | null;
  acabamento: string | null;
  unidade: string;
};

export type OrdemProducao = {
  id: string;
  numero: string;
  produtoId: string;
  produto: ProdutoOP;
  quantidadePlanejada: number;
  quantidadeProduzida: number;
  situacao: SituacaoOP;
  observacoes: string | null;
  criadoEm: string;
};

export class ErroAPI extends Error {
  readonly status: number;

  constructor(mensagem: string, status: number) {
    super(mensagem);
    this.name = "ErroAPI";
    this.status = status;
  }
}

async function requisicao<T>(
  caminho: string
): Promise<T> {
  if (!API_URL) {
    throw new ErroAPI(
      "Configure EXPO_PUBLIC_API_URL no .env.",
      0
    );
  }

  const token = await SecureStore.getItemAsync(
    TOKEN_KEY
  );

  if (!token) {
    throw new ErroAPI(
      "Sessão não encontrada. Faça login novamente.",
      401
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    15000
  );

  try {
    const resposta = await fetch(
      `${API_URL}${caminho}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        signal: controller.signal,
      }
    );

    if (resposta.status === 401) {
      throw new ErroAPI(
        "Sua sessão expirou. Faça login novamente.",
        401
      );
    }

    if (resposta.status === 403) {
      throw new ErroAPI(
        "Você não tem permissão para consultar as OPs.",
        403
      );
    }

    if (!resposta.ok) {
      throw new ErroAPI(
        `Erro ao consultar o ERP (${resposta.status}).`,
        resposta.status
      );
    }

    return (await resposta.json()) as T;
  } catch (erro) {
    if (erro instanceof ErroAPI) {
      throw erro;
    }

    if (
      erro instanceof Error &&
      erro.name === "AbortError"
    ) {
      throw new ErroAPI(
        "O servidor demorou para responder.",
        0
      );
    }

    throw new ErroAPI(
      "Não foi possível conectar ao ERP. Verifique a rede e o backend.",
      0
    );
  } finally {
    clearTimeout(timeout);
  }
}

export const ordensProducaoApi = {
  listar() {
    return requisicao<OrdemProducao[]>(
      "/ordens-producao"
    );
  },

  buscar(numero: string) {
    return requisicao<OrdemProducao>(
      `/ordens-producao/${encodeURIComponent(numero)}`
    );
  },
};
