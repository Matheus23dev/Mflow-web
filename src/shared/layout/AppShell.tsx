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

const iconButtonClass = "icon-button size-10 shrink-0 place-items-center rounded-[10px] border-0 bg-transparent p-0 text-[#6f6b79] transition hover:bg-violet-50 hover:text-violet-600";

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

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileOpen, setMobileOpen]);

  const navigate = (next: AppPage) => {
    onNavigate(next);
    setMobileOpen(false);
    setProfileOpen(false);
  };

  return (
    <div className="app-shell flex min-h-screen min-w-0 max-w-full bg-[#f6f5f9] print:hidden">
      {mobileOpen ? <button className="sidebar-backdrop fixed inset-0 z-[29] block border-0 bg-[#16121d]/45 p-0 backdrop-blur-[2px] min-[861px]:hidden" aria-label="Fechar menu" onClick={() => setMobileOpen(false)} /> : null}
      <aside className={`sidebar fixed inset-y-0 left-0 z-30 flex w-[264px] flex-col overflow-y-auto bg-[#17151f] px-[18px] pb-[18px] pt-[25px] text-white shadow-[20px_0_45px_rgba(20,15,29,0.2)] transition-transform duration-200 min-[861px]:shadow-none max-[640px]:w-[min(84vw,300px)] max-[640px]:px-[15px] max-[640px]:pb-[calc(14px+env(safe-area-inset-bottom))] max-[640px]:pt-[max(18px,env(safe-area-inset-top))] ${mobileOpen ? "sidebar-open max-[860px]:translate-x-0" : "max-[860px]:-translate-x-full"}`}>
        <div className="brand-row flex items-center gap-[11px] px-2 pb-[27px] max-[640px]:pb-5">
          <div className="brand-mark grid size-[39px] shrink-0 -rotate-3 place-items-center rounded-xl bg-gradient-to-br from-[#9678ff] to-[#6540de] text-white shadow-[0_8px_20px_rgba(116,80,233,0.25)]"><span className="rotate-3 text-xl font-extrabold">M</span></div>
          <div className="brand-copy flex min-w-0 flex-col leading-[1.1]"><strong className="text-[19px] tracking-[-0.4px]">MFlow</strong><span className="mt-[5px] text-[10px] uppercase tracking-[1.25px] text-[#9994a8]">Gestão financeira</span></div>
          <button className={`${iconButtonClass} sidebar-close ml-auto hidden text-[#aaa4b6] max-[860px]:inline-grid`} onClick={() => setMobileOpen(false)} aria-label="Fechar menu"><X size={19} /></button>
        </div>
        <nav className="side-nav flex flex-col gap-[5px]" aria-label="Navegação principal">
          <p className="nav-label mx-3 mb-[9px] mt-0 text-[11px] font-bold uppercase tracking-[1.25px] text-[#777281]">Menu principal</p>
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} className={`relative flex min-h-11 w-full items-center gap-[13px] rounded-[10px] border-0 px-[13px] py-[11px] text-left text-[14.5px] transition ${page === item.id ? "active bg-violet-500/20 text-white [&>svg]:text-[#a88fff]" : "bg-transparent text-[#aaa6b3] hover:bg-white/5 hover:text-white"}`} onClick={() => navigate(item.id)}>
                <Icon className="shrink-0" size={19} strokeWidth={1.9} />
                <span>{item.label}</span>
                {page === item.id ? <i className="absolute -right-[18px] h-[25px] w-[3px] rounded-l bg-[#8b6bf2]" /> : null}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-card relative mt-auto overflow-hidden rounded-[13px] border border-violet-300/15 bg-gradient-to-br from-violet-500/20 to-violet-500/5 p-[17px] after:absolute after:-bottom-[33px] after:-right-7 after:size-20 after:rounded-full after:bg-violet-400/15 after:content-['']">
          <span className="sidebar-card-kicker text-[9.5px] font-bold uppercase tracking-[1px] text-[#a990ff]">Dica rápida</span>
          <strong className="mt-2 block text-[12.5px]">Mantenha as cobranças em dia</strong>
          <p className="mb-3 mt-1.5 text-[10.5px] leading-6 text-[#a9a4b4]">Revise os vencimentos da semana para antecipar seus recebimentos.</p>
          <button className="relative z-[1] border-0 bg-transparent p-0 text-[10.5px] font-bold text-[#b8a7ff]" onClick={() => navigate("collections")}>Ver agenda</button>
        </div>
        <div className="sidebar-user mt-[17px] flex items-center gap-[9px] border-t border-white/10 px-[5px] pt-[14px]">
          <Avatar name={user.name} />
          <div className="flex min-w-0 flex-1 flex-col"><strong className="overflow-hidden text-[11.5px] text-ellipsis whitespace-nowrap">{user.name}</strong><span className="mt-[3px] overflow-hidden text-[9.5px] text-[#85808e] text-ellipsis whitespace-nowrap">{user.email}</span></div>
          <button className={`${iconButtonClass} inline-grid text-[#777281]`} onClick={onLogout} aria-label="Sair"><LogOut size={18} /></button>
        </div>
      </aside>

      <div className="main-column min-h-screen min-w-0 w-full min-[861px]:ml-[264px] min-[861px]:flex min-[861px]:h-dvh min-[861px]:min-h-0 min-[861px]:w-[calc(100%-264px)] min-[861px]:flex-col">
        <header className="topbar sticky top-0 z-20 flex h-[61px] shrink-0 items-center justify-between border-b border-[#e7e5ed]/85 bg-[#faf9fc]/90 px-[14px] backdrop-blur-[14px] min-[641px]:h-[70px] min-[641px]:px-5 min-[861px]:px-[34px]">
          <button className={`${iconButtonClass} mobile-menu hidden max-[860px]:inline-grid`} onClick={() => setMobileOpen(true)} aria-label="Abrir menu"><Menu size={21} /></button>
          <form className="global-search flex w-[min(410px,45vw)] min-w-0 items-center gap-2.5 text-[#928e9d] max-[860px]:w-[min(330px,58vw)] max-[640px]:hidden" onSubmit={(event) => { event.preventDefault(); if (search.trim()) onSearch(search.trim()); }}>
            <Search className="shrink-0" size={18} />
            <input className="min-w-0 flex-1 border-0 bg-transparent text-[13px] text-[#373341] outline-none placeholder:text-[#aaa7b1]" ref={searchRef} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar clientes..." aria-label="Busca global" />
            <kbd className="rounded-[5px] border border-[#e4e1e9] bg-white px-1.5 py-[3px] text-[9px] text-[#aaa6b2] shadow-sm">Ctrl K</kbd>
          </form>
          <div className="topbar-actions flex items-center gap-[13px] max-[640px]:gap-1">
            <button className={`${iconButtonClass} notification-button relative inline-grid`} onClick={() => navigate("collections")} aria-label="Abrir cobranças"><Bell size={19} /><span className="absolute right-2 top-[7px] size-1.5 rounded-full border-2 border-[#faf9fc] bg-rose-500" /></button>
            <div className="profile-wrap relative">
              <button className="profile-button flex min-h-[42px] items-center gap-2 rounded-[11px] border border-[#ece9f0] bg-white py-1 pl-1 pr-[7px] text-xs font-bold text-[#3e3b47] max-[640px]:border-transparent max-[640px]:bg-transparent max-[640px]:p-1 max-[640px]:[&>span:not([data-ui=avatar])]:hidden max-[640px]:[&>svg]:hidden" onClick={() => setProfileOpen(!profileOpen)} aria-expanded={profileOpen}><Avatar name={user.name} size="sm" /><span>{user.name.split(" ")[0]}</span><ChevronDown size={15} /></button>
              {profileOpen ? <div className="profile-menu absolute right-0 top-[calc(100%+9px)] flex w-[205px] flex-col rounded-[11px] border border-[#e7e3ec] bg-white p-3 shadow-[0_13px_35px_rgba(32,25,49,0.14)]"><strong className="text-[10.5px]">{user.name}</strong><span className="mt-[3px] overflow-hidden text-[9px] text-[#96919e] text-ellipsis">{user.email}</span><button className="mt-[11px] flex items-center gap-[7px] rounded-lg border-0 bg-rose-50 p-2.5 text-[10px] font-bold text-rose-700" onClick={onLogout}><LogOut size={15} /> Sair da conta</button></div> : null}
            </div>
          </div>
        </header>
        <main className="content mx-auto w-full min-w-0 max-w-[1480px] px-[13px] pb-[calc(35px+env(safe-area-inset-bottom))] pt-5 min-[641px]:px-5 min-[641px]:pb-[42px] min-[641px]:pt-[25px] min-[861px]:min-h-0 min-[861px]:flex-1 min-[861px]:overflow-y-auto min-[861px]:overscroll-contain min-[861px]:px-[34px] min-[861px]:pb-6 min-[861px]:pt-[31px]">{children}</main>
      </div>
    </div>
  );
}
