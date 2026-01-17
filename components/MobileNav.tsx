"use client";

import { useState } from "react";
import { 
  Menu, X, Wallet, LayoutDashboard, TrendingUp, TrendingDown, 
  PieChart, CreditCard, LogOut, Tags 
} from "lucide-react";

interface MobileNavProps {
  userEmail: string | null;
  onLogout: () => void;
}

export function MobileNav({ userEmail, onLogout }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  // Helper para links (mesmo estilo da Desktop, mas ajustado para mobile)
  const NavLink = ({ href, icon: Icon, label }: any) => (
    <a 
      href={href} 
      className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
    >
      <Icon size={20} /> {label}
    </a>
  );

  return (
    <>
      {/* --- BARRA SUPERIOR MOBILE (Só aparece em telas pequenas) --- */}
      <div className="md:hidden bg-slate-900 p-4 flex justify-between items-center shadow-lg border-b border-slate-800 relative z-50">
        <div className="flex items-center gap-2">
          <div className="bg-brand-600 p-1.5 rounded-lg">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-extrabold text-white tracking-tight">Flui</span>
        </div>
        <button onClick={toggleMenu} className="text-slate-300 hover:text-white p-1">
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* --- OVERLAY (Fundo escuro quando abre o menu) --- */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* --- DRAWER (Menu Deslizante) --- */}
      <aside 
        className={`fixed top-0 left-0 h-full w-72 bg-slate-900 z-50 transform transition-transform duration-300 ease-in-out shadow-2xl md:hidden flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Cabeçalho do Drawer */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            Navegação
          </h2>
          <button onClick={() => setIsOpen(false)} className="bg-slate-800 p-1 rounded-full text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Links de Navegação */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Principal</p>
          <NavLink href="/" icon={LayoutDashboard} label="Dashboard" />
          <NavLink href="/incomes" icon={TrendingUp} label="Receitas" />
          <NavLink href="/expenses" icon={TrendingDown} label="Despesas" />
          
          <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mt-6 mb-2">Gestão</p>
          <NavLink href="/investments" icon={PieChart} label="Investimentos" />
          <NavLink href="/credit-cards" icon={CreditCard} label="Cartões" />
        </nav>

        {/* Rodapé (Perfil) */}
        <div className="p-6 border-t border-slate-800 bg-slate-950/30">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-10 h-10 bg-brand-900 rounded-full flex items-center justify-center text-brand-300 font-bold shrink-0">
                {userEmail?.charAt(0).toUpperCase()}
             </div>
             <div className="overflow-hidden">
                <p className="text-sm text-white font-medium truncate w-40">{userEmail}</p>
                <p className="text-xs text-slate-500">Conta Gratuita</p>
             </div>
          </div>
          <button 
            onClick={onLogout} 
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg border border-slate-700 transition-colors"
          >
            <LogOut size={16} /> Sair
          </button>
        </div>
      </aside>
    </>
  );
}