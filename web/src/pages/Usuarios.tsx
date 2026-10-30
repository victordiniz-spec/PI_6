import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { AlertTriangle, Check, CheckCircle2, Pencil, Plus, RefreshCw, Search, UserCheck, UserX, Users, X } from 'lucide-react';
import './Usuarios.css';

type Perfil = 'ADMIN' | 'SUPERVISOR' | 'OPERADOR';
type Usuario = { id: string; nome: string; email: string; perfil: Perfil; ativo: boolean; criadoEm: string };
type Props = { token: string; onSessaoExpirada: () => void };
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/+$/, '');

async function request<T>(token: string, path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...init.headers },
  });
  if (!res.ok) {
    let message = `Erro ${res.status}`;
    try {
      const data: { message?: string | string[] } = await res.json();
      if (data.message) message = Array.isArray(data.message) ? data.message.join(', ') : data.message;
    } catch { /* servidor sem JSON */ }
    throw Object.assign(new Error(message), { status: res.status });
  }
  return res.json() as Promise<T>;
}

export default function Usuarios({ token, onSessaoExpirada }: Props) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<'TODOS' | Perfil>('TODOS');
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [formAberto, setFormAberto] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [perfil, setPerfil] = useState<Perfil>('OPERADOR');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [alterandoId, setAlterandoId] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState<Usuario | null>(null);

  const tratarErro = useCallback((e: unknown) => {
    if (e && typeof e === 'object' && 'status' in e && e.status === 401) {
      onSessaoExpirada(); return;
    }
    setErro(e instanceof Error ? e.message : 'Não foi possível completar a operação.');
  }, [onSessaoExpirada]);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try { setUsuarios(await request<Usuario[]>(token, '/usuarios')); }
    catch (e) { tratarErro(e); }
    finally { setCarregando(false); }
  }, [token, tratarErro]);

  useEffect(() => { void carregar(); }, [carregar]);

  const filtrados = useMemo(() => usuarios.filter(u => {
    const pesquisa = busca.trim().toLocaleLowerCase('pt-BR');
    return (filtro === 'TODOS' || u.perfil === filtro) &&
      (`${u.nome} ${u.email}`.toLocaleLowerCase('pt-BR').includes(pesquisa));
  }), [usuarios, busca, filtro]);

  function novo() {
    setEditando(null); setNome(''); setEmail(''); setPerfil('OPERADOR');
    setSenha(''); setConfirmacao(''); setErro(''); setSucesso(''); setFormAberto(true);
  }
  function editar(u: Usuario) {
    setEditando(u.id); setNome(u.nome); setEmail(u.email); setPerfil(u.perfil);
    setSenha(''); setConfirmacao(''); setErro(''); setSucesso(''); setFormAberto(true);
  }
  async function salvar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setErro(''); setSucesso('');
    if (senha !== confirmacao) { setErro('As senhas não coincidem.'); return; }
    if ((!editando || senha.length > 0) && (senha.length < 12 || senha.length > 128)) {
      setErro('A senha deve conter entre 12 e 128 caracteres.'); return;
    }
    setSalvando(true);
    try {
      const body = editando
        ? { nome: nome.trim(), email: email.trim(), perfil, ...(senha ? { senha } : {}) }
        : { nome: nome.trim(), email: email.trim(), perfil, senha };
      await request<Usuario>(token, editando ? `/usuarios/${editando}` : '/usuarios', {
        method: editando ? 'PATCH' : 'POST', body: JSON.stringify(body),
      });
      setFormAberto(false);
      setSenha(''); setConfirmacao('');
      setSucesso(editando ? 'Usuário atualizado com sucesso.' : 'Usuário cadastrado com sucesso.');
      await carregar();
    } catch (e) { tratarErro(e); }
    finally { setSalvando(false); }
  }
  async function alterarAtivo(u: Usuario) {
    setConfirmando(null);
    setAlterandoId(u.id); setErro(''); setSucesso('');
    try {
      await request<Usuario>(token, `/usuarios/${u.id}/situacao`, {
        method: 'PATCH', body: JSON.stringify({ ativo: !u.ativo }),
      });
      setSucesso(`Usuário ${u.ativo ? 'desativado' : 'ativado'} com sucesso.`);
      await carregar();
    } catch (e) { tratarErro(e); }
    finally { setAlterandoId(null); }
  }

  return (
    <div className="page-content usuarios-page">
      <div className="page-heading usuarios-head">
        <div><span className="eyebrow">ADMINISTRAÇÃO / ACESSOS</span><h1>Gestão de usuários</h1>
          <p className="muted">Gerencie administradores, supervisores e operadores.</p></div>
        <button className="button button-primary" onClick={novo} type="button"><Plus size={18}/> Novo usuário</button>
      </div>
      <div className="usuarios-stats">
        <div className="panel"><strong>{usuarios.length}</strong><span>Total cadastrado</span></div>
        <div className="panel"><strong>{usuarios.filter(u=>u.ativo).length}</strong><span>Ativos</span></div>
        <div className="panel"><strong>{usuarios.filter(u=>!u.ativo).length}</strong><span>Inativos</span></div>
      </div>
      {sucesso && <div className="alert alert-success" role="status"><Check size={18}/>{sucesso}</div>}
      {erro && <div className="alert alert-error" role="alert">{erro}</div>}
      <section className="panel usuarios-panel">
        <div className="usuarios-tools">
          <div className="usuarios-search"><Search size={18}/><input aria-label="Pesquisar usuário" placeholder="Buscar por nome ou e-mail..." value={busca} onChange={e=>setBusca(e.target.value)}/></div>
          <select aria-label="Filtrar por perfil" value={filtro} onChange={e=>setFiltro(e.target.value as typeof filtro)}>
            <option value="TODOS">Todos os perfis</option><option value="ADMIN">Administrador</option><option value="SUPERVISOR">Supervisor</option><option value="OPERADOR">Operador</option>
          </select>
          <button className="button button-outline" type="button" onClick={() => void carregar()} disabled={carregando}><RefreshCw size={17}/> Atualizar</button>
        </div>
        {carregando ? <p className="muted">Carregando usuários...</p> : filtrados.length === 0 ?
          <div className="usuarios-empty"><Users size={28}/><p>Nenhum usuário encontrado.</p></div> :
          <div className="usuarios-table-scroll"><table className="usuarios-table"><thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Situação</th><th>Ações</th></tr></thead><tbody>
            {filtrados.map(u => <tr key={u.id}><td><strong>{u.nome}</strong></td><td>{u.email}</td><td>{u.perfil}</td>
              <td><span className={`usuarios-status ${u.ativo ? 'is-active' : 'is-inactive'}`}>{u.ativo ? 'Ativo' : 'Inativo'}</span></td>
              <td className="usuarios-actions"><button type="button" className="button button-outline" onClick={()=>editar(u)}><Pencil size={15}/> Editar</button>
                <button type="button" className={`usuarios-situacao-btn ${u.ativo ? "usuarios-btn-desativar" : "usuarios-btn-ativar"}`} disabled={alterandoId !== null} onClick={()=>setConfirmando(u)}>{u.ativo ? <><UserX size={15}/> Desativar</> : <><UserCheck size={15}/> Ativar</>}</button></td>
            </tr>)}</tbody></table></div>}
      </section>
      {confirmando && (
        <div
          className="usuarios-modal-backdrop"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !alterandoId) setConfirmando(null);
          }}
        >
          <section
            className="usuarios-confirmacao panel"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="usuarios-confirmacao-titulo"
            aria-describedby="usuarios-confirmacao-descricao"
          >
            <div className={`usuarios-confirmacao-icone ${confirmando.ativo ? "desativar" : "ativar"}`}>
              {confirmando.ativo ? <AlertTriangle size={28} /> : <CheckCircle2 size={28} />}
            </div>
            <h2 id="usuarios-confirmacao-titulo">
              {confirmando.ativo ? "Desativar usuário?" : "Ativar usuário?"}
            </h2>
            <p id="usuarios-confirmacao-descricao">
              {confirmando.ativo ? (
                <>O acesso de <strong>{confirmando.nome}</strong> será desativado. Essa pessoa não poderá realizar novos logins até ser reativada.</>
              ) : (
                <>O acesso de <strong>{confirmando.nome}</strong> será reativado. Essa pessoa poderá voltar a entrar no sistema com suas credenciais.</>
              )}
            </p>
            <div className="usuarios-confirmacao-acoes">
              <button
                type="button"
                className="button button-outline"
                onClick={() => setConfirmando(null)}
                disabled={alterandoId !== null}
                autoFocus
              >
                Cancelar
              </button>
              <button
                type="button"
                className={`usuarios-confirmacao-confirmar ${confirmando.ativo ? "desativar" : "ativar"}`}
                onClick={() => void alterarAtivo(confirmando)}
                disabled={alterandoId !== null}
              >
                {alterandoId ? "Salvando..." : confirmando.ativo ? <><UserX size={17}/> Sim, desativar</> : <><UserCheck size={17}/> Sim, ativar</>}
              </button>
            </div>
          </section>
        </div>
      )}
      {formAberto && <div className="usuarios-modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget && !salvando)setFormAberto(false)}}>
        <section className="usuarios-modal panel" role="dialog" aria-modal="true" aria-labelledby="usuarios-form-titulo">
          <div className="usuarios-modal-header"><h2 id="usuarios-form-titulo">{editando ? 'Editar usuário' : 'Cadastrar usuário'}</h2><button type="button" aria-label="Fechar" className="usuarios-close" onClick={()=>setFormAberto(false)} disabled={salvando}><X size={22}/></button></div>
          <form className="form-stack" onSubmit={e=>void salvar(e)}>
            <label htmlFor="user-nome">Nome completo</label><input id="user-nome" value={nome} onChange={e=>setNome(e.target.value)} minLength={2} maxLength={120} required />
            <label htmlFor="user-email">E-mail</label><input id="user-email" type="email" value={email} onChange={e=>setEmail(e.target.value)} maxLength={254} required />
            <label htmlFor="user-perfil">Perfil</label><select id="user-perfil" value={perfil} onChange={e=>setPerfil(e.target.value as Perfil)}><option value="OPERADOR">Operador</option><option value="SUPERVISOR">Supervisor</option><option value="ADMIN">Administrador</option></select>
            <label htmlFor="user-senha">{editando ? 'Nova senha (opcional)' : 'Senha provisória'}</label><input id="user-senha" type="password" autoComplete="new-password" value={senha} onChange={e=>setSenha(e.target.value)} minLength={12} maxLength={128} required={!editando} placeholder={editando ? 'Deixe em branco para manter a atual' : 'Mínimo de 12 caracteres'}/>
            <label htmlFor="user-confirma">Confirmar {editando ? 'nova senha' : 'senha'}</label><input id="user-confirma" type="password" autoComplete="new-password" value={confirmacao} onChange={e=>setConfirmacao(e.target.value)} required={!editando || !!senha}/>
            {erro && <div className="alert alert-error" role="alert">{erro}</div>}
            <div className="form-actions"><button className="button button-outline" type="button" disabled={salvando} onClick={()=>setFormAberto(false)}>Cancelar</button><button className="button button-primary" type="submit" disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar usuário'}</button></div>
          </form>
        </section>
      </div>}
    </div>
  );
}
