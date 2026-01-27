"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { 
  Wallet, Briefcase, Target, CreditCard, LogOut, 
  Menu, X, Eye, EyeOff, ChevronDown, ChevronRight, Settings,
  Repeat, TrendingUp, Plus, Trash2, Loader2, AlertCircle
} from "lucide-react";
import { MobileNav } from "../../components/MobileNav"; 
import { toast } from "sonner"; 

// --- TIPAGEM ---
type MonthlyValue = { [month: string]: number };

type PlanningItem = {
  id: string | number;
  name: string;
  planned: number;     // Meta (Digitável)
  isFixed: boolean;
  realized: MonthlyValue; // Automático (Vem das transações)
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

// --- COMPONENTE SIDEBAR ---
function Sidebar({ userEmail, onLogout }: any) {
  return (
    <aside className="w-72 bg-slate-900 hidden md:flex flex-col shadow-2xl z-10 relative shrink-0">
      <div className="p-8"><h1 className="text-3xl font-extrabold text-white flex items-center gap-3">Flui</h1></div>
      <nav className="flex-1 px-6 space-y-3 overflow-y-auto py-4 custom-scrollbar">
        <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Principal</p>
        <a href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all"><Wallet size={20} /> Dashboard</a>
        <a href="/planning" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-brand-600 text-white shadow-md"><Target size={20} /> Planejamento</a>
        
        <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mt-6 mb-2">Gestão</p>
        <a href="/investments" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all"><Briefcase size={20} /> Investimentos</a>
        <a href="/goals" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all"><Target size={20} /> Metas</a>
        <a href="/credit-cards" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all"><CreditCard size={20} /> Cartões</a>
      </nav>
      <div className="p-6 m-4 flex flex-col items-center text-center">
        <p className="text-sm text-white mb-4 truncate w-full">{userEmail}</p>
        <button onClick={onLogout} className="flex items-center justify-center gap-2 px-4 py-2 text-sm text-slate-300 border border-slate-700 rounded-xl hover:bg-slate-800 w-full"><LogOut size={16} /> Sair</button>
      </div>
    </aside>
  );
}

// --- PÁGINA PRINCIPAL ---
export default function PlanningPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [areValuesVisible, setAreValuesVisible] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  
  const [incomes, setIncomes] = useState<PlanningItem[]>([]);
  const [expenses, setExpenses] = useState<ExpenseCategory[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // --- 1. CARREGAR DADOS REAIS DO SUPABASE ---
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }
      setUserEmail(user.email ?? null);

      // A. Buscar Transações
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount, type, date, description, category_id, categories(name)')
        .eq('user_id', user.id);

      // B. Buscar Categorias
      const { data: categories } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id);

      if (transactions && categories) {
        processRealData(categories, transactions);
      }
      setLoading(false);
    };

    loadData();
  }, [router]);

  // --- 2. PROCESSAR DADOS COM FILTRO "LIMPEZA" ---
  const processRealData = (categoriesDb: any[], transactionsDb: any[]) => {
    
    // Preparar estrutura base das despesas usando todas as categorias do banco
    const expensesMap: ExpenseCategory[] = categoriesDb.filter(c => c.type === 'EXPENSE').map(c => ({
      id: c.id,
      name: c.name,
      planned: 0, 
      realized: { jan: 0, fev: 0, mar: 0, abr: 0, mai: 0, jun: 0 },
      subcategories: [] 
    }));

    // Preparar receitas
    const incomesList: PlanningItem[] = [
      { id: 'salary', name: "Salário / Receitas", planned: 0, isFixed: true, realized: { jan: 0, fev: 0, mar: 0, abr: 0, mai: 0, jun: 0 } }
    ];

    // Mapear transações para os meses corretos
    transactionsDb.forEach(t => {
      const date = new Date(t.date);
      const monthIndex = date.getMonth(); 
      const monthKey = MONTHS[monthIndex]; 
      
      if (!monthKey) return; 

      if (t.type === 'EXPENSE') {
        const category = expensesMap.find(c => c.id === t.category_id);
        if (category) {
          category.realized[monthKey] = (category.realized[monthKey] || 0) + t.amount;
        }
      } else if (t.type === 'INCOME') {
        incomesList[0].realized[monthKey] += t.amount;
      }
    });

    // --- ATUALIZAÇÃO: FILTRO PARA ESCONDER CATEGORIAS VAZIAS ---
    // Só mostramos categorias que tenham META (planned > 0) OU algum GASTO (realized > 0)
    const activeExpenses = expensesMap.filter(cat => {
        const hasPlanned = cat.planned > 0;
        // Verifica se existe algum valor maior que zero em qualquer mês
        const hasRealized = Object.values(cat.realized).some(val => val > 0);
        return hasPlanned || hasRealized;
    });

    setExpenses(activeExpenses);
    setIncomes(incomesList);
  };

  // --- CÁLCULOS DINÂMICOS (Somas) ---
  const calculateCategoryTotal = (cat: ExpenseCategory, type: 'planned' | string) => {
    if (type === 'planned') return cat.planned;
    return cat.realized[type] || 0;
  };

  const getTotalIncome = (month: string) => incomes.reduce((acc, item) => acc + (item.realized[month] || 0), 0);
  const getTotalExpense = (month: string) => expenses.reduce((acc, cat) => acc + calculateCategoryTotal(cat, month), 0);
  
  const totalIncomePlanned = incomes.reduce((acc, item) => acc + item.planned, 0);
  const totalExpensePlanned = expenses.reduce((acc, cat) => acc + calculateCategoryTotal(cat, 'planned'), 0);

  const getMonthlyBalance = (month: string) => getTotalIncome(month) - getTotalExpense(month);
  const balancePlanned = totalIncomePlanned - totalExpensePlanned;

  // --- INTERAÇÕES DO USUÁRIO ---
  const handleMetaChange = (type: 'income' | 'expense', id: string | number, val: string) => {
    const value = parseFloat(val) || 0;
    if (type === 'income') {
      setIncomes(prev => prev.map(i => i.id === id ? { ...i, planned: value } : i));
    } else {
      setExpenses(prev => prev.map(c => c.id === id ? { ...c, planned: value } : c));
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
            Planejamento Dinâmico
            <button onClick={() => setAreValuesVisible(!areValuesVisible)} className="ml-2 p-2 rounded-full hover:bg-slate-100 text-slate-400">
              {areValuesVisible ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
          </h2>
          {loading && <div className="flex items-center gap-2 text-brand-600 text-sm font-bold animate-pulse"><Loader2 className="animate-spin" size={16}/> Sincronizando...</div>}
        </header>

        <div className="p-4 md:p-8 max-w-full mx-auto">
          
          {/* AVISO DE INTEGRAÇÃO */}
          {!loading && expenses.length === 0 && (
             <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3 text-blue-700">
                <AlertCircle size={24} />
                <p className="text-sm">
                  <strong>Dica:</strong> As categorias aparecem aqui automaticamente quando você as cria ou quando define uma meta. 
                  Os valores nos meses (Jan, Fev...) são preenchidos sozinhos conforme você lança suas transações no Dashboard!
                </p>
             </div>
          )}

          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border-0 overflow-hidden">
            <div className="overflow-x-auto pb-4">
              <table className="w-full text-left border-collapse min-w-[1200px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 text-xs uppercase tracking-wider font-bold">
                    <th className="p-4 pl-6 sticky left-0 bg-slate-100 z-10 border-b border-slate-200 min-w-[250px]">Categorias</th>
                    <th className="p-4 text-right bg-amber-50 text-amber-800 border-x border-amber-100 min-w-[140px] border-b border-slate-200">Meta (R$)</th>
                    <th className="p-4 text-center min-w-[60px] border-b border-slate-200">%</th>
                    {MONTHS.map(month => (
                      <th key={month} className="p-4 text-right min-w-[120px] whitespace-nowrap border-b border-slate-200">{MONTH_LABELS[month]}</th>
                    ))}
                  </tr>
                  
                  {/* SALDO MENSAL */}
                  <tr className="bg-slate-50 font-extrabold text-slate-800 border-b-2 border-slate-200">
                    <td className="p-4 pl-6 sticky left-0 bg-slate-50 z-10 text-slate-500 uppercase text-xs tracking-wider">Saldo Realizado</td>
                    <td className={`p-4 text-right ${balancePlanned >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatMoney(balancePlanned)}
                    </td>
                    <td className="p-4 text-center text-slate-400">-</td>
                    {MONTHS.map(month => {
                      const bal = getMonthlyBalance(month);
                      return <td key={month} className={`p-4 text-right ${bal >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatMoney(bal)}</td>;
                    })}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-50">
                  
                  {/* === RECEITAS === */}
                  <tr className="bg-emerald-600 text-white font-bold text-sm">
                    <td className="p-4 pl-6 sticky left-0 bg-emerald-600 z-10">Receitas Totais</td>
                    <td className="p-4 text-right bg-emerald-700/50">{formatMoney(totalIncomePlanned)}</td>
                    <td className="p-4 text-center">100%</td>
                    {MONTHS.map(month => <td key={month} className="p-4 text-right">{formatMoney(getTotalIncome(month))}</td>)}
                  </tr>
                  
                  {incomes.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors font-medium text-slate-700">
                      <td className="p-4 pl-10 sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-100">
                        {item.name}
                      </td>
                      <td className="p-0 relative">
                        <div className="absolute inset-0 m-1">
                          <input type="number" value={item.planned || ''} onChange={(e) => handleMetaChange('income', item.id, e.target.value)}
                            className="w-full h-full text-right bg-amber-50/30 focus:bg-white focus:ring-2 focus:ring-brand-500 rounded-md px-3 font-bold text-slate-700 outline-none" placeholder="Definir Meta" />
                        </div>
                      </td>
                      <td className="p-4 text-center text-xs text-slate-400">{formatPercent(item.planned, totalIncomePlanned)}</td>
                      {MONTHS.map(month => <td key={month} className="p-4 text-right text-slate-500 text-sm">{formatMoney(item.realized[month] || 0)}</td>)}
                    </tr>
                  ))}

                  <tr><td colSpan={3 + MONTHS.length} className="h-4 bg-slate-50"></td></tr>

                  {/* === DESPESAS === */}
                  <tr className="bg-rose-600 text-white font-bold text-sm">
                    <td className="p-4 pl-6 sticky left-0 bg-rose-600 z-10">Despesas Totais</td>
                    <td className="p-4 text-right bg-rose-700/50">{formatMoney(totalExpensePlanned)}</td>
                    <td className="p-4 text-center opacity-90">{formatPercent(totalExpensePlanned, totalIncomePlanned)}</td>
                    {MONTHS.map(month => <td key={month} className="p-4 text-right">{formatMoney(getTotalExpense(month))}</td>)}
                  </tr>

                  {expenses.map(category => {
                    return (
                      <tr key={category.id} className="bg-white hover:bg-slate-50 group border-b border-slate-50">
                        <td className="p-4 pl-6 sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-100 font-bold text-slate-700">
                           {category.name}
                        </td>
                        {/* COLUNA META (EDITÁVEL) */}
                        <td className="p-0 relative">
                           <div className="absolute inset-0 m-1">
                             <input type="number" value={category.planned || ''} onChange={(e) => handleMetaChange('expense', category.id, e.target.value)}
                               className="w-full h-full text-right bg-amber-50/50 focus:bg-white focus:ring-2 focus:ring-brand-500 rounded-md px-3 font-bold text-slate-800 outline-none" placeholder="0,00" />
                           </div>
                        </td>
                        <td className="p-4 text-center text-xs text-slate-500">{formatPercent(category.planned, totalExpensePlanned)}</td>
                        
                        {/* COLUNAS DOS MESES (AUTOMÁTICAS) */}
                        {MONTHS.map(month => {
                          const val = category.realized[month] || 0;
                          const isOverBudget = category.planned > 0 && val > category.planned;
                          return (
                            <td key={month} className={`p-4 text-right transition-colors ${isOverBudget ? 'text-red-600 font-extrabold bg-red-50/30' : 'text-slate-600'}`}>
                              {formatMoney(val)}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                  
                  {expenses.length === 0 && !loading && (
                    <tr>
                      <td colSpan={3 + MONTHS.length} className="p-8 text-center text-slate-400">
                        Nenhuma categoria encontrada. Crie uma transação no Dashboard para começar!
                      </td>
                    </tr>
                  )}

                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
