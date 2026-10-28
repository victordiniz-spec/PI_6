
import { useCallback, useState } from "react";

import {
  Factory,
  LayoutDashboard,
  LogOut,
  UserRoundPlus,
  Package,
  ClipboardList,
} from "lucide-react";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Cadastro from "./pages/Cadastro";
import Produtos from "./pages/Produtos";
import OrdensProducao from "./pages/OrdensProducao";

import type { LoginResponse } from "./services/api";

import "./App.css";

// ==========================================
// TELAS DO PRODSYNC ERP
// ==========================================

type Tela =
  | "dashboard"
  | "cadastro"
  | "produtos"
  | "ordens-producao";

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export default function App() {
  // Token mantido apenas em memória.
  // Ao atualizar a página, o login é necessário novamente.
  const [session, setSession] = useState<LoginResponse | null>(
    null
  );

  const [tela, setTela] = useState<Tela>("dashboard");

  const [refreshKey, setRefreshKey] = useState(0);

  // ==========================================
  // ENCERRAR SESSÃO
  // ==========================================

  const logout = useCallback(() => {
    setSession(null);
    setTela("dashboard");
  }, []);

  // ==========================================
  // LOGIN
  // ==========================================

  if (!session) {
    return (
      <Login
        onLogin={(dados) => {
          setSession(dados);
          setTela("dashboard");
        }}
      />
    );
  }

  const isAdmin = session.usuario.perfil === "ADMIN";

  // ==========================================
  // NAVEGAÇÃO
  // ==========================================

  function abrirTela(novaTela: Tela) {
    setTela(novaTela);
  }

  // ==========================================
  // INTERFACE DO ERP
  // ==========================================

  return (
    <div className="app-layout">
      {/* MENU LATERAL */}
      <aside className="sidebar">
        {/* LOGO E IDENTIDADE */}
        <div className="brand brand-light">
          <span className="brand-mark">
            <Factory size={24} />
          </span>

          <span>
            <strong>PRODSYNC</strong>
            <small>ERP • JM FORROS</small>
          </span>
        </div>

        <p className="nav-caption">
          MENU PRINCIPAL
        </p>

        {/* MENU DE NAVEGAÇÃO */}
        <nav aria-label="Navegação principal">
          {/* DASHBOARD */}
          <button
            type="button"
            className={`nav-item ${
              tela === "dashboard" ? "active" : ""
            }`}
            onClick={() => abrirTela("dashboard")}
          >
            <LayoutDashboard size={19} />
            Visão geral
          </button>

          {/* CADASTRO DE USUÁRIOS */}
          {isAdmin && (
            <button
              type="button"
              className={`nav-item ${
                tela === "cadastro" ? "active" : ""
              }`}
              onClick={() => abrirTela("cadastro")}
            >
              <UserRoundPlus size={19} />
              Cadastrar usuário
            </button>
          )}

          {/* PRODUTOS */}
          {isAdmin && (
            <button
              type="button"
              className={`nav-item ${
                tela === "produtos" ? "active" : ""
              }`}
              onClick={() => abrirTela("produtos")}
            >
              <Package size={19} />
              Produtos
            </button>
          )}

          {/* ORDENS DE PRODUÇÃO */}
          {isAdmin && (
            <button
              type="button"
              className={`nav-item ${
                tela === "ordens-producao"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                abrirTela("ordens-producao")
              }
            >
              <ClipboardList size={19} />
              Ordens de Produção
            </button>
          )}
        </nav>

        {/* RODAPÉ DO MENU */}
        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <div className="user-avatar">
              {session.usuario.nome
                .charAt(0)
                .toUpperCase()}
            </div>

            <div className="sidebar-user-meta">
              <strong>
                {session.usuario.nome}
              </strong>

              <span>
                {session.usuario.perfil}
              </span>
            </div>
          </div>

          {/* LOGOUT */}
          <button
            type="button"
            className="nav-item"
            onClick={logout}
          >
            <LogOut size={19} />
            Sair
          </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <div className="main-column">
        {/* BARRA SUPERIOR */}
        <header className="topbar">
          <span>
            PRODSYNC / PAINEL DE GESTÃO
          </span>

          <span className="topbar-profile">
            {session.usuario.perfil}
          </span>
        </header>

        {/* CONTEÚDO DINÂMICO */}
        <main
          key={
            tela === "dashboard"
              ? refreshKey
              : undefined
          }
        >
          {tela === "produtos" && isAdmin ? (
            <Produtos
              token={session.accessToken}
              onSessaoExpirada={logout}
            />
          ) : tela === "ordens-producao" && isAdmin ? (
            <OrdensProducao
              token={session.accessToken}
              perfil={session.usuario.perfil}
            />
          ) : tela === "cadastro" && isAdmin ? (
            <Cadastro
              token={session.accessToken}
              onVoltar={() =>
                abrirTela("dashboard")
              }
              onCriado={() =>
                setRefreshKey((valor) => valor + 1)
              }
              onSessaoExpirada={logout}
            />
          ) : (
            <Dashboard
              token={session.accessToken}
              usuario={session.usuario}
              onCadastro={() =>
                abrirTela("cadastro")
              }
              onSessaoExpirada={logout}
            />
          )}
        </main>
      </div>
    </div>
  );
}
