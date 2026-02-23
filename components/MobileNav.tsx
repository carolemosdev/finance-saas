"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Menu, X, Waves, LayoutDashboard, TrendingUp, TrendingDown, 
  Target, Briefcase, PieChart, CreditCard, LogOut
} from "lucide-react";

interface MobileNavProps {
  userEmail: string | null;
  onLogout: () => void;
}

export function MobileNav({ userEmail, onLogout }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname(); // Identifica a página atual

  const toggleMenu = () => setIsOpen(!isOpen);
  const isActive = (path: string) => pathname === path;

  // Helper para links com roteamento ultra-rápido do Next.js
  const NavLink = ({ href, icon: Icon, label }: any) => (
    <Link 
      href={href} 
      onClick={() => setIsOpen(false)} // Fecha o menu ao clicar
      className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all active:scale-95 ${
        isActive(href) 
          ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon size={20} className={isActive(href) ? 'text-white' : 'text-slate-500'} /> 
      {label}
    </Link>
  );

  return (
    <>
      {/* --- BARRA SUPERIOR MOBILE --- */}
      <div className="md:hidden bg-slate-900 p-4 flex justify-between items-center shadow-lg border-b border-slate-800 relative z-50 sticky top-0">
        
        {/* LOGO CLICÁVEL COM ÍCONE WAVES */}
        <Link href="/" className="flex items-center gap-2 group outline-none">
          <div className="bg-brand-600 p-1.5 rounded-lg shadow-lg shadow-brand-600/40 group-active:scale-95 transition-transform">
            <Waves className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-black text-white tracking-tight">Flui</span>
        </Link>
        
        <button onClick={toggleMenu} className="text-slate-300 hover:text-white p-2 hover:bg-slate-800 rounded-lg transition-colors">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* --- OVERLAY --- */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* --- DRAWER (MENU LATERAL MOBILE) --- */}
      <aside 
        className={`fixed top-0 left-0 h-full w-72 bg-slate-900 z-50 transform transition-transform duration-300 ease-out shadow-2xl md:hidden flex flex-col border-r border-slate-800 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/20">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            Navegação
          </h2>
          <button onClick={() => setIsOpen(false)} className="bg-slate-800 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Principal</p>
          <NavLink href="/" icon={LayoutDashboard} label="Dashboard" />
          <NavLink href="/incomes" icon={TrendingUp} label="Receitas" />
          <NavLink href="/expenses" icon={TrendingDown} label="Despesas" />
          
          <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mt-6 mb-2">Gestão</p>
          <NavLink href="/planning" icon={Target} label="Planejamento" />
          <NavLink href="/investments" icon={Briefcase} label="Investimentos" />
          <NavLink href="/goals" icon={PieChart} label="Metas" />
          <NavLink href="/credit-cards" icon={CreditCard} label="Cartões" />
        </nav>

        <div className="p-6 border-t border-slate-800 bg-slate-950/30">
          <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-brand-900 rounded-full flex items-center justify-center text-brand-300 font-bold shrink-0 shadow-inner">
                {userEmail?.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm text-white font-medium truncate w-40">{userEmail}</p>
                <p className="text-[10px] text-brand-400 uppercase font-bold tracking-wide">Minha Conta</p>
              </div>
          </div>
          <button 
            onClick={onLogout} 
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg border border-slate-700 hover:border-slate-600 transition-all active:scale-95"
          >
            <LogOut size={16} /> Sair
          </button>
        </div>
      </aside>
    </>
  );
}