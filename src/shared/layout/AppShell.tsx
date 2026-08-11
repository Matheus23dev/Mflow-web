import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  BarChart3,
  Bell,
  ChevronDown,
  CircleDollarSign,
  HandCoins,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";
import type { User } from "@/shared/types";
import { Avatar } from "@/shared/ui";

export type AppPage = "dashboard" | "customers" | "loans" | "collections" | "cash" | "reports";

const items: Array<{ id: AppPage; label: string; icon: typeof LayoutDashboard }> = [
  { id: "dashboard", label: "Visão geral", icon: LayoutDashboard },
  { id: "customers", label: "Clientes", icon: UsersRound },
  { id: "loans", label: "Empréstimos", icon: HandCoins },
  { id: "collections", label: "Cobranças", icon: WalletCards },
  { id: "cash", label: "Fluxo de caixa", icon: CircleDollarSign },
  { id: "reports", label: "Relatórios", icon: BarChart3 },
];

export function AppShell({ page, onNavigate, user, onLogout, mobileOpen, setMobileOpen, onSearch, children }: {
  page: AppPage;
  onNavigate: (page: AppPage) => void;
  user: User;
  onLogout: () => void;
  mobileOpen: boolean;
  setMobileOpen: (value: boolean) => void;
  onSearch: (query: string) => void;
  children: ReactNode;
}) {
  const [search, setSearch] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  const navigate = (next: AppPage) => {
    onNavigate(next);
    setMobileOpen(false);
  };

  return (
    <div className="app-shell">
      {mobileOpen ? <button className="sidebar-backdrop" aria-label="Fechar menu" onClick={() => setMobileOpen(false)} /> : null}
      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="brand-row">
          <div className="brand-mark"><span>M</span></div>
          <div className="brand-copy"><strong>MFlow</strong><span>Gestão financeira</span></div>
          <button className="icon-button sidebar-close" onClick={() => setMobileOpen(false)}><X size={19} /></button>
        </div>
        <nav className="side-nav" aria-label="Navegação principal">
          <p className="nav-label">Menu principal</p>
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} className={page === item.id ? "active" : ""} onClick={() => navigate(item.id)}>
                <Icon size={19} strokeWidth={1.9} />
                <span>{item.label}</span>
                {page === item.id ? <i /> : null}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-card">
          <span className="sidebar-card-kicker">Dica rápida</span>
          <strong>Mantenha as cobranças em dia</strong>
          <p>Revise os vencimentos da semana para antecipar seus recebimentos.</p>
          <button onClick={() => navigate("collections")}>Ver agenda</button>
        </div>
        <div className="sidebar-user">
          <Avatar name={user.name} />
          <div><strong>{user.name}</strong><span>{user.email}</span></div>
          <button className="icon-button" onClick={onLogout} aria-label="Sair"><LogOut size={18} /></button>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Abrir menu"><Menu size={21} /></button>
          <form className="global-search" onSubmit={(event) => { event.preventDefault(); if (search.trim()) onSearch(search.trim()); }}>
            <Search size={18} />
            <input ref={searchRef} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar clientes..." aria-label="Busca global" />
            <kbd>Ctrl K</kbd>
          </form>
          <div className="topbar-actions">
            <button className="icon-button notification-button" onClick={() => navigate("collections")} aria-label="Abrir cobranças"><Bell size={19} /><span /></button>
            <div className="profile-wrap">
              <button className="profile-button" onClick={() => setProfileOpen(!profileOpen)} aria-expanded={profileOpen}><Avatar name={user.name} size="sm" /><span>{user.name.split(" ")[0]}</span><ChevronDown size={15} /></button>
              {profileOpen ? <div className="profile-menu"><strong>{user.name}</strong><span>{user.email}</span><button onClick={onLogout}><LogOut size={15} /> Sair da conta</button></div> : null}
            </div>
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
