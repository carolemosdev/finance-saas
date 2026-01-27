"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { 
  Wallet, Briefcase, Target, CreditCard, ArrowRight, LogOut, 
  Menu, X, Eye, EyeOff, ChevronDown, ChevronRight, Settings,
  Repeat, TrendingUp as TrendingIcon
} from "lucide-react";

// --- TIPAGEM ---
type MonthlyValue = { [month: string]: number };

type PlanningItem = {
  id: string | number;
  name: string;
  planned: number;     // Valor base da Meta
  isFixed: boolean;    // NOVO: Define se é Fixo (repete) ou Variável
  realized: MonthlyValue; 
};

type ExpenseCategory = {
  id: string | number;
  name: string;
  planned: number;
  realized: MonthlyValue;
  subcategories: PlanningItem[];
};

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun'];
const MONTH_LABELS: { [key: string]: string } = { 
  'jan': 'Jan', 'fev': 'Fev', 'mar': 'Mar', 
  'abr': 'Abr', 'mai': 'Mai', 'jun': 'Jun' 
};

// --- DADOS INICIAIS ---
const initialIncomes: PlanningItem[] = [
  { 
    id: 1, name: "Renda extra", planned: 6000.00, isFixed: false,
    realized: { jan: 2500, fev: 1000, mar: 0, abr: 0, mai: 0, jun: 0 } 
  },
  { 
    id: 2, name: "Salário", planned: 8790.00, isFixed: true,
    realized: { jan: 8790, fev: 8790, mar: 8790, abr: 0, mai: 0, jun: 0 } 
  },
];

const initialExpenses: ExpenseCategory[] = [
  {
    id: 'cat1', name: "Cuidado Pessoal", planned: 300.00, 
    realized: { jan: 267.55, fev: 150.00 },
    subcategories: []
  },
  {
    id: 'cat2', name: "Gastos Extras", planned: 0, realized: {}, 
    subcategories: [
      { id: 'sub1', name: "Compras variadas", planned: 400.00, isFixed: false, realized: { jan: 389, fev: 120 } },
      { id: 'sub2', name: "Restaurante", planned: 270.00, isFixed: false, realized: { jan: 250, fev: 300 } },
      { id: 'sub3', name: "Streaming", planned: 25.00, isFixed: true, realized: { jan: 25, fev: 25 } },
    ]
  },
  {
    id: 'cat3', name: "Moradia", planned: 0, realized: {},
    subcategories: [
      { id: 'sub4', name: "Aluguel", planned: 2500.00, isFixed: true, realized: { jan: 2500, fev: 2500, mar: 2500 } },
      { id: 'sub5', name: "Internet", planned: 600.00, isFixed: true, realized: { jan: 450, fev: 450 } },
      { id: 'sub6', name: "Energia", planned: 150.00, isFixed: false, realized: { jan: 110, fev: 130 } },
    ]
  }
];

// --- COMPONENTES VISUAIS AUXILIARES ---
function MobileNav({ userEmail, onLogout }: { userEmail: string | null, onLogout: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center shadow-lg sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <div className="bg-brand-600 p-1.5 rounded-lg"><Wallet className="text-white w-5 h-5" /></div>
        <span className="font-bold text-lg tracking-tight">Flui</span>
      </div>
      <button onClick={() => setIsOpen(!isOpen)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-slate-900 border-t border-slate-800 shadow-2xl p-4 space-y-4">
           <nav className="flex flex-col gap-2">
             <a href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800"><Briefcase size={18} /> Visão Geral</a>
             <a href="/planning" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-brand-600 text-white"><Target size={18} /> Planejamento</a>
           </nav>
           <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-slate-800 rounded-xl"><LogOut size={18} /> Sair</button>
        </div>
      )}
    </div>
  );
}

