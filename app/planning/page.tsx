"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase"; // Certifique-se que este caminho está correto
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Briefcase, 
  Target,
  CreditCard,
  ArrowRight,
  LogOut,
  Menu,
  X,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight
} from "lucide-react";

// --- COMPONENTES DE LAYOUT (Sidebar, MobileNav) ---
// Você pode extrair estes componentes para arquivos separados depois se quiser.
// Por enquanto, para facilitar, vou mantê-los aqui no mesmo arquivo.

function MobileNav({ userEmail, onLogout }: { userEmail: string | null, onLogout: () => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center shadow-lg sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <div className="bg-brand-600 p-1.5 rounded-lg">
           <Wallet className="text-white w-5 h-5" />
        </div>
        <span className="font-bold text-lg tracking-tight">Flui</span>
      </div>

      <button onClick={() => setIsOpen(!isOpen)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Menu Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-slate-900 border-t border-slate-800 shadow-2xl animate-in slide-in-from-top-2">
          <div className="p-4 space-y-4">
            
            <div className="px-4 py-3 bg-slate-800/50 rounded-xl border border-slate-700">
               <p className="text-xs text-slate-400 uppercase font-bold mb-1">Logado como</p>
               <p className="text-sm font-medium truncate text-white">{userEmail}</p>
            </div>

            <nav className="flex flex-col gap-2">
               <a href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-all">
                 <Briefcase size={18} /> Visão Geral
               </a>
               <a href="/planning" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-brand-600 text-white font-medium transition-all">
                 <Target size={18} /> Planejamento
               </a>
            </nav>

            <div className="h-px bg-slate-800 my-2"></div>

            <button 
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-all font-medium"
            >
              <LogOut size={18} /> Sair do Sistema
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Sidebar({ userEmail, onLogout }: { userEmail: string | null, onLogout: () => void }) {
  return (
    <aside className="w-72 bg-slate-900 hidden md:flex flex-col shadow-2xl z-10 relative shrink-0">
      <div className="p-8">
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3 tracking-tight">
          <div className="bg-brand-600 p-2 rounded-lg shadow-lg shadow-brand-600/50">
            <Wallet className="w-7 h-7 text-white" /> 
          </div>
          Flui
        </h1>
      </div>
      <nav className="flex-1 px-6 space-y-3 overflow-y-auto py-4 custom-scrollbar">
        <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Principal</p>
        <a href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group text-slate-400 hover:bg-slate-800 hover:text-white">
          <Wallet size={20} /> Dashboard
        </a>
        <a href="/incomes" className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group text-slate-400 hover:bg-slate-800 hover:text-white">
          <TrendingUp size={20} /> Receitas
        </a>
        <a href="/expenses" className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group text-slate-400 hover:bg-slate-800 hover:text-white">
          <TrendingDown size={20} /> Despesas
        </a>
        
        <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mt-8 mb-2">Gestão</p>
        <a href="/investments" className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group text-slate-400 hover:bg-slate-800 hover:text-white">
            <Briefcase size={20} /> Investimentos
        </a>
        <a href="/planning" className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group bg-brand-600 text-white shadow-md shadow-brand-600/30">
          <Target size={20} /> Planejamento
        </a>
        <a href="/credit-cards" className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group text-slate-400 hover:bg-slate-800 hover:text-white">
            <CreditCard size={20} /> Cartões
        </a>
      </nav>
      
      <div className="p-6 bg-slate-950/50 m-4 rounded-2xl border border-slate-800 flex flex-col items-center text-center">
        <div className="w-12 h-12 bg-brand-900 rounded-full flex items-center justify-center text-brand-300 font-bold text-lg mb-3 shadow-md shadow-brand-900/50">
            {userEmail?.charAt(0).toUpperCase()}
        </div>
        <div className="w-full overflow-hidden mb-4">
            <p className="text-sm text-white font-medium truncate w-full" title={userEmail || ''}>{userEmail}</p>
            <p className="text-xs text-slate-500 mt-0.5">Conta Gratuita</p>
        </div>
        <button onClick={onLogout} className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all w-full border border-slate-700 hover:border-slate-600 active:scale-95">
            <ArrowRight size={16} /> <span>Sair da conta</span>
        </button>
      </div>
    </aside>
  );
}

// --- DADOS MOCKADOS PARA A TABELA (Visualização) ---
const mockData = {
  incomes: {
    totalPlanned: 14790.00,
    totalRealizedJan: 11290.00,
    items: [
      { id: 1, name: "Renda extra", planned: 6000.00, realizedJan: 2500.00 },
      { id: 2, name: "Salário", planned: 8790.00, realizedJan: 8790.00 },
    ]
  },
  expenses: {
    totalPlanned: 9471.45,
    totalRealizedJan: 8914.00,
    categories: [
      {
        id: 'cat1',
        name: "Cuidado Pessoal",
        planned: 300.00,
        realizedJan: 267.55,
        subcategories: []
      },
      {
        id: 'cat2',
        name: "Gastos Extras",
        planned: 695.00,
        realizedJan: 664.00,
        subcategories: [
          { id: 'sub1', name: "Compras variadas", planned: 400.00, realizedJan: 389.00 },
          { id: 'sub2', name: "Restaurante", planned: 270.00, realizedJan: 250.00 },
          { id: 'sub3', name: "Streaming", planned: 25.00, realizedJan: 25.00 },
        ]
      },
      {
        id: 'cat3',
        name: "Moradia",
        planned: 3306.00,
        realizedJan: 3116.00,
        subcategories: [
          { id: 'sub4', name: "Aluguel", planned: 2500.00, realizedJan: 2500.00 },
          { id: 'sub5', name: "Internet", planned: 600.00, realizedJan: 450.00 },
          { id: 'sub6', name: "Energia", planned: 150.00, realizedJan: 110.00 },
        ]
      }
    ]
  }
};


// --- PÁGINA PRINCIPAL DO PLANEJAMENTO ---
export default function PlanningPage() {
  const router = useRouter();
  const [areValuesVisible, setAreValuesVisible] = useState(true);
  // Estado para controlar quais categorias estão expandidas
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['cat2', 'cat3']);

  // Em um cenário real, você pegaria o usuário do contexto ou de uma chamada à API
  const userEmail = "usuario@exemplo.com"; 

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

  const formatMoney = (value: number) => {
    if (!areValuesVisible) return "••••••";
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatPercentage = (planned: number, total: number) => {
    if (total === 0) return "0,00%";
    return `${((planned / total) * 100).toFixed(2)}%`;
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId) 
        : [...prev, categoryId]
    );
  };

  const saldoMensal = mockData.incomes.totalRealizedJan - mockData.expenses.totalRealizedJan;

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans flex-col md:flex-row">
      
      <MobileNav userEmail={userEmail} onLogout={handleLogout} />
      <Sidebar userEmail={userEmail} onLogout={handleLogout} />

      <main className="flex-1 overflow-y-auto relative z-0">
        {/* Header da Página */}
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-slate-200 px-8 py-5 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-3">
              Planejamento e Controle
              <button 
                onClick={() => setAreValuesVisible(!areValuesVisible)}
                className="ml-2 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-brand-600 transition-colors"
                title={areValuesVisible ? "Ocultar valores" : "Mostrar valores"}
              >
                {areValuesVisible ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </h2>
          </div>
          
          {/* Card de Saldo Mensal */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Saldo Mensal (Jan)</p>
              <p className={`text-xl font-extrabold ${saldoMensal >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatMoney(saldoMensal)}
              </p>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 text-sm uppercase tracking-wider font-bold">
                    <th className="p-4 pl-6 text-left">Categorias e Subcategorias</th>
                    <th className="p-4 text-right bg-amber-50 border-l border-r border-amber-100 text-amber-700">Planejamento</th>
                    <th className="p-4 text-center">%</th>
                    <th className="p-4 text-right">Jan 2025</th>
                    {/* Adicione mais colunas para outros meses aqui */}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  
                  {/* --- SEÇÃO DE RECEITAS --- */}
                  <tr className="bg-emerald-600 text-white font-bold">
                    <td className="p-4 pl-6">Receitas</td>
                    <td className="p-4 text-right bg-emerald-700/50">{formatMoney(mockData.incomes.totalPlanned)}</td>
                    <td className="p-4 text-center">100.00%</td>
                    <td className="p-4 text-right">{formatMoney(mockData.incomes.totalRealizedJan)}</td>
                  </tr>
                  {mockData.incomes.items.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors font-medium text-slate-700">
                      <td className="p-4 pl-10 flex items-center gap-2">
                        {item.name}
                      </td>
                      <td className="p-0">
                        <input 
                          type="text" 
                          value={areValuesVisible ? item.planned.toFixed(2) : "••••••"} 
                          readOnly 
                          className="w-full h-full p-4 text-right bg-amber-50/50 focus:bg-white focus:ring-2 focus:ring-brand-500 border-0 text-slate-700 font-medium outline-none"
                        />
                      </td>
                      <td className="p-4 text-center text-slate-500 text-sm">{formatPercentage(item.planned, mockData.incomes.totalPlanned)}</td>
                      <td className="p-4 text-right">{formatMoney(item.realizedJan)}</td>
                    </tr>
                  ))}

                  {/* Separador */}
                  <tr><td colSpan={5} className="h-4 bg-slate-50"></td></tr>

                  {/* --- SEÇÃO DE DESPESAS --- */}
                  <tr className="bg-rose-600 text-white font-bold">
                    <td className="p-4 pl-6">Despesas Mensais</td>
                    <td className="p-4 text-right bg-rose-700/50">{formatMoney(mockData.expenses.totalPlanned)}</td>
                    <td className="p-4 text-center text-sm">
                      {formatPercentage(mockData.expenses.totalPlanned, mockData.incomes.totalPlanned)} da Receita
                    </td>
                    <td className="p-4 text-right">{formatMoney(mockData.expenses.totalRealizedJan)}</td>
                  </tr>

                  {mockData.expenses.categories.map(category => (
                    <>
                      {/* Linha da Categoria Principal */}
                      <tr key={category.id} className="hover:bg-slate-50 transition-colors font-bold text-slate-700 bg-slate-50/50">
                        <td className="p-4 pl-6 flex items-center gap-2 cursor-pointer select-none" onClick={() => toggleCategory(category.id)}>
                          {category.subcategories.length > 0 ? (
                            expandedCategories.includes(category.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                          ) : <span className="w-4"></span>}
                          {category.name}
                        </td>
                        <td className="p-0">
                          <input 
                            type="text" 
                            value={areValuesVisible ? category.planned.toFixed(2) : "••••••"} 
                            readOnly 
                            className="w-full h-full p-4 text-right bg-amber-50/50 focus:bg-white focus:ring-2 focus:ring-brand-500 border-0 text-slate-700 font-bold outline-none"
                          />
                        </td>
                        <td className="p-4 text-center text-slate-500 text-sm">{formatPercentage(category.planned, mockData.expenses.totalPlanned)}</td>
                        <td className="p-4 text-right">{formatMoney(category.realizedJan)}</td>
                      </tr>

                      {/* Linhas das Subcategorias (se a categoria estiver expandida) */}
                      {expandedCategories.includes(category.id) && category.subcategories.map(sub => (
                        <tr key={sub.id} className="hover:bg-slate-50 transition-colors font-medium text-slate-600">
                          <td className="p-4 pl-12 flex items-center gap-2">
                            {sub.name}
                          </td>
                          <td className="p-0">
                            <input 
                              type="text" 
                              value={areValuesVisible ? sub.planned.toFixed(2) : "••••••"} 
                              readOnly 
                              className="w-full h-full p-4 text-right bg-amber-50/30 focus:bg-white focus:ring-2 focus:ring-brand-500 border-0 text-slate-600 font-medium outline-none"
                            />
                          </td>
                          <td className="p-4 text-center text-slate-400 text-xs">{formatPercentage(sub.planned, mockData.expenses.totalPlanned)}</td>
                          <td className="p-4 text-right">{formatMoney(sub.realizedJan)}</td>
                        </tr>
                      ))}
                    </>
                  ))}

                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}