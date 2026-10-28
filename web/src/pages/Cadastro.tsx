import { useState, type FormEvent } from 'react';
import { ArrowLeft, CheckCircle2, UserPlus } from 'lucide-react';
import { api, type Perfil } from '../services/api';

type Props = { token: string; onVoltar: () => void; onCriado: () => void; onSessaoExpirada: () => void };

export default function Cadastro({ token, onVoltar, onCriado, onSessaoExpirada }: Props) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [perfil, setPerfil] = useState<Perfil>('OPERADOR');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setErro(''); setSucesso(false);
    if (senha !== confirmacao) { setErro('As senhas não coincidem.'); return; }
    if (senha.length < 12) { setErro('A senha precisa ter pelo menos 12 caracteres.'); return; }
    setLoading(true);
    try {
      await api.criarUsuario(token, { nome: nome.trim(), email: email.trim(), senha, perfil });
      setSenha(''); setConfirmacao(''); setSucesso(true); onCriado();
    } catch (err) {
      if (err && typeof err === 'object' && 'status' in err && err.status === 401) { onSessaoExpirada(); return; }
      setErro(err instanceof Error ? err.message : 'Não foi possível cadastrar o usuário.');
    } finally { setLoading(false); }
  }

  return <div className="page-content">
    <button className="text-button" onClick={onVoltar}><ArrowLeft size={17}/> Voltar ao painel</button>
    <div className="page-heading"><div><span className="eyebrow">ADMINISTRAÇÃO / USUÁRIOS</span><h1>Cadastrar usuário</h1><p className="muted">Crie acessos para administradores, supervisores e operadores.</p></div></div>
    <section className="panel form-panel">
      <div className="panel-title"><UserPlus size={22}/><div><h2>Dados do novo usuário</h2><p className="muted">A senha será armazenada de forma protegida no servidor.</p></div></div>
      <form onSubmit={enviar} className="form-stack">
        <label htmlFor="nome">Nome completo</label><input id="nome" value={nome} onChange={e=>setNome(e.target.value)} minLength={2} maxLength={120} placeholder="Ex.: Maria Oliveira" required/>
        <label htmlFor="novo-email">E-mail</label><input id="novo-email" type="email" value={email} onChange={e=>setEmail(e.target.value)} maxLength={254} placeholder="usuario@empresa.com" required/>
        <label htmlFor="perfil">Perfil de acesso</label>
        <select id="perfil" value={perfil} onChange={e=>setPerfil(e.target.value as Perfil)}><option value="OPERADOR">Operador — acesso operacional</option><option value="SUPERVISOR">Supervisor — acompanhamento</option><option value="ADMIN">Administrador — acesso administrativo</option></select>
        <div className="grid-two"><div className="form-stack"><label htmlFor="nova-senha">Senha provisória (mínimo de 12 caracteres)</label><input id="nova-senha" type="password" autoComplete="new-password" value={senha} onChange={e=>setSenha(e.target.value)} minLength={12} required/></div><div className="form-stack"><label htmlFor="confirma-senha">Confirmar senha</label><input id="confirma-senha" type="password" autoComplete="new-password" value={confirmacao} onChange={e=>setConfirmacao(e.target.value)} minLength={12} required/></div></div>
        {erro && <div className="alert alert-error" role="alert">{erro}</div>}
        {sucesso && <div className="alert alert-success" role="status"><CheckCircle2 size={18}/> Usuário cadastrado! O usuário já pode acessar o sistema com as credenciais definidas.</div>}
        <div className="form-actions"><button type="button" className="button button-outline" onClick={onVoltar}>Cancelar</button><button type="submit" className="button button-primary" disabled={loading}><UserPlus size={18}/> {loading ? 'Salvando...' : 'Cadastrar usuário'}</button></div>
      </form>
    </section>
  </div>;
}
