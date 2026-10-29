
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  CheckCircle2,
  Cog,
  Edit3,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import "./Maquinas.css";

// ==========================================
// API
// ==========================================

// Ajuste esta URL somente se a API do
// PRODSYNC estiver em outro endereço.
const API_BASE = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000/api"
).replace(/\/+$/, "");

// ==========================================
// TIPOS
// ==========================================

type SituacaoMaquina =
  | "ATIVA"
  | "MANUTENCAO"
  | "INATIVA";

type Maquina = {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  situacao: SituacaoMaquina;
  criadoEm: string;
  atualizadoEm: string;
  _count?: {
    tablets: number;
  };
};

type FormularioMaquina = {
  codigo: string;
  nome: string;
  descricao: string;
};

type Props = {
  token: string;
  onSessaoExpirada: () => void;
};

const FORMULARIO_VAZIO: FormularioMaquina = {
  codigo: "",
  nome: "",
  descricao: "",
};

const ROTULOS_SITUACAO: Record<
  SituacaoMaquina,
  string
> = {
  ATIVA: "Ativa",
  MANUTENCAO: "Em manutenção",
  INATIVA: "Inativa",
};

// ==========================================
// ERROS DA API
// ==========================================

class ErroApi extends Error {
  status: number;

  constructor(
    status: number,
    mensagem: string
  ) {
    super(mensagem);

    this.name = "ErroApi";
    this.status = status;
  }
}

function obterMensagemErro(
  data: unknown
): string | null {
  if (
    typeof data !== "object" ||
    data === null ||
    !("message" in data)
  ) {
    return null;
  }

  const valor = (
    data as { message?: unknown }
  ).message;

  if (typeof valor === "string") {
    return valor;
  }

  if (
    Array.isArray(valor) &&
    valor.every(
      (item) => typeof item === "string"
    )
  ) {
    return valor.join(". ");
  }

  return null;
}

// ==========================================
// COMPONENTE
// ==========================================

