import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { ClipboardList, Plus, RefreshCw, X } from 'lucide-react';
import './HistoricoProducao.css';

type Opcao = { id: string; nome?: string; numero?: string; codigo?: string; situacao?: string; ativo?: boolean; perfil?: string };
type OP = Opcao & { quantidadePlanejada: number; quantidadeProduzida: number };
type Registro = {
  id: string; quantidadeBoa: number; quantidadeRejeitada: number; criadoEm: string; observacoes: string | null;
  ordem: { numero: string; produto?: { descricao: string } };
  maquina: { codigo: string; nome: string };
  operador: { nome: string; email: string };
};
type Props = { token: string; onSessaoExpirada: () => void };
const API = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/+$/, '');

export default function HistoricoProducao({ token, onSessaoExpirada }: Props) {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [ordens, setOrdens] = useState<OP[]>([]);
  const [maquinas, setMaquinas] = useState<Opcao[]>([]);
  const [operadores, setOperadores] = useState<Opcao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [modal, setModal] = useState(false);
  const [busca, setBusca] = useState('');
  const [ordemId, setOrdemId] = useState('');
  const [maquinaId, setMaquinaId] = useState('');
  const [operadorId, setOperadorId] = useState('');
  const [quantidadeBoa, setQuantidadeBoa] = useState('');
  const [quantidadeRejeitada, setQuantidadeRejeitada] = useState('0');
  const [observacoes, setObservacoes] = useState('');

  const requisitar = useCallback(async <T,>(caminho: string, options?: RequestInit): Promise<T> => {
    const resposta = await fetch(`${API}${caminho}`, {
      ...options,
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', ...options?.headers },
    });
    if (resposta.status === 401) { onSessaoExpirada(); throw new Error('Sessão expirada. Entre novamente.'); }
    if (!resposta.ok) {
      const dados: unknown = await resposta.json().catch(() => null);
      const detalhe = dados && typeof dados === 'object' && 'message' in dados ? (dados as {message: unknown}).message : null;
      throw new Error(Array.isArray(detalhe) ? detalhe.join(', ') : typeof detalhe === 'string' ? detalhe : `Erro ${resposta.status}`);
    }
    return resposta.json() as Promise<T>;
  }, [token, onSessaoExpirada]);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const [r, o, m, u] = await Promise.all([
        requisitar<Registro[]>('/apontamentos'),
        requisitar<OP[]>('/ordens-producao'),
        requisitar<Opcao[]>('/maquinas'),
        requisitar<Opcao[]>('/usuarios'),
      ]);
      setRegistros(r); setOrdens(o); setMaquinas(m); setOperadores(u); setErro('');
    } catch(e) { setErro(e instanceof Error ? e.message : 'Falha ao carregar dados.'); }
    finally { setCarregando(false); }
  }, [requisitar]);

  useEffect(() => { void carregar(); }, [carregar]);

  const filtrados = useMemo(() => registros.filter(r => [r.ordem.numero, r.ordem.produto?.descricao, r.maquina.nome, r.operador.nome]
    .some(s => (s || '').toLowerCase().includes(busca.trim().toLowerCase()))), [registros, busca]);
  const totalBom = filtrados.reduce((s, r) => s + r.quantidadeBoa, 0);
  const totalRejeitado = filtrados.reduce((s, r) => s + r.quantidadeRejeitada, 0);

  async function salvar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (salvando) return;
    setSalvando(true); setErro(''); setSucesso('');
    try {
      await requisitar('/apontamentos', {
        method: 'POST',
        body: JSON.stringify({ ordemId, maquinaId, operadorId, quantidadeBoa: Number(quantidadeBoa),
          quantidadeRejeitada: Number(quantidadeRejeitada), observacoes: observacoes.trim() || undefined }),
      });
      setModal(false); setQuantidadeBoa(''); setQuantidadeRejeitada('0'); setObservacoes('');
      setSucesso('Apontamento registrado e quantidade produzida da OP atualizada.');
      await carregar();
    } catch(e) { setErro(e instanceof Error ? e.message : 'Falha ao registrar apontamento.'); }
    finally { setSalvando(false); }
  }

  return <div className="historico-page">
    <div className="historico-head">
      <div><p className="historico-eyebrow">PRODSYNC ERP / PRODUÇÃO</p><h1>Histórico de produção</h1>
        <p>Registros reais de produção por ordem, máquina e operador.</p></div>
      <button className="historico-primary" type="button" onClick={() => { setErro(''); setModal(true); }}><Plus size={18}/> Novo apontamento</button>
    </div>
    <div className="historico-metrics">
      <section><span>Apontamentos exibidos</span><strong>{filtrados.length}</strong></section>
      <section><span>Quantidade produzida</span><strong>{totalBom}</strong></section>
      <section><span>Quantidade rejeitada</span><strong>{totalRejeitado}</strong></section>
    </div>
    {erro && <div className="historico-alert error" role="alert">{erro}</div>}
    {sucesso && <div className="historico-alert success" role="status">{sucesso}</div>}
    <section className="historico-panel">
      <div className="historico-toolbar"><input aria-label="Pesquisar apontamentos" placeholder="Pesquisar OP, produto, máquina ou operador..." value={busca} onChange={e => setBusca(e.target.value)}/>
        <button type="button" onClick={() => void carregar()} disabled={carregando}><RefreshCw size={17}/> Atualizar</button></div>
      {carregando ? <p>Carregando apontamentos...</p> : filtrados.length === 0 ?
        <div className="historico-empty"><ClipboardList size={34}/><p>Nenhum apontamento encontrado.</p></div> :
        <div className="historico-tablewrap"><table><thead><tr><th>Data</th><th>OP / Produto</th><th>Máquina</th><th>Operador</th><th>Produzido</th><th>Rejeitado</th></tr></thead>
          <tbody>{filtrados.map(r => <tr key={r.id}><td>{new Date(r.criadoEm).toLocaleString('pt-BR')}</td>
            <td><b>{r.ordem.numero}</b><small>{r.ordem.produto?.descricao || ''}</small></td>
            <td>{r.maquina.nome}<small>{r.maquina.codigo}</small></td><td>{r.operador.nome}</td>
            <td className="historico-positive">{r.quantidadeBoa}</td><td>{r.quantidadeRejeitada}</td></tr>)}</tbody></table></div>}
    </section>
    {modal && <div className="historico-overlay" onMouseDown={e => { if(e.target === e.currentTarget && !salvando) setModal(false); }}>
      <div className="historico-dialog" role="dialog" aria-modal="true" aria-label="Novo apontamento">
        <div className="historico-dialoghead"><div><h2>Novo apontamento</h2><p>Registro manual de teste no PostgreSQL</p></div>
          <button type="button" aria-label="Fechar" onClick={() => setModal(false)} disabled={salvando}><X size={20}/></button></div>
        <form onSubmit={e => void salvar(e)} className="historico-form">
          <label>Ordem de produção<select required value={ordemId} onChange={e => setOrdemId(e.target.value)}><option value="">Selecione</option>
            {ordens.filter(o => !['FINALIZADA', 'CANCELADA'].includes(o.situacao || '')).map(o => <option value={o.id} key={o.id}>{o.numero} ({o.quantidadeProduzida}/{o.quantidadePlanejada})</option>)}</select></label>
          <label>Máquina<select required value={maquinaId} onChange={e => setMaquinaId(e.target.value)}><option value="">Selecione</option>
            {maquinas.filter(m => m.situacao === 'ATIVA').map(m => <option value={m.id} key={m.id}>{m.codigo} — {m.nome}</option>)}</select></label>
          <label>Operador<select required value={operadorId} onChange={e => setOperadorId(e.target.value)}><option value="">Selecione</option>
            {operadores.filter(u => u.ativo && u.perfil === 'OPERADOR').map(u => <option value={u.id} key={u.id}>{u.nome}</option>)}</select></label>
          <div className="historico-twocol"><label>Quantidade produzida<input type="number" min="1" step="1" required value={quantidadeBoa} onChange={e => setQuantidadeBoa(e.target.value)}/></label>
            <label>Quantidade rejeitada<input type="number" min="0" step="1" required value={quantidadeRejeitada} onChange={e => setQuantidadeRejeitada(e.target.value)}/></label></div>
          <label>Observações<textarea maxLength={500} rows={3} value={observacoes} onChange={e => setObservacoes(e.target.value)}/></label>
          {erro && <div className="historico-alert error" role="alert">{erro}</div>}
          <div className="historico-actions"><button type="button" onClick={() => setModal(false)} disabled={salvando}>Cancelar</button>
            <button className="historico-primary" type="submit" disabled={salvando}>{salvando ? 'Salvando...' : 'Registrar apontamento'}</button></div>
        </form>
      </div></div>}
  </div>;
}
