import { useCallback, useState } from 'react';
import { Factory, LayoutDashboard, LogOut, UserRoundPlus } from 'lucide-react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Cadastro from './pages/Cadastro';
import type { LoginResponse } from './services/api';
import './App.css';

type Tela = 'dashboard' | 'cadastro';
export default function App() {
  // Token apenas em memória: ao atualizar a página será necessário entrar novamente.
  const [session, setSession] = useState<LoginResponse | null>(null);
  const [tela, setTela] = useState<Tela>('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);
  const logout = useCallback(() => { setSession(null); setTela('dashboard'); }, []);
  if (!session) return <Login onLogin={s => { setSession(s); setTela('dashboard'); }} />;
  const isAdmin = session.usuario.perfil === 'ADMIN';
  return <div className="app-layout">
    <aside className="sidebar">
      <div className="brand brand-light"><span className="brand-mark"><Factory size={24}/></span><span><strong>PRODSYNC</strong><small>ERP • JM FORROS</small></span></div>
      <p className="nav-caption">MENU PRINCIPAL</p>
      <nav aria-label="Navegação principal"><button className={`nav-item ${tela === 'dashboard' ? 'active' : ''}`} onClick={()=>setTela('dashboard')}><LayoutDashboard size={19}/> Visão geral</button>{isAdmin && <button className={`nav-item ${tela === 'cadastro' ? 'active' : ''}`} onClick={()=>setTela('cadastro')}><UserRoundPlus size={19}/> Cadastrar usuário</button>}</nav>
      <div className="sidebar-bottom"><div className="sidebar-user"><div className="user-avatar">{session.usuario.nome.charAt(0).toUpperCase()}</div><div className="sidebar-user-meta"><strong>{session.usuario.nome}</strong><span>{session.usuario.perfil}</span></div></div><button className="nav-item" onClick={logout}><LogOut size={19}/> Sair</button></div>
    </aside>
    <div className="main-column"><header className="topbar"><span>PRODSYNC / PAINEL DE GESTÃO</span><span className="topbar-profile">{session.usuario.perfil}</span></header><main key={tela === 'dashboard' ? refreshKey : undefined}>{tela === 'cadastro' && isAdmin ? <Cadastro token={session.accessToken} onVoltar={()=>setTela('dashboard')} onCriado={()=>setRefreshKey(x=>x+1)} onSessaoExpirada={logout}/> : <Dashboard token={session.accessToken} usuario={session.usuario} onCadastro={()=>setTela('cadastro')} onSessaoExpirada={logout}/>}</main></div>
  </div>;
}
