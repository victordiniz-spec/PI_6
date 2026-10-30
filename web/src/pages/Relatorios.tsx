import { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart3, Download, Printer, RefreshCw, Search } from 'lucide-react';
import './Relatorios.css';

type Opcao = { id: string; nome?: string; numero?: string; codigo?: string; perfil?: string; ativo?: boolean };
type Grupo = { chave: string; nome: string; quantidadeProduzida: number; quantidadeRejeitada: number; apontamentos: number };
type Registro = {
  id: string; criadoEm: string; numeroOP: string; produto: string; maquina: string;
  codigoMaquina: string; operador: string; quantidadeProduzida: number; quantidadeRejeitada: number;
};
type Relatorio = {
  resumo: { apontamentos: number; quantidadeProduzida: number; quantidadeRejeitada: number; aproveitamento: number };
  porMaquina: Grupo[]; porOperador: Grupo[]; porDia: Grupo[]; registros: Registro[];
};
type Props = { token: string; onSessaoExpirada: () => void };
const API = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/+$/, '');
const inteiro = (valor: number) => new Intl.NumberFormat('pt-BR').format(valor);
const percentual = (valor: number) => `${valor.toFixed(1).replace('.', ',')}%`;

function iniciarDownloadCSV(registros: Registro[]) {
  const linhas = [
    ['Data', 'OP', 'Produto', 'Máquina', 'Operador', 'Produzido', 'Rejeitado'],
    ...registros.map(r => [new Date(r.criadoEm).toLocaleString('pt-BR'), r.numeroOP, r.produto, `${r.codigoMaquina} - ${r.maquina}`, r.operador, String(r.quantidadeProduzida), String(r.quantidadeRejeitada)]),
  ];
  // Proteção contra execução de fórmulas ao abrir CSV em aplicativos de planilha.
  const escapar = (valor: string) => {
    const seguro = /^[\s]*[=+@-]/.test(valor) ? `'${valor}` : valor;
    return `"${seguro.replace(/"/g, '""')}"`;
  };
  const csv = '\uFEFF' + linhas.map(l => l.map(escapar).join(';')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a');
  a.href = url; a.download = 'prodsync-relatorio-producao.csv'; document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

function GraficoBarras({ titulo, dados }: { titulo: string; dados: Grupo[] }) {
  const maximo = Math.max(1, ...dados.map(d => d.quantidadeProduzida + d.quantidadeRejeitada));
  return <section className="rel-card rel-chart">
    <h2>{titulo}</h2>
    {dados.length === 0 ? <p className="rel-muted">Nenhum dado no período.</p> :
      dados.slice(0, 10).map(g => <div key={g.chave} className="rel-barrow">
        <div className="rel-bar-label"><strong title={g.nome}>{g.nome}</strong><small>{inteiro(g.quantidadeProduzida)} produzidas · {inteiro(g.quantidadeRejeitada)} rejeitadas</small></div>
        <div className="rel-track"><span className="rel-good" style={{ width: `${g.quantidadeProduzida / maximo * 100}%` }}/><span className="rel-bad" style={{ width: `${g.quantidadeRejeitada / maximo * 100}%` }}/></div>
      </div>)}
    <p className="rel-legend"><span className="rel-dot good"/> Produzidas <span className="rel-dot bad"/> Rejeitadas</p>
  </section>;
}

export default function Relatorios({ token, onSessaoExpirada }: Props) {
  const [inicio, setInicio] = useState('');
  const [fim, setFim] = useState('');
  const [ordemId, setOrdemId] = useState('');
  const [maquinaId, setMaquinaId] = useState('');
  const [operadorId, setOperadorId] = useState('');
  const [busca, setBusca] = useState('');
  const [ordens, setOrdens] = useState<Opcao[]>([]);
  const [maquinas, setMaquinas] = useState<Opcao[]>([]);
  const [operadores, setOperadores] = useState<Opcao[]>([]);
  const [relatorio, setRelatorio] = useState<Relatorio | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  const requisitar = useCallback(async <T,>(caminho: string): Promise<T> => {
    const resposta = await fetch(`${API}${caminho}`, { headers: { Authorization: `Bearer ${token}` } });
    if (resposta.status === 401) { onSessaoExpirada(); throw new Error('Sua sessão expirou. Entre novamente.'); }
    if (!resposta.ok) {
      const corpo: unknown = await resposta.json().catch(() => null);
      const mensagem = corpo && typeof corpo === 'object' && 'message' in corpo ? (corpo as { message: unknown }).message : null;
      throw new Error(Array.isArray(mensagem) ? mensagem.join(', ') : typeof mensagem === 'string' ? mensagem : `Erro ${resposta.status}`);
    }
    return resposta.json() as Promise<T>;
  }, [token, onSessaoExpirada]);

  useEffect(() => {
    let ativo = true;
    void Promise.allSettled([
      requisitar<Opcao[]>('/ordens-producao'),
      requisitar<Opcao[]>('/maquinas'),
      requisitar<Opcao[]>('/usuarios'),
    ]).then(([o, m, u]) => {
      if (!ativo) return;
      if (o.status === 'fulfilled') setOrdens(o.value);
      if (m.status === 'fulfilled') setMaquinas(m.value);
      // Supervisor pode não ter acesso à listagem administrativa de usuários.
      if (u.status === 'fulfilled') setOperadores(u.value);
    });
    return () => { ativo = false; };
  }, [requisitar]);

  const consultar = useCallback(async () => {
    setCarregando(true); setErro('');
    try {
      const query = new URLSearchParams();
      if (inicio) query.set('inicio', inicio);
      if (fim) query.set('fim', fim);
      if (ordemId) query.set('ordemId', ordemId);
      if (maquinaId) query.set('maquinaId', maquinaId);
      if (operadorId) query.set('operadorId', operadorId);
      const r = await requisitar<Relatorio>(`/relatorios/producao?${query.toString()}`);
      setRelatorio(r);
    } catch (e) { setErro(e instanceof Error ? e.message : 'Não foi possível consultar o relatório.'); }
    finally { setCarregando(false); }
  }, [inicio, fim, ordemId, maquinaId, operadorId, requisitar]);
  useEffect(() => { void consultar(); }, [consultar]);

  const registros = useMemo(() => (relatorio?.registros ?? []).filter(r =>
    [r.numeroOP, r.produto, r.maquina, r.codigoMaquina, r.operador].some(x => x.toLowerCase().includes(busca.trim().toLowerCase()))
  ), [relatorio, busca]);
  const resumo = relatorio?.resumo;
  const cartoes = [
    ['Apontamentos', resumo?.apontamentos ?? 0],
    ['Produção boa', resumo?.quantidadeProduzida ?? 0],
    ['Rejeições', resumo?.quantidadeRejeitada ?? 0],
    ['Aproveitamento', percentual(resumo?.aproveitamento ?? 0)],
  ];
  return <div className="rel-page">
    <header className="rel-header"><div><p className="rel-eyebrow">PRODSYNC ERP / GESTÃO</p><h1>Relatórios de produção</h1><p className="rel-muted">Dados dos apontamentos registrados no PRODSYNC. Não inclui integração com o Sankhya.</p></div>
      <div className="rel-actions"><button type="button" onClick={() => void consultar()} disabled={carregando}><RefreshCw size={17}/> Atualizar</button><button type="button" disabled={!relatorio} onClick={() => iniciarDownloadCSV(registros)}><Download size={17}/> Exportar CSV</button><button type="button" disabled={!relatorio} onClick={() => window.print()}><Printer size={17}/> Salvar em PDF</button></div></header>
    <section className="rel-card rel-filters"><h2>Filtros</h2><div className="rel-filtergrid">
      <label>Data inicial<input type="date" value={inicio} onChange={e => setInicio(e.target.value)}/></label>
      <label>Data final<input type="date" value={fim} onChange={e => setFim(e.target.value)}/></label>
      <label>Ordem de produção<select value={ordemId} onChange={e => setOrdemId(e.target.value)}><option value="">Todas</option>{ordens.map(o => <option key={o.id} value={o.id}>{o.numero}</option>)}</select></label>
      <label>Máquina<select value={maquinaId} onChange={e => setMaquinaId(e.target.value)}><option value="">Todas</option>{maquinas.map(m => <option key={m.id} value={m.id}>{m.codigo} — {m.nome}</option>)}</select></label>
      <label>Operador<select value={operadorId} onChange={e => setOperadorId(e.target.value)}><option value="">Todos</option>{operadores.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}</select></label>
    </div></section>
    {erro && <p className="rel-error" role="alert">{erro}</p>}
    {carregando && <p className="rel-muted" role="status">Atualizando relatório...</p>}
    <div className="rel-kpis">{cartoes.map(([nome, valor]) => <section key={nome} className="rel-card"><span>{nome}</span><strong>{typeof valor === 'number' ? inteiro(valor) : valor}</strong></section>)}</div>
    <div className="rel-charts"><GraficoBarras titulo="Produção por máquina" dados={relatorio?.porMaquina ?? []}/><GraficoBarras titulo="Produção por operador" dados={relatorio?.porOperador ?? []}/></div>
    <GraficoBarras titulo="Evolução diária" dados={relatorio?.porDia ?? []}/>
    <section className="rel-card rel-results"><div className="rel-tablehead"><div><h2>Apontamentos detalhados</h2><p className="rel-muted">{inteiro(registros.length)} registro(s) visíveis</p></div><div className="rel-search"><Search size={17}/><input placeholder="Pesquisar nesta tabela..." aria-label="Pesquisar nos apontamentos" value={busca} onChange={e => setBusca(e.target.value)}/></div></div>
      <div className="rel-tablewrap"><table><thead><tr><th>Data</th><th>OP</th><th>Produto</th><th>Máquina</th><th>Operador</th><th>Produzido</th><th>Rejeitado</th></tr></thead><tbody>{registros.map(r => <tr key={r.id}><td>{new Date(r.criadoEm).toLocaleString('pt-BR')}</td><td>{r.numeroOP}</td><td>{r.produto}</td><td>{r.codigoMaquina} — {r.maquina}</td><td>{r.operador}</td><td>{inteiro(r.quantidadeProduzida)}</td><td>{inteiro(r.quantidadeRejeitada)}</td></tr>)}</tbody></table>{!registros.length && <p className="rel-empty">Nenhum apontamento encontrado para os filtros selecionados.</p>}</div>
    </section>
    <footer className="rel-foot"><BarChart3 size={16}/> Aproveitamento = unidades boas ÷ (boas + rejeitadas). Não representa OEE.</footer>
  </div>;
}
