"use client";

import { usePathname } from "next/navigation";
import { 
  Wallet, Target, Briefcase, CreditCard, LogOut, 
  LayoutDashboard, TrendingUp, TrendingDown, PieChart 
} from "lucide-react";

interface SidebarProps {
  userEmail?: string | null;
  onLogout?: () => void;
}

export function Sidebar({ userEmail, onLogout }: SidebarProps) {
  const pathname = usePathname(); // Identifica a página atual automaticamente

  const isActive = (path: string) => pathname === path;

  // Função auxiliar para gerar links
  const NavLink = ({ href, icon: Icon, label }: any) => (
    <a 
      href={href} 
      className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group ${
        isActive(href) 
          ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon size={20} className={isActive(href) ? 'text-white' : 'text-slate-500 group-hover:text-white transition-colors'} /> 
      {label}
    </a>
  );

  return (
    <aside className="w-72 bg-slate-900 hidden md:flex flex-col shadow-2xl z-10 relative shrink-0 h-screen">
      <div className="p-8">
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3 tracking-tight">
          <div className="bg-brand-600 p-2 rounded-lg shadow-lg shadow-brand-600/50">
            <Wallet className="w-7 h-7 text-white" /> 
          </div>
          Flui
        </h1>
      </div>

      <nav className="flex-1 px-6 space-y-2 overflow-y-auto py-4 custom-scrollbar">
        <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-2">Principal</p>
        <NavLink href="/" icon={LayoutDashboard} label="Dashboard" />
        <NavLink href="/incomes" icon={TrendingUp} label="Receitas" />
        <NavLink href="/expenses" icon={TrendingDown} label="Despesas" />
        
        <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mt-8 mb-2">Gestão</p>
        <NavLink href="/planning" icon={Target} label="Planejamento" />
        <NavLink href="/investments" icon={Briefcase} label="Investimentos" />
        <NavLink href="/goals" icon={PieChart} label="Metas" />
        <NavLink href="/credit-cards" icon={CreditCard} label="Cartões" />
      </nav>
      
      {userEmail && (
        <div className="p-6 m-4 bg-slate-950/50 rounded-2xl border border-slate-800 flex flex-col items-center text-center">
          <div className="w-10 h-10 bg-brand-900 rounded-full flex items-center justify-center text-brand-300 font-bold mb-3 shadow-inner">
             {userEmail.charAt(0).toUpperCase()}
          </div>
          <p className="text-sm text-white font-medium truncate w-full mb-4" title={userEmail}>{userEmail}</p>
          <button 
            onClick={onLogout} 
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all w-full border border-slate-700 active:scale-95"
          >
            <LogOut size={16} /> Sair
          </button>
        </div>
      )}
    </aside>
  );
}