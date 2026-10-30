import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, PauseCircle, Plus, RefreshCw, X } from 'lucide-react';
import './ParadasProducao.css';

type Maquina = { id: string; codigo: string; nome: string; situacao: string };
type Ordem = { id: string; numero: string; situacao: string };
type Parada = {
  id: string; maquinaId: string; ordemProducaoId: string | null;
  motivo: string; observacoes: string | null; observacoesEncerramento: string | null;
  iniciadoEm: string; encerradoEm: string | null;
  maquina: { codigo: string; nome: string };
  ordemProducao: { numero: string } | null;
  iniciadoPor: { nome: string };
  encerradoPor: { nome: string } | null;
};
type Props = { token: string; onSessaoExpirada: () => void };
const API = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/+$/, '');
const MOTIVOS = ['Manutenção', 'Falta de material', 'Ajuste de máquina', 'Troca de ferramenta', 'Falta de energia', 'Problema de qualidade', 'Outro'];

function duracao(inicio: string, fim: string | null, agora: number) {
  const minutos = Math.max(0, Math.floor(((fim ? new Date(fim).getTime() : agora) - new Date(inicio).getTime()) / 60000));
  return `${Math.floor(minutos / 60)}h ${String(minutos % 60).padStart(2, '0')}min`;
}
function formatoData(data: string) { return new Date(data).toLocaleString('pt-BR'); }

