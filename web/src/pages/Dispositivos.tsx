
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  RefreshCw,
  ShieldBan,
  ShieldCheck,
  TabletSmartphone,
} from "lucide-react";

import "./Dispositivos.css";

const API_BASE = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000/api"
).replace(/\/+$/, "");

type SituacaoTablet =
  | "PENDENTE"
  | "AUTORIZADO"
  | "BLOQUEADO";

type SituacaoMaquina =
  | "ATIVA"
  | "MANUTENCAO"
  | "INATIVA";

type Maquina = {
  id: string;
  codigo: string;
  nome: string;
  situacao: SituacaoMaquina;
};

type Dispositivo = {
  id: string;
  identificador: string;
  nome: string | null;
  situacao: SituacaoTablet;
  maquinaId: string | null;
  criadoEm: string;
  autorizadoEm: string | null;
  maquina: Maquina | null;
};

type Props = {
  token: string;
  onSessaoExpirada: () => void;
};

const SITUACOES: Record<SituacaoTablet, string> = {
  PENDENTE: "Aguardando autorização",
  AUTORIZADO: "Autorizado",
  BLOQUEADO: "Bloqueado",
};

function mensagemDaApi(dados: unknown): string | null {
  if (
    !dados ||
    typeof dados !== "object" ||
    !("message" in dados)
  ) {
    return null;
  }

  const mensagem = (
    dados as { message: unknown }
  ).message;

  if (typeof mensagem === "string") {
    return mensagem;
  }

  if (Array.isArray(mensagem)) {
    return mensagem
      .filter((valor) => typeof valor === "string")
      .join(". ");
  }

  return null;
}