function Sidebar({ userEmail, onLogout }: { userEmail: string | null, onLogout: () => void }) {
  return (
    <aside className="w-72 bg-slate-900 hidden md:flex flex-col shadow-2xl z-10 relative shrink-0">
      <div className="p-8"><h1 className="text-3xl font-extrabold text-white flex items-center gap-3">Flui</h1></div>
      <nav className="flex-1 px-6 space-y-3 overflow-y-auto py-4 custom-scrollbar">
        <a href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all"><Wallet size={20} /> Dashboard</a>
        <a href="/planning" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-brand-600 text-white shadow-md"><Target size={20} /> Planejamento</a>
        <a href="/credit-cards" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all"><CreditCard size={20} /> Cartões</a>
      </nav>
      <div className="p-6 m-4 flex flex-col items-center text-center">
        <p className="text-sm text-white mb-4">{userEmail}</p>
        <button onClick={onLogout} className="flex items-center justify-center gap-2 px-4 py-2 text-sm text-slate-300 border border-slate-700 rounded-xl hover:bg-slate-800 w-full"><ArrowRight size={16} /> Sair</button>
      </div>
    </aside>
  );
}

// --- PÁGINA PRINCIPAL ---
export default function PlanningPage() {
  const router = useRouter();
  const [areValuesVisible, setAreValuesVisible] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['cat2', 'cat3']);
  
  const [incomes, setIncomes] = useState<PlanningItem[]>(initialIncomes);
  const [expenses, setExpenses] = useState<ExpenseCategory[]>(initialExpenses);

  const userEmail = "usuario@flui.com";

  // --- CÁLCULOS DINÂMICOS ---
  const calculateCategoryTotal = (cat: ExpenseCategory, type: 'planned' | string) => {
    if (type === 'planned') {
      return cat.subcategories.length > 0 
        ? cat.subcategories.reduce((acc, sub) => acc + sub.planned, 0)
        : cat.planned;
    }
    return cat.subcategories.length > 0 
      ? cat.subcategories.reduce((acc, sub) => acc + (sub.realized[type] || 0), 0)
      : (cat.realized[type] || 0);
  };

  const getTotalIncome = (month: string) => incomes.reduce((acc, item) => acc + (item.realized[month] || 0), 0);
  const getTotalExpense = (month: string) => expenses.reduce((acc, cat) => acc + calculateCategoryTotal(cat, month), 0);
  
  const totalIncomePlanned = incomes.reduce((acc, item) => acc + item.planned, 0);
  const totalExpensePlanned = expenses.reduce((acc, cat) => acc + calculateCategoryTotal(cat, 'planned'), 0);

  // NOVO: Cálculo do Saldo Mensal (Linha de Destaque)
  const getMonthlyBalance = (month: string) => getTotalIncome(month) - getTotalExpense(month);
  const balancePlanned = totalIncomePlanned - totalExpensePlanned;

  // --- INTERAÇÕES ---
  const handleIncomeChange = (id: number | string, val: string) => {
    const value = parseFloat(val) || 0;
    setIncomes(prev => prev.map(i => i.id === id ? { ...i, planned: value } : i));
  };
  
  const handleExpenseChange = (catId: string | number, subId: string | number | null, val: string) => {
    const value = parseFloat(val) || 0;
    setExpenses(prev => prev.map(cat => {
      if (cat.id !== catId) return cat;
      if (subId) {
        return { ...cat, subcategories: cat.subcategories.map(s => s.id === subId ? { ...s, planned: value } : s) };
      }
      return { ...cat, planned: value };
    }));
  };

  // NOVO: Botão para alternar entre Fixo/Variável
  const toggleFixed = (type: 'income' | 'expense', catId: string | number, subId?: string | number) => {
    if (type === 'income') {
      setIncomes(prev => prev.map(i => i.id === catId ? { ...i, isFixed: !i.isFixed } : i));
    } else {
      setExpenses(prev => prev.map(cat => {
        if (cat.id !== catId) return cat;
        if (subId) {
          return { ...cat, subcategories: cat.subcategories.map(s => s.id === subId ? { ...s, isFixed: !s.isFixed } : s) };
        }
        return cat; // Categoria pai (sem sub) lógica simplificada
      }));
    }
  };

  const formatMoney = (val: number) => !areValuesVisible ? "••••••" : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const formatPercent = (val: number, total: number) => total === 0 ? "0%" : `${((val / total) * 100).toFixed(0)}%`;
  
  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/auth"); };
  const toggleCategory = (id: string) => setExpandedCategories(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans flex-col md:flex-row">
      <MobileNav userEmail={userEmail} onLogout={handleLogout} />
      <Sidebar userEmail={userEmail} onLogout={handleLogout} />

      <main className="flex-1 overflow-y-auto relative z-0">
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-slate-200 px-8 py-5 flex justify-between items-center">
          <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-3">
            Planejamento Anual
            <button onClick={() => setAreValuesVisible(!areValuesVisible)} className="ml-2 p-2 rounded-full hover:bg-slate-100 text-slate-400">
              {areValuesVisible ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
          </h2>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-brand-600 bg-brand-50 border border-brand-100 rounded-lg hover:bg-brand-100 transition-colors">
              <Settings size={16} /> Configurar
            </button>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-full mx-auto">
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border-0 overflow-hidden">
            
            <div className="overflow-x-auto pb-4">
              <table className="w-full text-left border-collapse min-w-[1200px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 text-xs uppercase tracking-wider font-bold">
                    <th className="p-4 pl-6 sticky left-0 bg-slate-100 z-10 border-b border-slate-200">Categorias</th>
                    <th className="p-4 text-right bg-amber-50 text-amber-800 border-x border-amber-100 min-w-[140px] border-b border-slate-200">Meta (R$)</th>
                    <th className="p-4 text-center min-w-[60px] border-b border-slate-200">%</th>
                    
                    {MONTHS.map(month => (
                      <th key={month} className="p-4 text-right min-w-[120px] whitespace-nowrap border-b border-slate-200">{MONTH_LABELS[month]}</th>
                    ))}
                  </tr>
                  
                  {/* === NOVA LINHA: SALDO MENSAL === */}
                  <tr className="bg-slate-50 font-extrabold text-slate-800 border-b-2 border-slate-200">
                    <td className="p-4 pl-6 sticky left-0 bg-slate-50 z-10 text-slate-500 uppercase text-xs tracking-wider">Saldo Mensal</td>
                    <td className={`p-4 text-right ${balancePlanned >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatMoney(balancePlanned)}
                    </td>
                    <td className="p-4 text-center text-slate-400">-</td>
                    {MONTHS.map(month => {
                      const bal = getMonthlyBalance(month);
                      return (
                        <td key={month} className={`p-4 text-right ${bal >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {formatMoney(bal)}
                        </td>
                      );
                    })}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-50">
                  
                  {/* === RECEITAS === */}
                  <tr className="bg-emerald-600 text-white font-bold text-sm">
                    <td className="p-4 pl-6 sticky left-0 bg-emerald-600 z-10">Receitas Totais</td>
                    <td className="p-4 text-right bg-emerald-700/50">{formatMoney(totalIncomePlanned)}</td>
                    <td className="p-4 text-center">100%</td>
                    {MONTHS.map(month => (
                      <td key={month} className="p-4 text-right">{formatMoney(getTotalIncome(month))}</td>
                    ))}
                  </tr>
                  
                  {incomes.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors font-medium text-slate-700 group">
                      <td className="p-4 pl-10 sticky left-0 bg-white group-hover:bg-slate-50 z-10 flex items-center justify-between pr-4">
                        <span>{item.name}</span>
                        {/* BOTÃO DE TIPO DE DESPESA (Fixo/Variável) */}
                        <button 
                          onClick={() => toggleFixed('income', item.id)}
                          className={`p-1 rounded-md transition-colors ${item.isFixed ? 'text-blue-500 bg-blue-50 hover:bg-blue-100' : 'text-orange-500 bg-orange-50 hover:bg-orange-100'}`}
                          title={item.isFixed ? "Fixo: Valor se repete todos os meses" : "Variável: Valor muda mês a mês"}
                        >
                          {item.isFixed ? <Repeat size={14} /> : <TrendingIcon size={14} />}
                        </button>
                      </td>
                      <td className="p-0 relative">
                        <div className="absolute inset-0 m-1">
                          <input type="number" value={item.planned || ''} onChange={(e) => handleIncomeChange(item.id, e.target.value)}
                            className="w-full h-full text-right bg-amber-50/30 focus:bg-white focus:ring-2 focus:ring-brand-500 rounded-md px-3 font-bold text-slate-700 outline-none" />
                        </div>
                      </td>
                      <td className="p-4 text-center text-xs text-slate-400">{formatPercent(item.planned, totalIncomePlanned)}</td>
                      {MONTHS.map(month => (
                        <td key={month} className="p-4 text-right text-slate-500 text-sm">{formatMoney(item.realized[month] || 0)}</td>
                      ))}
                    </tr>
                  ))}

                  <tr><td colSpan={3 + MONTHS.length} className="h-4 bg-slate-50"></td></tr>

                  {/* === DESPESAS === */}
                  <tr className="bg-rose-600 text-white font-bold text-sm">
                    <td className="p-4 pl-6 sticky left-0 bg-rose-600 z-10">Despesas Totais</td>
                    <td className="p-4 text-right bg-rose-700/50">{formatMoney(totalExpensePlanned)}</td>
                    <td className="p-4 text-center opacity-90">{formatPercent(totalExpensePlanned, totalIncomePlanned)}</td>
                    {MONTHS.map(month => (
                      <td key={month} className="p-4 text-right">{formatMoney(getTotalExpense(month))}</td>
                    ))}
                  </tr>

                  {expenses.map(category => {
                    const catPlanned = calculateCategoryTotal(category, 'planned');
                    return (
                      <>
                        <tr key={category.id} className="bg-slate-50/80 font-bold text-slate-800 hover:bg-slate-100">
                          <td className="p-4 pl-6 flex items-center gap-2 cursor-pointer sticky left-0 bg-slate-50/80 hover:bg-slate-100 z-10" onClick={() => toggleCategory(category.id as string)}>
                            {category.subcategories.length > 0 ? (expandedCategories.includes(category.id as string) ? <ChevronDown size={16}/> : <ChevronRight size={16}/>) : <span className="w-4"></span>}
                            {category.name}
                          </td>
                          <td className="p-0 relative">
                            {category.subcategories.length > 0 ? (
                               <div className="w-full h-full flex items-center justify-end px-4 text-slate-500">{formatMoney(catPlanned)}</div>
                            ) : (
                               <div className="absolute inset-0 m-1">
                                 <input type="number" value={category.planned || ''} onChange={(e) => handleExpenseChange(category.id, null, e.target.value)}
                                   className="w-full h-full text-right bg-amber-50/50 focus:bg-white focus:ring-2 focus:ring-brand-500 rounded-md px-3 font-bold text-slate-800 outline-none" />
                               </div>
                            )}
                          </td>
                          <td className="p-4 text-center text-xs text-slate-500">{formatPercent(catPlanned, totalExpensePlanned)}</td>
                          {MONTHS.map(month => (
                            <td key={month} className={`p-4 text-right ${calculateCategoryTotal(category, month) > catPlanned ? 'text-rose-600 font-bold' : ''}`}>
                              {formatMoney(calculateCategoryTotal(category, month))}
                            </td>
                          ))}
                        </tr>

                        {expandedCategories.includes(category.id as string) && category.subcategories.map(sub => (
                          <tr key={sub.id} className="hover:bg-slate-50 text-slate-600 text-sm group">
                            <td className="p-4 pl-12 sticky left-0 bg-white hover:bg-slate-50 z-10 flex items-center justify-between pr-4 border-r border-slate-100">
                               <div className="flex items-center gap-2">
                                 <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div> {sub.name}
                               </div>
                               <button 
                                  onClick={() => toggleFixed('expense', category.id, sub.id)}
                                  className={`p-1 rounded-md opacity-0 group-hover:opacity-100 transition-all ${sub.isFixed ? 'text-blue-500 bg-blue-50' : 'text-orange-500 bg-orange-50'}`}
                                  title={sub.isFixed ? "Fixo" : "Variável"}
                                >
                                  {sub.isFixed ? <Repeat size={12} /> : <TrendingIcon size={12} />}
                                </button>
                            </td>
                            <td className="p-0 relative h-12">
                              <div className="absolute inset-0 m-1">
                                <input type="number" value={sub.planned || ''} onChange={(e) => handleExpenseChange(category.id, sub.id, e.target.value)}
                                  className="w-full h-full text-right bg-amber-50/20 focus:bg-white focus:ring-2 focus:ring-brand-500 rounded-md px-3 font-medium text-slate-700 outline-none" />
                              </div>
                            </td>
                            <td className="p-4 text-center text-xs text-slate-400">{formatPercent(sub.planned, totalExpensePlanned)}</td>
                            {MONTHS.map(month => {
                              const val = sub.realized[month] || 0;
                              return (
                                <td key={month} className={`p-4 text-right ${val > sub.planned ? 'text-rose-500 font-semibold' : ''}`}>
                                  {formatMoney(val)}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}