export default function ParadasProducao({ token, onSessaoExpirada }: Props) {
  const [paradas, setParadas] = useState<Parada[]>([]);
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [ordens, setOrdens] = useState<Ordem[]>([]);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [modalNovo, setModalNovo] = useState(false);
  const [encerrar, setEncerrar] = useState<Parada | null>(null);
  const [maquinaId, setMaquinaId] = useState('');
  const [ordemProducaoId, setOrdemProducaoId] = useState('');
  const [motivo, setMotivo] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [observacoesFim, setObservacoesFim] = useState('');
  const [busca, setBusca] = useState('');
  const [situacao, setSituacao] = useState('TODAS');
  const [agora, setAgora] = useState(Date.now());

  const req = useCallback(async <T,>(caminho: string, options?: RequestInit): Promise<T> => {
    const resposta = await fetch(`${API}${caminho}`, {
      ...options,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...options?.headers },
    });
    if (resposta.status === 401) { onSessaoExpirada(); throw new Error('Sessão expirada. Faça login novamente.'); }
    if (!resposta.ok) {
      const respostaErro: unknown = await resposta.json().catch(() => null);
      const msg = respostaErro && typeof respostaErro === 'object' && 'message' in respostaErro
        ? (respostaErro as { message: unknown }).message : null;
      throw new Error(Array.isArray(msg) ? msg.join(', ') : typeof msg === 'string' ? msg : `Erro HTTP ${resposta.status}`);
    }
    return resposta.json() as Promise<T>;
  }, [token, onSessaoExpirada]);

  const carregar = useCallback(async (silencioso = false) => {
    if (!silencioso) setCarregando(true);
    try {
      const [p, m, o] = await Promise.all([
        req<Parada[]>('/paradas'), req<Maquina[]>('/maquinas'), req<Ordem[]>('/ordens-producao'),
      ]);
      setParadas(p); setMaquinas(m); setOrdens(o); setErro('');
    } catch (e) { setErro(e instanceof Error ? e.message : 'Não foi possível carregar as paradas.'); }
    finally { if (!silencioso) setCarregando(false); }
  }, [req]);

  useEffect(() => {
    void carregar();
    const intervalo = window.setInterval(() => { setAgora(Date.now()); void carregar(true); }, 30000);
    return () => window.clearInterval(intervalo);
  }, [carregar]);

  const filtradas = useMemo(() => paradas.filter(p => {
    if (situacao === 'ABERTA' && p.encerradoEm) return false;
    if (situacao === 'ENCERRADA' && !p.encerradoEm) return false;
    const texto = `${p.maquina.nome} ${p.maquina.codigo} ${p.motivo} ${p.ordemProducao?.numero ?? ''} ${p.iniciadoPor.nome}`.toLowerCase();
    return texto.includes(busca.trim().toLowerCase());
  }), [paradas, busca, situacao]);
  const abertas = filtradas.filter(p => !p.encerradoEm).length;
  const tempoMin = filtradas.reduce((s, p) => s + Math.max(0, Math.floor(((p.encerradoEm ? new Date(p.encerradoEm).getTime() : agora) - new Date(p.iniciadoEm).getTime()) / 60000)), 0);

  async function iniciar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (salvando) return;
    setSalvando(true); setErro(''); setSucesso('');
    try {
      await req('/paradas', { method: 'POST', body: JSON.stringify({ maquinaId, ordemProducaoId: ordemProducaoId || undefined, motivo, observacoes: observacoes || undefined }) });
      setModalNovo(false); setMaquinaId(''); setOrdemProducaoId(''); setMotivo(''); setObservacoes('');
      setSucesso('Parada iniciada e registrada com sucesso.');
      await carregar();
    } catch (e) { setErro(e instanceof Error ? e.message : 'Falha ao iniciar parada.'); }
    finally { setSalvando(false); }
  }
  async function finalizar() {
    if (!encerrar || salvando) return;
    setSalvando(true); setErro(''); setSucesso('');
    try {
      await req(`/paradas/${encerrar.id}/encerrar`, { method: 'PATCH', body: JSON.stringify({ observacoesEncerramento: observacoesFim || undefined }) });
      setEncerrar(null); setObservacoesFim(''); setSucesso('Parada encerrada com sucesso.');
      await carregar();
    } catch (e) { setErro(e instanceof Error ? e.message : 'Falha ao encerrar parada.'); }
    finally { setSalvando(false); }
  }

  return <div className="paradas-page">
    <div className="paradas-heading"><div><p className="paradas-eyebrow">PRODSYNC ERP / GESTÃO</p><h1>Controle de paradas</h1><p>Acompanhe paradas de máquinas e seus motivos.</p></div>
      <button className="paradas-primary" onClick={() => { setErro(''); setModalNovo(true); }}><Plus size={18}/> Nova parada</button></div>
    <div className="paradas-stats">
      <section><span>Paradas exibidas</span><strong>{filtradas.length}</strong></section>
      <section><span>Em aberto</span><strong>{abertas}</strong></section>
      <section><span>Tempo acumulado*</span><strong>{Math.floor(tempoMin / 60)}h {String(tempoMin % 60).padStart(2, '0')}min</strong></section>
    </div>
    <p className="paradas-help">* Inclui o tempo decorrido das paradas ainda abertas; limitado aos 500 registros mais recentes retornados pela API.</p>
    {erro && <div className="paradas-alert error" role="alert">{erro}</div>}
    {sucesso && <div className="paradas-alert success" role="status">{sucesso}</div>}
    <section className="paradas-panel">
      <div className="paradas-toolbar"><input aria-label="Pesquisar paradas" placeholder="Pesquisar máquina, motivo, OP..." value={busca} onChange={e => setBusca(e.target.value)}/>
        <select aria-label="Filtrar por situação" value={situacao} onChange={e => setSituacao(e.target.value)}><option value="TODAS">Todas</option><option value="ABERTA">Em aberto</option><option value="ENCERRADA">Encerradas</option></select>
        <button className="paradas-neutral" disabled={carregando} onClick={() => void carregar()}><RefreshCw size={17}/> Atualizar</button></div>
      {carregando ? <p>Carregando paradas...</p> : filtradas.length === 0 ? <div className="paradas-empty"><PauseCircle size={34}/><p>Nenhuma parada encontrada.</p></div> :
        <div className="paradas-tablewrap"><table><thead><tr><th>Máquina</th><th>OP</th><th>Motivo</th><th>Início</th><th>Duração</th><th>Situação</th><th>Responsável</th><th>Ação</th></tr></thead><tbody>
        {filtradas.map(p => <tr key={p.id}><td><b>{p.maquina.nome}</b><small>{p.maquina.codigo}</small></td><td>{p.ordemProducao?.numero ?? '—'}</td><td>{p.motivo}</td><td>{formatoData(p.iniciadoEm)}</td><td>{duracao(p.iniciadoEm, p.encerradoEm, agora)}</td>
          <td><span className={`paradas-badge ${p.encerradoEm ? 'closed' : 'open'}`}>{p.encerradoEm ? 'Encerrada' : 'Em aberto'}</span></td><td>{p.iniciadoPor.nome}{p.encerradoPor && <small>Encerrada por: {p.encerradoPor.nome}</small>}</td>
          <td>{!p.encerradoEm ? <button className="paradas-end" onClick={() => { setErro(''); setObservacoesFim(''); setEncerrar(p); }}><CheckCircle2 size={15}/> Encerrar</button> : <span className="paradas-muted">—</span>}</td></tr>)}</tbody></table></div>}
    </section>
    {modalNovo && <div className="paradas-overlay" onMouseDown={e => { if (e.currentTarget === e.target && !salvando) setModalNovo(false); }}><div className="paradas-dialog" role="dialog" aria-modal="true" aria-label="Iniciar parada"><div className="paradas-dialoghead"><div><h2>Registrar nova parada</h2><p>Informe a máquina e o motivo.</p></div><button aria-label="Fechar" disabled={salvando} onClick={() => setModalNovo(false)}><X size={20}/></button></div>
      <form onSubmit={e => void iniciar(e)} className="paradas-form"><label>Máquina <select required value={maquinaId} onChange={e => setMaquinaId(e.target.value)}><option value="">Selecione</option>{maquinas.filter(m => m.situacao !== 'INATIVA').map(m => <option key={m.id} value={m.id}>{m.codigo} — {m.nome}</option>)}</select></label>
        <label>OP (opcional) <select value={ordemProducaoId} onChange={e => setOrdemProducaoId(e.target.value)}><option value="">Sem vínculo com OP</option>{ordens.map(o => <option key={o.id} value={o.id}>{o.numero}</option>)}</select></label>
        <label>Motivo <select required value={motivo} onChange={e => setMotivo(e.target.value)}><option value="">Selecione</option>{MOTIVOS.map(m => <option key={m} value={m}>{m}</option>)}</select></label>
        <label>Observações (opcional) <textarea rows={3} maxLength={500} value={observacoes} onChange={e => setObservacoes(e.target.value)}/></label>
        <div className="paradas-actions"><button type="button" disabled={salvando} onClick={() => setModalNovo(false)}>Cancelar</button><button className="paradas-primary" type="submit" disabled={salvando}><AlertTriangle size={17}/>{salvando ? 'Registrando...' : 'Iniciar parada'}</button></div>
      </form></div></div>}
    {encerrar && <div className="paradas-overlay"><div className="paradas-dialog" role="dialog" aria-modal="true" aria-label="Confirmar encerramento"><div className="paradas-dialoghead"><div><h2>Encerrar parada?</h2><p>{encerrar.maquina.nome} — {encerrar.motivo}</p></div><button aria-label="Fechar" disabled={salvando} onClick={() => setEncerrar(null)}><X size={20}/></button></div>
      <p className="paradas-confirm"><Clock3 size={19}/> A duração será calculada automaticamente até o momento do encerramento.</p>
      <label className="paradas-form">Observações de encerramento (opcional) <textarea rows={3} maxLength={500} value={observacoesFim} onChange={e => setObservacoesFim(e.target.value)}/></label>
      <div className="paradas-actions"><button disabled={salvando} onClick={() => setEncerrar(null)}>Cancelar</button><button className="paradas-complete" disabled={salvando} onClick={() => void finalizar()}>{salvando ? 'Encerrando...' : 'Sim, encerrar parada'}</button></div></div></div>}
  </div>;
}
