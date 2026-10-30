
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  Plus,
  Search,
  RefreshCw,
  X,
  Package,
  Eye,
  Activity,
} from "lucide-react";

import {
  api,
  ApiError,
  type OrdemProducao,
  type ProdutoERP,
} from "../services/api";

type Props = {
  token: string;
  perfil: "ADMIN" | "SUPERVISOR" | "OPERADOR";
};

const cor = {
  navy: "#123450",
  teal: "#007F80",
  fundo: "#F3F6F8",
  borda: "#DCE5EB",
  texto: "#172F42",
  cinza: "#5B6E7C",
};

const campo: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  border: `1px solid ${cor.borda}`,
  borderRadius: 10,
  fontSize: 14,
  background: "#fff",
  color: cor.texto,
  boxSizing: "border-box",
};

const botao: React.CSSProperties = {
  background: cor.navy,
  color: "#fff",
  border: 0,
  borderRadius: 10,
  padding: "12px 17px",
  cursor: "pointer",
  fontWeight: 600,
};

const cartao: React.CSSProperties = {
  background: "#fff",
  border: `1px solid ${cor.borda}`,
  borderRadius: 14,
  padding: 20,
};

function mensagemErro(erro: unknown): string {
  if (erro instanceof ApiError) {
    if (erro.status === 401) {
      return "Sua sessão expirou. Entre novamente no ERP.";
    }

    if (erro.status === 403) {
      return "Seu perfil não tem permissão para esta operação.";
    }

    return erro.message;
  }

  return "Não foi possível concluir a operação.";
}

function situacaoFormatada(situacao: string) {
  const nomes: Record<string, string> = {
    PENDENTE: "Pendente",
    EM_PRODUCAO: "Em produção",
    PAUSADA: "Pausada",
    FINALIZADA: "Finalizada",
    CANCELADA: "Cancelada",
  };

  return nomes[situacao] ?? situacao;
}