export default function Maquinas({
  token,
  onSessaoExpirada,
}: Props) {
  const [maquinas, setMaquinas] =
    useState<Maquina[]>([]);

  const [carregando, setCarregando] =
    useState(true);

  const [salvando, setSalvando] =
    useState(false);

  const [alterandoSituacao, setAlterandoSituacao] =
    useState<string | null>(null);

  const [erro, setErro] =
    useState<string | null>(null);

  const [sucesso, setSucesso] =
    useState<string | null>(null);

  const [pesquisa, setPesquisa] =
    useState("");

  const [modalAberto, setModalAberto] =
    useState(false);

  const [maquinaEditando, setMaquinaEditando] =
    useState<Maquina | null>(null);

  const [formulario, setFormulario] =
    useState<FormularioMaquina>(
      FORMULARIO_VAZIO
    );

  // ==========================================
  // REQUISIÇÃO AUTENTICADA
  // ==========================================

  const requisicao = useCallback(
    async <T,>(
      caminho: string,
      metodo = "GET",
      corpo?: unknown
    ): Promise<T> => {
      let resposta: Response;

      try {
        resposta = await fetch(
          `${API_BASE}${caminho}`,
          {
            method: metodo,
            headers: {
              Authorization: `Bearer ${token}`,
              ...(corpo === undefined
                ? {}
                : {
                    "Content-Type":
                      "application/json",
                  }),
            },
            ...(corpo === undefined
              ? {}
              : {
                  body: JSON.stringify(corpo),
                }),
          }
        );
      } catch {
        throw new ErroApi(
          0,
          "Não foi possível conectar à API do PRODSYNC. Verifique se o NestJS está ligado."
        );
      }

      if (resposta.status === 401) {
        onSessaoExpirada();
        throw new ErroApi(
          401,
          "Sua sessão expirou. Faça login novamente."
        );
      }

      if (resposta.status === 403) {
        throw new ErroApi(
          403,
          "Você não possui permissão para realizar esta operação."
        );
      }

      const dados: unknown =
        await resposta
          .json()
          .catch(() => null);

      if (!resposta.ok) {
        throw new ErroApi(
          resposta.status,
          obterMensagemErro(dados) ||
            `Erro ${resposta.status} ao consultar o servidor.`
        );
      }

      return dados as T;
    },
    [token, onSessaoExpirada]
  );

  // ==========================================
  // LISTAR MÁQUINAS
  // ==========================================

  const carregarMaquinas = useCallback(
    async () => {
      setCarregando(true);
      setErro(null);

      try {
        const dados =
          await requisicao<Maquina[]>(
            "/maquinas"
          );

        if (!Array.isArray(dados)) {
          throw new Error(
            "A API retornou uma listagem inválida."
          );
        }

        setMaquinas(dados);
      } catch (error) {
        setErro(
          error instanceof Error
            ? error.message
            : "Erro ao carregar máquinas."
        );
      } finally {
        setCarregando(false);
      }
    },
    [requisicao]
  );

  useEffect(() => {
    void carregarMaquinas();
  }, [carregarMaquinas]);

  // ==========================================
  // INDICADORES REAIS
  // ==========================================

  const resumo = useMemo(() => {
    return {
      total: maquinas.length,
      ativas: maquinas.filter(
        (m) => m.situacao === "ATIVA"
      ).length,
      manutencao: maquinas.filter(
        (m) =>
          m.situacao === "MANUTENCAO"
      ).length,
      inativas: maquinas.filter(
        (m) => m.situacao === "INATIVA"
      ).length,
    };
  }, [maquinas]);

  // ==========================================
  // FILTRAGEM
  // ==========================================

  const maquinasFiltradas = useMemo(() => {
    const termo = pesquisa
      .trim()
      .toLowerCase();

    if (!termo) {
      return maquinas;
    }

    return maquinas.filter((maquina) => {
      return [
        maquina.codigo,
        maquina.nome,
        maquina.descricao ?? "",
        ROTULOS_SITUACAO[
          maquina.situacao
        ],
      ].some((campo) =>
        campo.toLowerCase().includes(termo)
      );
    });
  }, [maquinas, pesquisa]);

  // ==========================================
  // MODAL
  // ==========================================

  function abrirCadastro() {
    setMaquinaEditando(null);
    setFormulario({
      ...FORMULARIO_VAZIO,
    });
    setErro(null);
    setSucesso(null);
    setModalAberto(true);
  }

  function abrirEdicao(maquina: Maquina) {
    setMaquinaEditando(maquina);

    setFormulario({
      codigo: maquina.codigo,
      nome: maquina.nome,
      descricao:
        maquina.descricao ?? "",
    });

    setErro(null);
    setSucesso(null);
    setModalAberto(true);
  }

  function fecharModal() {
    if (salvando) {
      return;
    }

    setModalAberto(false);
    setMaquinaEditando(null);
    setFormulario({
      ...FORMULARIO_VAZIO,
    });
  }

  function atualizarCampo(
    campo: keyof FormularioMaquina,
    valor: string
  ) {
    setFormulario((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  }

  // ==========================================
  // CADASTRAR / EDITAR
  // ==========================================

  async function salvarMaquina(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (salvando) {
      return;
    }

    const codigo = formulario.codigo
      .trim()
      .toUpperCase();

    const nome = formulario.nome.trim();

    const descricao =
      formulario.descricao.trim();

    if (!codigo || !nome) {
      setErro(
        "Informe o código e o nome da máquina."
      );
      return;
    }

    if (!/^[A-Z0-9_-]+$/.test(codigo)) {
      setErro(
        "O código deve conter apenas letras, números, hífen ou sublinhado."
      );
      return;
    }

    if (
      codigo.length > 30 ||
      nome.length > 100 ||
      descricao.length > 500
    ) {
      setErro(
        "Confira os limites de caracteres dos campos."
      );
      return;
    }

    setSalvando(true);
    setErro(null);
    setSucesso(null);

    try {
      if (maquinaEditando) {
        await requisicao(
          `/maquinas/${maquinaEditando.id}`,
          "PATCH",
          {
            codigo,
            nome,
            descricao:
              descricao || null,
          }
        );

        setSucesso(
          "Máquina atualizada com sucesso."
        );
      } else {
        await requisicao(
          "/maquinas",
          "POST",
          {
            codigo,
            nome,
            ...(descricao
              ? { descricao }
              : {}),
          }
        );

        setSucesso(
          "Máquina cadastrada com sucesso."
        );
      }

      setModalAberto(false);
      setMaquinaEditando(null);
      setFormulario({
        ...FORMULARIO_VAZIO,
      });

      await carregarMaquinas();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar a máquina."
      );
    } finally {
      setSalvando(false);
    }
  }

  // ==========================================
  // ALTERAR SITUAÇÃO
  // ==========================================

  async function mudarSituacao(
    maquina: Maquina,
    situacao: SituacaoMaquina
  ) {
    if (maquina.situacao === situacao) {
      return;
    }

    const confirmou = window.confirm(
      `Deseja alterar "${maquina.nome}" para "${ROTULOS_SITUACAO[situacao]}"?`
    );

    if (!confirmou) {
      return;
    }

    setAlterandoSituacao(maquina.id);
    setErro(null);
    setSucesso(null);

    try {
      await requisicao(
        `/maquinas/${maquina.id}/situacao`,
        "PATCH",
        { situacao }
      );

      setSucesso(
        `Situação de "${maquina.nome}" atualizada.`
      );

      await carregarMaquinas();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar a situação."
      );
    } finally {
      setAlterandoSituacao(null);
    }
  }

  // ==========================================
  // INTERFACE
  // ==========================================

  return (
    <section className="maq-page">
      {/* CABEÇALHO */}
      <div className="maq-heading">
        <div>
          <p className="maq-eyebrow">
            GESTÃO DE PRODUÇÃO
          </p>

          <h1>Máquinas</h1>

          <p className="maq-subtitle">
            Cadastre e gerencie os equipamentos
            utilizados na produção.
          </p>
        </div>

        <div className="maq-heading-actions">
          <button
            type="button"
            className="maq-btn maq-btn-light"
            onClick={() => {
              void carregarMaquinas();
            }}
            disabled={carregando}
          >
            <RefreshCw size={17} />
            Atualizar
          </button>

          <button
            type="button"
            className="maq-btn maq-btn-primary"
            onClick={abrirCadastro}
          >
            <Plus size={18} />
            Nova máquina
          </button>
        </div>
      </div>

      {/* INDICADORES */}
      <div className="maq-summary">
        <div className="maq-stat">
          <span>Total de máquinas</span>
          <strong>{resumo.total}</strong>
        </div>

        <div className="maq-stat">
          <span>Ativas</span>
          <strong>{resumo.ativas}</strong>
        </div>

        <div className="maq-stat">
          <span>Em manutenção</span>
          <strong>{resumo.manutencao}</strong>
        </div>

        <div className="maq-stat">
          <span>Inativas</span>
          <strong>{resumo.inativas}</strong>
        </div>
      </div>

      {/* MENSAGENS */}
      {erro && (
        <div
          className="maq-alert maq-alert-error"
          role="alert"
        >
          <AlertCircle size={18} />
          <span>{erro}</span>
        </div>
      )}

      {sucesso && (
        <div
          className="maq-alert maq-alert-success"
          role="status"
        >
          <CheckCircle2 size={18} />
          <span>{sucesso}</span>
        </div>
      )}

      {/* LISTAGEM */}
      <div className="maq-panel">
        <div className="maq-panel-header">
          <div className="maq-panel-title">
            <Cog size={19} />

            <div>
              <h2>Máquinas cadastradas</h2>
              <p>
                Informações carregadas do
                PRODSYNC ERP.
              </p>
            </div>
          </div>

          <label className="maq-search">
            <Search size={17} />

            <input
              type="search"
              placeholder="Buscar máquina..."
              value={pesquisa}
              onChange={(event) =>
                setPesquisa(event.target.value)
              }
            />
          </label>
        </div>

        <div className="maq-table-scroll">
          <table className="maq-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Máquina</th>
                <th>Situação</th>
                <th>Tablets</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {carregando ? (
                <tr>
                  <td
                    colSpan={5}
                    className="maq-empty"
                  >
                    Carregando máquinas...
                  </td>
                </tr>
              ) : erro &&
                maquinas.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="maq-empty"
                  >
                    Não foi possível carregar a
                    listagem.
                  </td>
                </tr>
              ) : maquinasFiltradas.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="maq-empty"
                  >
                    {pesquisa
                      ? "Nenhuma máquina encontrada para esta pesquisa."
                      : "Nenhuma máquina cadastrada. Clique em Nova máquina."}
                  </td>
                </tr>
              ) : (
                maquinasFiltradas.map(
                  (maquina) => (
                    <tr key={maquina.id}>
                      <td>
                        <span className="maq-code">
                          {maquina.codigo}
                        </span>
                      </td>

                      <td>
                        <strong className="maq-name">
                          {maquina.nome}
                        </strong>

                        <span className="maq-description">
                          {maquina.descricao ||
                            "Sem descrição"}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`maq-status maq-status-${maquina.situacao.toLowerCase()}`}
                        >
                          {
                            ROTULOS_SITUACAO[
                              maquina.situacao
                            ]
                          }
                        </span>
                      </td>

                      <td>
                        {maquina._count
                          ?.tablets ?? 0}
                      </td>

                      <td>
                        <div className="maq-row-actions">
                          <button
                            type="button"
                            className="maq-btn maq-btn-light maq-btn-small"
                            onClick={() =>
                              abrirEdicao(maquina)
                            }
                          >
                            <Edit3 size={15} />
                            Editar
                          </button>

                          <select
                            aria-label={`Alterar situação de ${maquina.nome}`}
                            value={maquina.situacao}
                            disabled={
                              alterandoSituacao ===
                              maquina.id
                            }
                            onChange={(event) => {
                              void mudarSituacao(
                                maquina,
                                event.target
                                  .value as SituacaoMaquina
                              );
                            }}
                          >
                            <option value="ATIVA">
                              Ativa
                            </option>
                            <option value="MANUTENCAO">
                              Em manutenção
                            </option>
                            <option value="INATIVA">
                              Inativa
                            </option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE CADASTRO/EDIÇÃO */}
      {modalAberto && (
        <div
          className="maq-modal-backdrop"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              fecharModal();
            }
          }}
        >
          <div
            className="maq-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="maq-modal-title"
          >
            <div className="maq-modal-heading">
              <div>
                <p className="maq-eyebrow">
                  CADASTRO
                </p>

                <h2 id="maq-modal-title">
                  {maquinaEditando
                    ? "Editar máquina"
                    : "Nova máquina"}
                </h2>
              </div>

              <button
                type="button"
                className="maq-icon-btn"
                onClick={fecharModal}
                disabled={salvando}
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={(event) => {
                void salvarMaquina(event);
              }}
            >
              <div className="maq-field">
                <label htmlFor="maq-codigo">
                  Código da máquina *
                </label>

                <input
                  id="maq-codigo"
                  value={formulario.codigo}
                  maxLength={30}
                  onChange={(event) =>
                    atualizarCampo(
                      "codigo",
                      event.target.value
                        .toUpperCase()
                    )
                  }
                  placeholder="Ex.: MAQ-001"
                  required
                  autoFocus
                  disabled={salvando}
                />

                <small>
                  Use letras, números, hífen
                  ou sublinhado.
                </small>
              </div>

              <div className="maq-field">
                <label htmlFor="maq-nome">
                  Nome da máquina *
                </label>

                <input
                  id="maq-nome"
                  value={formulario.nome}
                  maxLength={100}
                  onChange={(event) =>
                    atualizarCampo(
                      "nome",
                      event.target.value
                    )
                  }
                  placeholder="Ex.: Extrusora 01"
                  required
                  disabled={salvando}
                />
              </div>

              <div className="maq-field">
                <label htmlFor="maq-descricao">
                  Descrição
                </label>

                <textarea
                  id="maq-descricao"
                  value={formulario.descricao}
                  maxLength={500}
                  onChange={(event) =>
                    atualizarCampo(
                      "descricao",
                      event.target.value
                    )
                  }
                  placeholder="Informações adicionais..."
                  rows={4}
                  disabled={salvando}
                />
              </div>

              {erro && (
                <div
                  className="maq-alert maq-alert-error"
                  role="alert"
                >
                  <AlertCircle size={18} />
                  <span>{erro}</span>
                </div>
              )}

              <div className="maq-modal-actions">
                <button
                  type="button"
                  className="maq-btn maq-btn-light"
                  onClick={fecharModal}
                  disabled={salvando}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="maq-btn maq-btn-primary"
                  disabled={salvando}
                >
                  {salvando
                    ? "Salvando..."
                    : maquinaEditando
                      ? "Salvar alterações"
                      : "Cadastrar máquina"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
