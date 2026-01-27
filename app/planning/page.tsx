"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { 
  Wallet, Briefcase, Target, CreditCard, LogOut, 
  Eye, EyeOff, ChevronDown, ChevronRight,
  TrendingUp, Calendar, AlertCircle, Plus
} from "lucide-react";
import { MobileNav } from "../../components/MobileNav"; 
import { toast } from "sonner"; 

// --- CONFIGURAÇÃO ---
const ALL_MONTH_KEYS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MONTH_LABELS: { [key: string]: string } = { 
  'jan': 'JAN', 'fev': 'FEV', 'mar': 'MAR', 'abr': 'ABR', 'mai': 'MAI', 'jun': 'JUN',
  'jul': 'JUL', 'ago': 'AGO', 'set': 'SET', 'out': 'OUT', 'nov': 'NOV', 'dez': 'DEZ'
};

// --- TIPAGEM ---
type MonthlyValue = { [month: string]: number };

type PlanningItem = {
  id: string | number;
  name: string;
  planned: number;     
  isFixed?: boolean; // Opcional para evitar erros se não vier do banco
  realized: MonthlyValue; 
};

type ExpenseCategory = {
  id: string | number;
  name: string;
  planned: number;
  realized: MonthlyValue;
  subcategories: PlanningItem[];
};