export default function OrdensProducao({
  token,
  perfil,
}: Props) {
  const [ordens, setOrdens] = useState<OrdemProducao[]>([]);
  const [produtos, setProdutos] = useState<ProdutoERP[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroSituacao, setFiltroSituacao] = useState("TODAS");
  const [detalheId, setDetalheId] = useState<string | null>(null);
  const [atualizadoEm, setAtualizadoEm] = useState<Date | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [numero, setNumero] = useState("");
  const [produtoId, setProdutoId] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const carregarDados = useCallback(async () => {
    setCarregando(true);
    setErro("");

    try {
      const [listaOrdens, listaProdutos] = await Promise.all([
        api.listarOrdens(token),
        api.listarProdutos(token),
      ]);

      setOrdens(listaOrdens);
      setProdutos(listaProdutos);
      setAtualizadoEm(new Date());
    } catch (e) {
      setErro(mensagemErro(e));
    } finally {
      setCarregando(false);
    }
  }, [token]);

  useEffect(() => {
    void carregarDados();
  }, [carregarDados]);

  // Atualiza apenas as OPs, sem recarregar os produtos ou apagar a tabela.
  useEffect(() => {
    let ativo = true;
    let emCurso = false;
    const atualizar = async () => {
      if (emCurso || document.visibilityState === "hidden") return;
      emCurso = true;
      try {
        const lista = await api.listarOrdens(token);
        if (ativo) {
          setOrdens(lista);
          setAtualizadoEm(new Date());
        }
      } catch {
        // Mantém os últimos dados. Atualização manual exibe erros.
      } finally {
        emCurso = false;
      }
    };
    const timer = window.setInterval(() => void atualizar(), 30000);
    return () => { ativo = false; window.clearInterval(timer); };
  }, [token]);

  const detalhe = ordens.find((op) => op.id === detalheId) ?? null;
  const percentual = (op: OrdemProducao) =>
    op.quantidadePlanejada > 0
      ? Math.min(100, Math.max(0, (op.quantidadeProduzida / op.quantidadePlanejada) * 100))
      : 0;

  const statusVisual = (situacao: string) => {
    switch (situacao) {
      case "EM_PRODUCAO": return { fundo: "#DEF7F4", texto: "#08766D" };
      case "FINALIZADA": return { fundo: "#E5F7E9", texto: "#187A3C" };
      case "PAUSADA": return { fundo: "#FFF3D6", texto: "#946200" };
      case "CANCELADA": return { fundo: "#FEE8E8", texto: "#AC3030" };
      default: return { fundo: "#E9EFF5", texto: "#42596D" };
    }
  };

  const ordensFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return ordens.filter((op) =>
      (filtroSituacao === "TODAS" || op.situacao === filtroSituacao) &&
      (!termo ||
      [
        op.numero,
        op.produto?.codigo,
        op.produto?.descricao,
        op.situacao,
      ]
        .filter(Boolean)
        .some((valor) =>
          String(valor).toLowerCase().includes(termo)
        ))
    );
  }, [ordens, busca, filtroSituacao]);

  const pendentes = ordens.filter(
    (op) => op.situacao === "PENDENTE"
  ).length;

  const emProducao = ordens.filter(
    (op) => op.situacao === "EM_PRODUCAO"
  ).length;

  const pausadas = ordens.filter((op) => op.situacao === "PAUSADA").length;
  const finalizadas = ordens.filter((op) => op.situacao === "FINALIZADA").length;

  function abrirCadastro() {
    setNumero("");
    setProdutoId("");
    setQuantidade("");
    setObservacoes("");
    setErro("");
    setSucesso("");
    setModalAberto(true);
  }

  async function criarOP(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (salvando || perfil !== "ADMIN") return;

    const quantidadePlanejada = Number(quantidade);

    if (
      !Number.isSafeInteger(quantidadePlanejada) ||
      quantidadePlanejada <= 0
    ) {
      setErro("Informe uma quantidade inteira maior que zero.");
      return;
    }

    if (!numero.trim() || !produtoId) {
      setErro("Informe o número da OP e selecione um produto.");
      return;
    }

    setSalvando(true);
    setErro("");

    try {
      await api.criarOrdem(token, {
        numero: numero.trim().toUpperCase(),
        produtoId,
        quantidadePlanejada,
        observacoes: observacoes.trim() || undefined,
      });

      setModalAberto(false);
      setSucesso("Ordem de produção cadastrada com sucesso!");

      await carregarDados();
    } catch (e) {
      setErro(mensagemErro(e));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div
      style={{
        color: cor.texto,
        width: "100%",
        maxWidth: 1250,
        margin: "0 auto",
        padding: 4,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <p style={{ color: cor.teal, fontWeight: 700, margin: 0 }}>
            PRODSYNC ERP / JM FORROS
          </p>

          <h1 style={{ margin: "8px 0", fontSize: 29 }}>
            Ordens de Produção
          </h1>

          <p style={{ color: cor.cinza, margin: 0 }}>
            Consulte e acompanhe as ordens cadastradas.
          </p>
        </div>

        {perfil === "ADMIN" && (
          <button
            style={{
              ...botao,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
            onClick={abrirCadastro}
          >
            <Plus size={19} />
            Nova OP
          </button>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(170px, 1fr))",
          gap: 14,
          marginBottom: 24,
        }}
      >
        {[
          { titulo: "Total de OPs", valor: ordens.length },
          { titulo: "Pendentes", valor: pendentes },
          { titulo: "Em produção", valor: emProducao },
          { titulo: "Pausadas", valor: pausadas },
          { titulo: "Finalizadas", valor: finalizadas },
        ].map((item) => (
          <div key={item.titulo} style={cartao}>
            <p style={{ color: cor.cinza, margin: "0 0 10px" }}>
              {item.titulo}
            </p>
            <strong style={{ fontSize: 30 }}>
              {item.valor}
            </strong>
          </div>
        ))}
      </div>

      {sucesso && (
        <p style={{ color: "#167046", fontWeight: 600 }}>
          {sucesso}
        </p>
      )}

      {erro && (
        <p style={{ color: "#B42318", fontWeight: 600 }}>
          {erro}
        </p>
      )}

      <div style={cartao}>
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              position: "relative",
              flex: "1 1 240px",
            }}
          >
            <Search
              size={18}
              style={{
                position: "absolute",
                left: 12,
                top: 13,
                color: cor.cinza,
              }}
            />

            <input
              style={{ ...campo, paddingLeft: 40 }}
              placeholder="Pesquisar número, produto ou situação..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          <select
            aria-label="Filtrar por situação"
            value={filtroSituacao}
            onChange={(e) => setFiltroSituacao(e.target.value)}
            style={{ ...campo, width: "auto", minWidth: 175 }}
          >
            <option value="TODAS">Todas as situações</option>
            <option value="PENDENTE">Pendentes</option>
            <option value="EM_PRODUCAO">Em produção</option>
            <option value="PAUSADA">Pausadas</option>
            <option value="FINALIZADA">Finalizadas</option>
            <option value="CANCELADA">Canceladas</option>
          </select>
          <button
            type="button"
            title="Atualizar agora"
            aria-label="Atualizar agora"
            onClick={() => void carregarDados()}
            style={{
              ...botao,
              background: "#E7F2F3",
              color: cor.navy,
            }}
          >
            <RefreshCw size={17} />
          </button>
        </div>

        <p style={{ color: cor.cinza, fontSize: 12, margin: "0 0 14px" }}>
          <Activity size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />
          Atualização automática a cada 30 segundos
          {atualizadoEm ? ` · Última consulta: ${atualizadoEm.toLocaleTimeString("pt-BR")}` : ""}
        </p>
        {carregando ? (
          <p>Carregando ordens de produção...</p>
        ) : ordensFiltradas.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: 32,
              color: cor.cinza,
            }}
          >
            <ClipboardList size={36} />
            <p>Nenhuma ordem encontrada.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
                minWidth: 850,
              }}
            >
              <thead>
                <tr style={{ borderBottom: `1px solid ${cor.borda}` }}>
                  {[
                    "Número",
                    "Produto",
                    "Situação",
                    "Planejado",
                    "Produzido",
                    "Progresso",
                    "Detalhes",
                  ].map((titulo) => (
                    <th
                      key={titulo}
                      style={{ padding: "13px 10px" }}
                    >
                      {titulo}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {ordensFiltradas.map((op) => (
                  <tr
                    key={op.id}
                    style={{
                      borderBottom: `1px solid ${cor.borda}`,
                    }}
                  >
                    <td style={{ padding: "15px 10px", fontWeight: 700 }}>
                      {op.numero}
                    </td>

                    <td style={{ padding: "15px 10px" }}>
                      <strong>
                        {op.produto?.descricao ?? "Produto não encontrado"}
                      </strong>
                      <div style={{ color: cor.cinza, fontSize: 12 }}>
                        {op.produto?.codigo}
                      </div>
                    </td>

                    <td style={{ padding: "15px 10px" }}>
                      <span
                        style={{
                          padding: "6px 10px",
                          borderRadius: 20,
                          background: statusVisual(op.situacao).fundo,
                          color: statusVisual(op.situacao).texto,
                          fontWeight: 700,
                          fontSize: 12,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {situacaoFormatada(op.situacao)}
                      </span>
                    </td>

                    <td style={{ padding: "15px 10px" }}>
                      {op.quantidadePlanejada}
                    </td>

                    <td style={{ padding: "15px 10px" }}>
                      {op.quantidadeProduzida}
                    </td>
                    <td style={{ padding: "15px 10px", minWidth: 130 }}>
                      <div style={{ height: 8, background: "#E6EDF2", borderRadius: 20, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${percentual(op)}%`, background: cor.teal, borderRadius: 20 }} />
                      </div>
                      <small style={{ color: cor.cinza }}>{percentual(op).toFixed(1)}%</small>
                    </td>
                    <td style={{ padding: "15px 10px" }}>
                      <button type="button" onClick={() => setDetalheId(op.id)}
                        style={{ ...botao, padding: "9px 11px", background: "#E7F2F3", color: cor.navy, display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <Eye size={16}/> Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detalhe && (
        <div role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setDetalheId(null); }}
          style={{ position: "fixed", inset: 0, background: "rgba(7,17,31,.65)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 150 }}>
          <section role="dialog" aria-modal="true" aria-labelledby="titulo-detalhe-op"
            style={{ ...cartao, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div><p style={{ color: cor.teal, fontWeight: 700, margin: 0 }}>ACOMPANHAMENTO</p>
                <h2 id="titulo-detalhe-op" style={{ margin: "6px 0" }}>OP {detalhe.numero}</h2></div>
              <button type="button" aria-label="Fechar detalhes" onClick={() => setDetalheId(null)}
                style={{ border: 0, background: "transparent", cursor: "pointer" }}><X size={22}/></button>
            </div>
            <span style={{ display: "inline-block", marginTop: 12, padding: "6px 10px", borderRadius: 20, fontWeight: 700,
              background: statusVisual(detalhe.situacao).fundo, color: statusVisual(detalhe.situacao).texto }}>
              {situacaoFormatada(detalhe.situacao)}
            </span>
            <div style={{ marginTop: 20, display: "grid", gap: 12 }}>
              <div><strong>Produto</strong><div>{detalhe.produto?.descricao ?? "Produto não encontrado"}</div>
                <small style={{ color: cor.cinza }}>Código: {detalhe.produto?.codigo ?? "—"}</small></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ ...cartao, padding: 14 }}><small>Planejado</small><h3 style={{ margin: "8px 0 0" }}>{detalhe.quantidadePlanejada}</h3></div>
                <div style={{ ...cartao, padding: 14 }}><small>Produzido</small><h3 style={{ margin: "8px 0 0" }}>{detalhe.quantidadeProduzida}</h3></div>
              </div>
              <strong>Progresso: {percentual(detalhe).toFixed(1)}%</strong>
              <div style={{ height: 12, background: "#E6EDF2", borderRadius: 20, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${percentual(detalhe)}%`, background: cor.teal }} />
              </div>
            </div>
            <button type="button" onClick={() => setDetalheId(null)}
              style={{ ...botao, marginTop: 24, width: "100%" }}>Fechar</button>
          </section>
        </div>
      )}

      {modalAberto && (
        <div
          role="presentation"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(7,17,31,.65)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: 16,
            zIndex: 100,
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Cadastrar ordem de produção"
            style={{
              ...cartao,
              width: "100%",
              maxWidth: 490,
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <h2 style={{ margin: 0 }}>Nova ordem de produção</h2>

              <button
                onClick={() => setModalAberto(false)}
                aria-label="Fechar"
                style={{ background: "none", border: 0, cursor: "pointer" }}
              >
                <X size={22} />
              </button>
            </div>

            <form
              onSubmit={(e) => void criarOP(e)}
              style={{ display: "grid", gap: 16 }}
            >
              <label>
                Número da OP
                <input
                  style={{ ...campo, marginTop: 6 }}
                  placeholder="Ex.: 2026-0149"
                  value={numero}
                  maxLength={40}
                  onChange={(e) => setNumero(e.target.value)}
                  required
                />
              </label>

              <label>
                Produto
                <select
                  style={{ ...campo, marginTop: 6 }}
                  value={produtoId}
                  onChange={(e) => setProdutoId(e.target.value)}
                  required
                >
                  <option value="">Selecione um produto</option>

                  {produtos
                    .filter((produto) => produto.ativo !== false)
                    .map((produto) => (
                      <option key={produto.id} value={produto.id}>
                        {produto.codigo} — {produto.descricao}
                      </option>
                    ))}
                </select>
              </label>

              <label>
                Quantidade planejada
                <input
                  type="number"
                  min={1}
                  step={1}
                  style={{ ...campo, marginTop: 6 }}
                  placeholder="Ex.: 600"
                  value={quantidade}
                  onChange={(e) => setQuantidade(e.target.value)}
                  required
                />
              </label>

              <label>
                Observações (opcional)
                <textarea
                  style={{ ...campo, marginTop: 6, resize: "vertical" }}
                  rows={3}
                  maxLength={1000}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                />
              </label>

              {erro && (
                <p style={{ color: "#B42318", margin: 0 }}>
                  {erro}
                </p>
              )}

              <button
                type="submit"
                disabled={salvando}
                style={{
                  ...botao,
                  opacity: salvando ? 0.6 : 1,
                }}
              >
                <Package
                  size={17}
                  style={{ verticalAlign: "middle", marginRight: 7 }}
                />
                {salvando ? "Salvando..." : "Cadastrar OP"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