export default function Dispositivos({
  token,
  onSessaoExpirada,
}: Props) {
  const [dispositivos, setDispositivos] =
    useState<Dispositivo[]>([]);

  const [maquinas, setMaquinas] =
    useState<Maquina[]>([]);

  const [carregando, setCarregando] =
    useState(true);

  const [salvando, setSalvando] =
    useState(false);

  const [erro, setErro] =
    useState("");

  const [sucesso, setSucesso] =
    useState("");

  const [selecionado, setSelecionado] =
    useState<Dispositivo | null>(null);

  const [maquinaId, setMaquinaId] =
    useState("");

  const [nome, setNome] =
    useState("");

  const [filtro, setFiltro] = useState<
    "TODOS" | SituacaoTablet
  >("TODOS");

  // ======================================
  // REQUISIÇÕES COM TOKEN JWT
  // ======================================

  const api = useCallback(
    async <T,>(
      rota: string,
      method = "GET",
      body?: unknown,
    ): Promise<T> => {
      let response: Response;

      try {
        response = await fetch(
          `${API_BASE}${rota}`,
          {
            method,
            headers: {
              Authorization: `Bearer ${token}`,
              ...(body === undefined
                ? {}
                : {
                    "Content-Type":
                      "application/json",
                  }),
            },
            ...(body === undefined
              ? {}
              : {
                  body: JSON.stringify(body),
                }),
          },
        );
      } catch {
        throw new Error(
          "Não foi possível conectar à API. Confira se o NestJS está ligado na porta 3000.",
        );
      }

      if (response.status === 401) {
        onSessaoExpirada();
        throw new Error(
          "Sessão expirada. Faça login novamente.",
        );
      }

      if (response.status === 403) {
        throw new Error(
          "Seu usuário não possui permissão para esta operação.",
        );
      }

      const dados: unknown = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          mensagemDaApi(dados) ||
            `Falha na API (HTTP ${response.status}).`,
        );
      }

      return dados as T;
    },
    [token, onSessaoExpirada],
  );

  // ======================================
  // CARREGAR DADOS REAIS
  // ======================================

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");

    try {
      const [listaDispositivos, listaMaquinas] =
        await Promise.all([
          api<Dispositivo[]>("/tablets"),
          api<Maquina[]>("/maquinas"),
        ]);

      if (
        !Array.isArray(listaDispositivos) ||
        !Array.isArray(listaMaquinas)
      ) {
        throw new Error(
          "O servidor retornou dados inválidos.",
        );
      }

      setDispositivos(listaDispositivos);
      setMaquinas(listaMaquinas);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os dispositivos.",
      );
    } finally {
      setCarregando(false);
    }
  }, [api]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  // ======================================
  // RESUMO
  // ======================================

  const resumo = useMemo(
    () => ({
      total: dispositivos.length,
      pendentes: dispositivos.filter(
        (item) => item.situacao === "PENDENTE",
      ).length,
      autorizados: dispositivos.filter(
        (item) => item.situacao === "AUTORIZADO",
      ).length,
      bloqueados: dispositivos.filter(
        (item) => item.situacao === "BLOQUEADO",
      ).length,
    }),
    [dispositivos],
  );

  const listagem = useMemo(
    () =>
      filtro === "TODOS"
        ? dispositivos
        : dispositivos.filter(
            (item) => item.situacao === filtro,
          ),
    [dispositivos, filtro],
  );

  const maquinasAtivas = maquinas.filter(
    (item) => item.situacao === "ATIVA",
  );

  // ======================================
  // MODAL DE AUTORIZAÇÃO
  // ======================================

  function abrirAutorizacao(item: Dispositivo) {
    setSelecionado(item);
    setNome(item.nome ?? "");
    setMaquinaId(item.maquinaId ?? "");
    setErro("");
    setSucesso("");
  }

  function fecharAutorizacao() {
    if (salvando) return;
    setSelecionado(null);
    setMaquinaId("");
    setNome("");
  }

  // ======================================
  // AUTORIZAR
  // ======================================

  async function autorizar() {
    if (!selecionado || salvando) return;

    if (!maquinaId) {
      setErro("Selecione uma máquina ativa.");
      return;
    }

    if (nome.trim().length > 100) {
      setErro(
        "O nome deve ter no máximo 100 caracteres.",
      );
      return;
    }

    const confirmado = window.confirm(
      `Autorizar este dispositivo para a máquina selecionada?`,
    );

    if (!confirmado) return;

    setSalvando(true);
    setErro("");
    setSucesso("");

    try {
      await api(
        `/tablets/${selecionado.id}/autorizar`,
        "PATCH",
        {
          maquinaId,
          ...(nome.trim()
            ? { nome: nome.trim() }
            : {}),
        },
      );

      setSelecionado(null);
      setMaquinaId("");
      setNome("");

      await carregar();

      setSucesso(
        "Dispositivo autorizado e vinculado à máquina.",
      );
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Falha ao autorizar dispositivo.",
      );
    } finally {
      setSalvando(false);
    }
  }

  // ======================================
  // BLOQUEAR
  // ======================================

  async function bloquear(item: Dispositivo) {
    if (salvando) return;

    const confirmou = window.confirm(
      `Deseja bloquear o dispositivo ${
        item.nome || item.identificador
      }?`,
    );

    if (!confirmou) return;

    setSalvando(true);
    setErro("");
    setSucesso("");

    try {
      await api(
        `/tablets/${item.id}/bloquear`,
        "PATCH",
      );

      await carregar();

      setSucesso(
        "Dispositivo bloqueado no cadastro.",
      );
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível bloquear.",
      );
    } finally {
      setSalvando(false);
    }
  }

  // ======================================
  // INTERFACE
  // ======================================

  return (
    <section className="dev-page">
      <div className="dev-header">
        <div>
          <p className="dev-eyebrow">
            SEGURANÇA E AUTORIZAÇÃO
          </p>
          <h1>Dispositivos</h1>
          <p className="dev-description">
            Gerencie os celulares e tablets
            autorizados para produção.
          </p>
        </div>

        <button
          className="dev-button dev-primary"
          type="button"
          onClick={() => void carregar()}
          disabled={carregando || salvando}
        >
          <RefreshCw size={17} />
          Atualizar
        </button>
      </div>

      <div className="dev-stats">
        <div>
          <TabletSmartphone size={22} />
          <span>Total</span>
          <strong>{resumo.total}</strong>
        </div>
        <div>
          <Clock3 size={22} />
          <span>Pendentes</span>
          <strong>{resumo.pendentes}</strong>
        </div>
        <div>
          <ShieldCheck size={22} />
          <span>Autorizados</span>
          <strong>{resumo.autorizados}</strong>
        </div>
        <div>
          <ShieldBan size={22} />
          <span>Bloqueados</span>
          <strong>{resumo.bloqueados}</strong>
        </div>
      </div>

      {erro && (
        <div className="dev-message dev-error" role="alert">
          <AlertCircle size={18} />
          {erro}
        </div>
      )}

      {sucesso && (
        <div className="dev-message dev-success" role="status">
          <CheckCircle2 size={18} />
          {sucesso}
        </div>
      )}

      <div className="dev-panel">
        <div className="dev-panel-heading">
          <div>
            <h2>Solicitações e dispositivos</h2>
            <p>
              Registros carregados do PostgreSQL.
            </p>
          </div>

          <select
            aria-label="Filtrar dispositivos"
            value={filtro}
            onChange={(event) =>
              setFiltro(
                event.target.value as
                  | "TODOS"
                  | SituacaoTablet,
              )
            }
          >
            <option value="TODOS">Todos</option>
            <option value="PENDENTE">Pendentes</option>
            <option value="AUTORIZADO">
              Autorizados
            </option>
            <option value="BLOQUEADO">
              Bloqueados
            </option>
          </select>
        </div>

        <div className="dev-table-scroll">
          <table className="dev-table">
            <thead>
              <tr>
                <th>Dispositivo</th>
                <th>Situação</th>
                <th>Máquina</th>
                <th>Solicitação</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {carregando ? (
                <tr>
                  <td colSpan={5} className="dev-empty">
                    Carregando dispositivos...
                  </td>
                </tr>
              ) : listagem.length === 0 ? (
                <tr>
                  <td colSpan={5} className="dev-empty">
                    Nenhum dispositivo encontrado.
                    As solicitações aparecerão
                    aqui quando forem enviadas
                    pelo aplicativo mobile.
                  </td>
                </tr>
              ) : (
                listagem.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>
                        {item.nome || "Dispositivo sem nome"}
                      </strong>
                      <small title={item.identificador}>
                        {item.identificador}
                      </small>
                    </td>

                    <td>
                      <span
                        className={`dev-status dev-${item.situacao.toLowerCase()}`}
                      >
                        {SITUACOES[item.situacao]}
                      </span>
                    </td>

                    <td>
                      {item.maquina
                        ? `${item.maquina.codigo} — ${item.maquina.nome}`
                        : "Não vinculada"}
                    </td>

                    <td>
                      {new Date(
                        item.criadoEm,
                      ).toLocaleDateString("pt-BR")}
                    </td>

                    <td>
                      <div className="dev-actions">
                        {item.situacao !==
                          "AUTORIZADO" && (
                          <button
                            type="button"
                            className="dev-button dev-primary"
                            disabled={salvando}
                            onClick={() =>
                              abrirAutorizacao(item)
                            }
                          >
                            <ShieldCheck size={15} />
                            Autorizar
                          </button>
                        )}

                        {item.situacao !==
                          "BLOQUEADO" && (
                          <button
                            type="button"
                            className="dev-button dev-danger"
                            disabled={salvando}
                            onClick={() =>
                              void bloquear(item)
                            }
                          >
                            <ShieldBan size={15} />
                            Bloquear
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* AUTORIZAÇÃO E VÍNCULO */}
      {selecionado && (
        <div className="dev-overlay">
          <div
            className="dev-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dev-modal-title"
          >
            <h2 id="dev-modal-title">
              Autorizar dispositivo
            </h2>

            <p>
              Selecione a máquina que este
              celular ou tablet poderá utilizar.
            </p>

            <label htmlFor="dev-nome">
              Nome do dispositivo
            </label>
            <input
              id="dev-nome"
              value={nome}
              maxLength={100}
              placeholder="Ex.: Tablet Extrusora 01"
              onChange={(event) =>
                setNome(event.target.value)
              }
              disabled={salvando}
            />

            <label htmlFor="dev-maquina">
              Máquina de produção *
            </label>

            <select
              id="dev-maquina"
              value={maquinaId}
              onChange={(event) =>
                setMaquinaId(event.target.value)
              }
              disabled={salvando}
            >
              <option value="">
                Selecione uma máquina
              </option>
              {maquinasAtivas.map((maquina) => (
                <option
                  key={maquina.id}
                  value={maquina.id}
                >
                  {maquina.codigo} — {maquina.nome}
                </option>
              ))}
            </select>

            {maquinasAtivas.length === 0 && (
              <p className="dev-warning">
                Cadastre uma máquina ativa na
                página Máquinas antes de autorizar.
              </p>
            )}

            {erro && (
              <p className="dev-warning" role="alert">
                {erro}
              </p>
            )}

            <div className="dev-modal-actions">
              <button
                type="button"
                className="dev-button dev-secondary"
                onClick={fecharAutorizacao}
                disabled={salvando}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="dev-button dev-primary"
                onClick={() => void autorizar()}
                disabled={
                  salvando ||
                  !maquinaId ||
                  maquinasAtivas.length === 0
                }
              >
                {salvando
                  ? "Autorizando..."
                  : "Confirmar autorização"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