// --- SIDEBAR ---
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
  const [visibleMonths, setVisibleMonths] = useState<string[]>([]);

  // 1. Configurar Janela de Tempo
  useEffect(() => {
    const today = new Date();
    const currentMonthIndex = today.getMonth(); 
    const nextMonths = [];
    for (let i = 0; i < 6; i++) {
        const index = (currentMonthIndex + i) % 12;
        nextMonths.push(ALL_MONTH_KEYS[index]);
    }
    setVisibleMonths(nextMonths);
  }, []);

  // 2. Carregar Dados Reais
  const loadData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth"); return; }
    setUserEmail(user.email ?? null);

    const { data: categories } = await supabase.from('categories').select('*').eq('user_id', user.id);
    const { data: transactions } = await supabase.from('transactions').select('amount, type, date, category_id').eq('user_id', user.id);

    if (categories) {
      processRealData(categories, transactions || []);
    } else {
      setExpenses([]); 
      setIncomes([]);
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [router]);

  // 3. Processamento e FILTRO RIGOROSO
  const processRealData = (categoriesDb: any[], transactionsDb: any[]) => {
    
    // A. Mapeia CATEGORIAS DE DESPESA
    const expensesMap: ExpenseCategory[] = categoriesDb.filter(c => c.type === 'EXPENSE').map(c => ({
      id: c.id, 
      name: c.name, 
      planned: Number(c.budget) || 0,
      realized: {}, 
      subcategories: [] 
    }));

    // B. Mapeia CATEGORIAS DE RECEITA (NOVO: Agora dinâmico igual despesas)
    const incomesMap: PlanningItem[] = categoriesDb.filter(c => c.type === 'INCOME').map(c => ({
      id: c.id,
      name: c.name,
      planned: Number(c.budget) || 0,
      isFixed: false, 
      realized: {}
    }));

    // C. Preenche Valores (Distribui nos meses corretos)
    transactionsDb.forEach(t => {
      const date = new Date(t.date);
      // Ajuste de fuso horário
      const userTimezoneOffset = date.getTimezoneOffset() * 60000;
      const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
      const monthKey = ALL_MONTH_KEYS[adjustedDate.getMonth()];

      if (t.type === 'EXPENSE') {
        const cat = expensesMap.find(c => c.id === t.category_id);
        if (cat) {
          cat.realized[monthKey] = (cat.realized[monthKey] || 0) + Number(t.amount);
        }
      } else if (t.type === 'INCOME') {
        // Agora busca a categoria específica de receita
        const cat = incomesMap.find(c => c.id === t.category_id);
        if (cat) {
          cat.realized[monthKey] = (cat.realized[monthKey] || 0) + Number(t.amount);
        }
      }
    });

    // D. O FILTRO MATADOR: Remove categorias "fantasmas"
    // Função auxiliar para verificar se a categoria deve aparecer
    const shouldShow = (cat: any) => {
        const totalRealized = Object.values(cat.realized as MonthlyValue).reduce((acc, val) => acc + val, 0);
        return totalRealized > 0 || cat.planned > 0;
    };

    const activeExpenses = expensesMap.filter(shouldShow);
    const activeIncomes = incomesMap.filter(shouldShow);

    setExpenses(activeExpenses);
    setIncomes(activeIncomes);
  };

  // --- Helpers e Handlers ---
  const calculateCategoryTotal = (cat: ExpenseCategory, type: 'planned' | string) => {
    if (type === 'planned') return cat.planned;
    return cat.realized[type] || 0;
  };

  const getTotalIncome = (month: string) => incomes.reduce((acc, item) => acc + (item.realized[month] || 0), 0);
  const getTotalExpense = (month: string) => expenses.reduce((acc, cat) => acc + calculateCategoryTotal(cat, month), 0);
  const totalIncomePlanned = incomes.reduce((acc, item) => acc + item.planned, 0);
  const totalExpensePlanned = expenses.reduce((acc, cat) => acc + calculateCategoryTotal(cat, 'planned'), 0);
  const getMonthlyBalance = (month: string) => getTotalIncome(month) - getTotalExpense(month);

  const handleMetaChange = (type: 'income' | 'expense', id: string | number, val: string) => {
    const value = parseFloat(val) || 0;
    if (type === 'income') setIncomes(prev => prev.map(i => i.id === id ? { ...i, planned: value } : i));
    else setExpenses(prev => prev.map(c => c.id === id ? { ...c, planned: value } : c));
  };

  const handleMetaBlur = async (id: string | number, val: string) => {
      const value = parseFloat(val) || 0;
      if (typeof id === 'number' || !isNaN(Number(id))) {
        await supabase.from('categories').update({ budget: value }).eq('id', id);
        if (value > 0) loadData(); // Recarrega se definiu meta, para garantir que apareça
      }
  };

  const formatMoney = (val: number) => !areValuesVisible ? "••••••" : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const formatPercent = (val: number, total: number) => total === 0 ? "0%" : `${((val / total) * 100).toFixed(0)}%`;
  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/auth"); };
  const toggleCategory = (id: string) => setExpandedCategories(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const currentMonthKey = visibleMonths[0]; 
  const currentBalance = getMonthlyBalance(currentMonthKey);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans flex-col md:flex-row">
      <MobileNav userEmail={userEmail} onLogout={handleLogout} />
      <Sidebar userEmail={userEmail} onLogout={handleLogout} />

      <main className="flex-1 overflow-y-auto relative z-0">
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-slate-200 px-8 py-5 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-3">
              Planejamento
              <button onClick={() => setAreValuesVisible(!areValuesVisible)} className="ml-2 p-2 rounded-full hover:bg-slate-100 text-slate-400">
                {areValuesVisible ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="text-right">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Saldo ({MONTH_LABELS[currentMonthKey]})</p>
                <p className={`text-2xl font-extrabold ${currentBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                   {formatMoney(currentBalance)}
                </p>
             </div>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-full mx-auto">
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border-0 overflow-hidden">
            <div className="overflow-x-auto pb-4">
              <table className="w-full text-left border-collapse min-w-[1200px]">
                
                <thead>
                  {/* LINHA SALDO */}
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="p-4 pl-6 text-sm font-bold text-slate-400 uppercase tracking-wider bg-slate-50 sticky left-0 z-20 text-right" colSpan={3}>
                      Resultado do Mês
                    </th>
                    {visibleMonths.map((month, index) => {
                      const bal = getMonthlyBalance(month);
                      return (
                        <th key={month} className="p-4 text-right min-w-[120px]">
                           <span className={`text-base font-extrabold ${bal >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                             {formatMoney(bal)}
                           </span>
                        </th>
                      );
                    })}
                  </tr>

                  {/* CABEÇALHO */}
                  <tr className="bg-slate-100 text-slate-600 text-xs uppercase tracking-wider font-bold">
                    <th className="p-4 pl-6 sticky left-0 bg-slate-100 z-10 border-b border-slate-200 min-w-[280px]">Categorias</th>
                    <th className="p-4 text-center border-x border-slate-200 min-w-[140px] border-b bg-amber-50 text-amber-800">Meta</th>
                    <th className="p-4 text-center min-w-[60px] border-b border-slate-200">%</th>
                    
                    {visibleMonths.map((month, index) => (
                      <th key={month} className="p-4 text-right min-w-[120px] whitespace-nowrap border-b border-slate-200">
                         {MONTH_LABELS[month]} {index === 0 && <span className="ml-1 text-[9px] bg-brand-600 text-white px-1.5 py-0.5 rounded-full relative -top-0.5">VIGENTE</span>}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-50">
                  
                  {/* === RECEITAS === */}
                  <tr className="bg-emerald-600 text-white font-bold text-sm">
                    <td className="p-4 pl-6 sticky left-0 bg-emerald-600 z-10">Receitas Totais</td>
                    <td className="p-4 text-right bg-emerald-700/50">{formatMoney(totalIncomePlanned)}</td>
                    <td className="p-4 text-center">100%</td>
                    {visibleMonths.map(month => <td key={month} className="p-4 text-right">{formatMoney(getTotalIncome(month))}</td>)}
                  </tr>
                  
                  {incomes.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors font-medium text-slate-700">
                      <td className="p-4 pl-10 sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-100 flex items-center gap-2">
                        {item.name}
                      </td>
                      {/* Meta Receita */}
                      <td className="p-0 relative bg-amber-50/30">
                        <div className="absolute inset-0 m-1">
                          <input type="number" 
                            value={item.planned || ''} 
                            onChange={(e) => handleMetaChange('income', item.id, e.target.value)}
                            onBlur={(e) => handleMetaBlur(item.id, e.target.value)}
                            className="w-full h-full text-right bg-transparent focus:bg-white focus:ring-2 focus:ring-emerald-500 rounded-md px-3 font-bold text-slate-700 outline-none placeholder:text-slate-300" placeholder="0,00" />
                        </div>
                      </td>
                      <td className="p-4 text-center text-xs text-slate-400">{formatPercent(item.planned, totalIncomePlanned)}</td>
                      {visibleMonths.map((month, index) => (
                        <td key={month} className="p-4 text-right text-slate-600 text-sm">
                          {formatMoney(item.realized[month] || 0)}
                        </td>
                      ))}
                    </tr>
                  ))}

                  <tr><td colSpan={3 + visibleMonths.length} className="h-6 bg-slate-50 border-y border-slate-100"></td></tr>

                  {/* === DESPESAS === */}
                  <tr className="bg-rose-600 text-white font-bold text-sm">
                    <td className="p-4 pl-6 sticky left-0 bg-rose-600 z-10">Despesas Totais</td>
                    <td className="p-4 text-right bg-rose-700/50">{formatMoney(totalExpensePlanned)}</td>
                    <td className="p-4 text-center opacity-90">{formatPercent(totalExpensePlanned, totalIncomePlanned)}</td>
                    {visibleMonths.map(month => <td key={month} className="p-4 text-right">{formatMoney(getTotalExpense(month))}</td>)}
                  </tr>

                  {expenses.map(category => {
                    const catPlanned = calculateCategoryTotal(category, 'planned');
                    return (
                      <tr key={category.id} className="bg-white hover:bg-slate-50 group border-b border-slate-50">
                        <td className="p-4 pl-6 sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-100 font-bold text-slate-700 flex items-center gap-2">
                           {category.name}
                        </td>
                        
                        {/* Meta Despesa */}
                        <td className="p-0 relative bg-amber-50/30">
                           <div className="absolute inset-0 m-1">
                             <input type="number" 
                               value={category.planned || ''} 
                               onChange={(e) => handleMetaChange('expense', category.id, e.target.value)}
                               onBlur={(e) => handleMetaBlur(category.id, e.target.value)}
                               className="w-full h-full text-right bg-transparent focus:bg-white focus:ring-2 focus:ring-rose-500 rounded-md px-3 font-bold text-slate-800 outline-none placeholder:text-slate-300" placeholder="0,00" />
                           </div>
                        </td>
                        
                        <td className="p-4 text-center text-xs text-slate-500">{formatPercent(catPlanned, totalExpensePlanned)}</td>
                        
                        {/* Meses Despesa */}
                        {visibleMonths.map((month, index) => {
                          const val = category.realized[month] || 0;
                          const isOverBudget = category.planned > 0 && val > category.planned;
                          return (
                            <td key={month} className={`p-4 text-right transition-colors ${isOverBudget ? 'text-red-600 font-bold' : 'text-slate-600'}`}>
                              {formatMoney(val)}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                  
                  {expenses.length === 0 && incomes.length === 0 && !loading && (
                    <tr>
                      <td colSpan={3 + visibleMonths.length} className="p-12 text-center text-slate-400 italic">
                        <div className="flex flex-col items-center gap-2">
                           <AlertCircle className="text-slate-300" size={32}/>
                           <p>Nenhuma movimentação ou meta encontrada.</p>
                           <a href="/" className="text-brand-600 hover:underline text-sm font-bold bg-brand-50 px-3 py-1 rounded-full mt-1 inline-block">Criar transação no Dashboard</a>
                        </div>
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
