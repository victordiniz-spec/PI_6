import { useEffect, useState } from 'react';
import { ArrowRight, ClipboardList, Factory, Package, UserRoundPlus, Users } from 'lucide-react';
import { api, type Usuario } from '../services/api';

type Props = { token: string; usuario: Usuario; onCadastro: () => void; onSessaoExpirada: () => void };

export default function Dashboard({ token, usuario, onCadastro, onSessaoExpirada }: Props) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [erro, setErro] = useState('');
  const admin = usuario.perfil === 'ADMIN';
  useEffect(() => {
    if (!admin) return;
    let ativo = true;
    api.listarUsuarios(token).then(lista => { if (ativo) setUsuarios(lista); }).catch(err => {
      if (!ativo) return;
      if (err && typeof err === 'object' && 'status' in err && err.status === 401) { onSessaoExpirada(); return; }
      setErro(err instanceof Error ? err.message : 'Erro ao carregar usuários.');
    });
    return () => { ativo = false; };
  }, [token, admin, onSessaoExpirada]);

  return <div className="page-content">
    <div className="page-heading"><div><span className="eyebrow">VISÃO GERAL</span><h1>Olá, {usuario.nome.split(' ')[0]}!</h1><p className="muted">Bem-vindo ao painel administrativo do PRODSYNC ERP.</p></div><span className="status-pill">Ambiente de desenvolvimento</span></div>
    <div className="stats-grid"><div className="stat"><Users size={24}/><span>Usuários cadastrados</span><strong>{admin ? usuarios.length : '—'}</strong><small>{admin ? 'Dados reais do PostgreSQL' : 'Visualização restrita'}</small></div><div className="stat"><Package size={24}/><span>Produtos</span><strong>—</strong><small>Módulo em desenvolvimento</small></div><div className="stat"><ClipboardList size={24}/><span>Ordens de produção</span><strong>—</strong><small>Integração em desenvolvimento</small></div><div className="stat"><Factory size={24}/><span>Máquinas</span><strong>—</strong><small>Módulo em desenvolvimento</small></div></div>
    <section className="panel"><div className="panel-header"><div><h2>Gestão de usuários</h2><p className="muted">Controle os acessos ao PRODSYNC ERP.</p></div>{admin && <button className="button button-primary" onClick={onCadastro}><UserRoundPlus size={17}/> Novo usuário</button>}</div>
      {!admin ? <p className="muted">Seu perfil não tem permissão para consultar ou cadastrar usuários.</p> : <>{erro && <div className="alert alert-error">{erro}</div>}<div className="table-wrap"><table><thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Situação</th></tr></thead><tbody>{usuarios.map(u=><tr key={u.id}><td><strong>{u.nome}</strong></td><td>{u.email}</td><td><span className="profile-pill">{u.perfil}</span></td><td><span className="active-dot"/> {u.ativo ? 'Ativo' : 'Inativo'}</td></tr>)}</tbody></table>{usuarios.length === 0 && !erro && <p className="muted empty-state">Nenhum usuário carregado ainda.</p>}</div></>}
    </section>
    <section className="panel next-panel"><div><h2>Próximos módulos</h2><p className="muted">Cadastro de produtos, máquinas e ordens de produção, integrado ao aplicativo mobile.</p></div><ArrowRight size={24}/></section>
  </div>;
}
