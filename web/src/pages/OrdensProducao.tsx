
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  Plus,
  Search,
  RefreshCw,
  X,
  Package,
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
    } catch (e) {
      setErro(mensagemErro(e));
    } finally {
      setCarregando(false);
    }
  }, [token]);

  useEffect(() => {
    void carregarDados();
  }, [carregarDados]);

  const ordensFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return ordens;

    return ordens.filter((op) =>
      [
        op.numero,
        op.produto?.codigo,
        op.produto?.descricao,
        op.situacao,
      ]
        .filter(Boolean)
        .some((valor) =>
          String(valor).toLowerCase().includes(termo)
        )
    );
  }, [ordens, busca]);

  const pendentes = ordens.filter(
    (op) => op.situacao === "PENDENTE"
  ).length;

  const emProducao = ordens.filter(
    (op) => op.situacao === "EM_PRODUCAO"
  ).length;

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

          <button
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
                minWidth: 680,
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
                          background: "#E7F2F3",
                          color: cor.teal,
                          fontWeight: 600,
                          fontSize: 12,
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
