
import { useCallback, useState } from "react";

import {
  Factory,
  LayoutDashboard,
  LogOut,
  Users,
  Package,
  ClipboardList,
  Cog,
  TabletSmartphone,
  History,
  ChartColumnIncreasing,
  Clock3,
} from "lucide-react";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Produtos from "./pages/Produtos";
import OrdensProducao from "./pages/OrdensProducao";
import Maquinas from "./pages/Maquinas";
import Dispositivos from "./pages/Dispositivos";
import Usuarios from "./pages/Usuarios";
import HistoricoProducao from "./pages/HistoricoProducao";
import Relatorios from "./pages/Relatorios";
import ParadasProducao from "./pages/ParadasProducao";

import type { LoginResponse } from "./services/api";

import "./App.css";

// ==========================================
// TELAS DO SISTEMA
// ==========================================

type Tela =
  | "dashboard"
  | "usuarios"
  | "produtos"
  | "ordens-producao"
  | "maquinas"
  | "dispositivos"
  | "historico-producao"
  | "relatorios"
  | "paradas";

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export default function App() {
  const [session, setSession] =
    useState<LoginResponse | null>(null);

  const [tela, setTela] =
    useState<Tela>("dashboard");

  const logout = useCallback(() => {
    setSession(null);
    setTela("dashboard");
  }, []);

  // ========================================
  // LOGIN
  // ========================================

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

  // ========================================
  // PERMISSÕES
  // ========================================

  const isAdmin =
    session.usuario.perfil === "ADMIN";

  const podeVerRelatorios =
    isAdmin ||
    session.usuario.perfil === "SUPERVISOR";

  const podeVerHistorico = isAdmin;

  function abrirTela(novaTela: Tela) {
    setTela(novaTela);
  }

  const itemAtivo = (nome: Tela) =>
    `nav-item ${tela === nome ? "active" : ""}`;

  // ========================================
  // INTERFACE PRINCIPAL
  // ========================================

  return (
    <div className="app-layout">

      {/* MENU LATERAL */}
      <aside className="sidebar">

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

        <nav aria-label="Navegação principal">

          {/* DASHBOARD */}
          <button
            type="button"
            className={itemAtivo("dashboard")}
            onClick={() => abrirTela("dashboard")}
          >
            <LayoutDashboard size={19} />
            Visão geral
          </button>

          {/* MENUS ADMINISTRATIVOS */}
          {isAdmin && (
            <>
              <button
                type="button"
                className={itemAtivo("usuarios")}
                onClick={() => abrirTela("usuarios")}
              >
                <Users size={19} />
                Gestão de usuários
              </button>

              <button
                type="button"
                className={itemAtivo("produtos")}
                onClick={() => abrirTela("produtos")}
              >
                <Package size={19} />
                Produtos
              </button>

              <button
                type="button"
                className={itemAtivo("ordens-producao")}
                onClick={() =>
                  abrirTela("ordens-producao")
                }
              >
                <ClipboardList size={19} />
                Ordens de Produção
              </button>

              <button
                type="button"
                className={itemAtivo("maquinas")}
                onClick={() => abrirTela("maquinas")}
              >
                <Cog size={19} />
                Máquinas
              </button>

              <button
                type="button"
                className={itemAtivo("dispositivos")}
                onClick={() =>
                  abrirTela("dispositivos")
                }
              >
                <TabletSmartphone size={19} />
                Dispositivos
              </button>
            </>
          )}

          {/* HISTÓRICO DE PRODUÇÃO */}
          {podeVerHistorico && (
            <button
              type="button"
              className={itemAtivo("historico-producao")}
              onClick={() =>
                abrirTela("historico-producao")
              }
            >
              <History size={19} />
              Histórico de produção
            </button>
          )}

          {/* RELATÓRIOS */}
          {podeVerRelatorios && (
            <button
              type="button"
              className={itemAtivo("relatorios")}
              onClick={() =>
                abrirTela("relatorios")
              }
            >
              <ChartColumnIncreasing size={19} />
              Relatórios
            </button>
          )}

          {/* CONTROLE DE PARADAS */}
          {podeVerRelatorios && (
            <button
              type="button"
              className={itemAtivo("paradas")}
              onClick={() =>
                abrirTela("paradas")
              }
            >
              <Clock3 size={19} />
              Controle de paradas
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

      {/* CONTEÚDO PRINCIPAL */}
      <div className="main-column">

        <header className="topbar">
          <span>
            PRODSYNC / PAINEL DE GESTÃO
          </span>

          <span className="topbar-profile">
            {session.usuario.perfil}
          </span>
        </header>

        <main>

          {tela === "usuarios" && isAdmin ? (
            <Usuarios
              token={session.accessToken}
              onSessaoExpirada={logout}
            />

          ) : tela === "dispositivos" && isAdmin ? (
            <Dispositivos
              token={session.accessToken}
              onSessaoExpirada={logout}
            />

          ) : tela === "maquinas" && isAdmin ? (
            <Maquinas
              token={session.accessToken}
              onSessaoExpirada={logout}
            />

          ) : tela === "produtos" && isAdmin ? (
            <Produtos
              token={session.accessToken}
              onSessaoExpirada={logout}
            />

          ) : tela === "ordens-producao" && isAdmin ? (
            <OrdensProducao
              token={session.accessToken}
              perfil={session.usuario.perfil}
            />

          ) : tela === "historico-producao" &&
              podeVerHistorico ? (
            <HistoricoProducao
              token={session.accessToken}
              onSessaoExpirada={logout}
            />

          ) : tela === "relatorios" &&
              podeVerRelatorios ? (
            <Relatorios
              token={session.accessToken}
              onSessaoExpirada={logout}
            />

          ) : tela === "paradas" &&
              podeVerRelatorios ? (
            <ParadasProducao
              token={session.accessToken}
              onSessaoExpirada={logout}
            />

          ) : (
            <Dashboard
              token={session.accessToken}
              usuario={session.usuario}
              onCadastro={() =>
                abrirTela("usuarios")
              }
              onSessaoExpirada={logout}
            />
          )}

        </main>
      </div>
    </div>
  );
}
