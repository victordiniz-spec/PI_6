import { useState, type FormEvent } from 'react';
import { ArrowRight, Eye, EyeOff, Factory, LockKeyhole, ShieldCheck } from 'lucide-react';
import { api, type LoginResponse } from '../services/api';

type Props = { onLogin: (session: LoginResponse) => void };

export default function Login({ onLogin }: Props) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  async function entrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro('');
    setLoading(true);
    try { onLogin(await api.login(email.trim(), senha)); }
    catch (err) { setErro(err instanceof Error ? err.message : 'Falha ao autenticar.'); }
    finally { setLoading(false); }
  }

  return (
    <main className="login-page">
      <section className="login-side" aria-label="Apresentação do sistema">
        <div className="brand brand-light"><span className="brand-mark"><Factory size={26} /></span><span><strong>PRODSYNC</strong><small>ERP • JM FORROS</small></span></div>
        <div className="login-side-content">
          <div className="side-kicker">GESTÃO INDUSTRIAL</div>
          <h1>Produção conectada.<br/><span>Gestão simplificada.</span></h1>
          <p>Gerencie ordens de produção, produtos e acessos em um único lugar. A integração com o aplicativo de chão de fábrica começa aqui.</p>
          <div className="side-feature"><ShieldCheck size={22} /><span>Controle de acesso por perfil</span></div>
          <div className="side-feature"><Factory size={22} /><span>Preparado para integração com o PRODSYNC Mobile</span></div>
        </div>
        <p className="side-footer">PRODSYNC ERP · Ambiente de desenvolvimento</p>
      </section>

      <section className="login-form-side">
        <div className="login-card">
          <div className="mobile-brand brand"><span className="brand-mark"><Factory size={25}/></span><span><strong>PRODSYNC</strong><small>ERP • JM FORROS</small></span></div>
          <div className="eyebrow"><LockKeyhole size={15}/> ACESSO SEGURO</div>
          <h2>Bem-vindo de volta</h2>
          <p className="muted form-intro">Entre com as credenciais cadastradas no PRODSYNC ERP.</p>
          <form onSubmit={entrar} className="form-stack">
            <label htmlFor="email">E-mail</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seuemail@empresa.com" autoComplete="username" required />
            <label htmlFor="senha">Senha</label>
            <div className="password-field">
              <input id="senha" type={mostrarSenha ? 'text' : 'password'} value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Digite sua senha" autoComplete="current-password" required />
              <button className="show-password" type="button" onClick={() => setMostrarSenha(!mostrarSenha)} aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}>{mostrarSenha ? <EyeOff size={19}/> : <Eye size={19}/>}</button>
            </div>
            {erro && <div className="alert alert-error" role="alert">{erro}</div>}
            <button className="button button-primary login-submit" type="submit" disabled={loading}>{loading ? 'Entrando...' : 'Entrar no sistema'} <ArrowRight size={18}/></button>
          </form>
          <p className="login-help">O cadastro de novos usuários é realizado pelo administrador após o login.</p>
        </div>
      </section>
    </main>
  );
}
