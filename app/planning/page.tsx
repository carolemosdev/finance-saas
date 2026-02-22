"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { useTheme } from "next-themes"; // <-- IMPORT TEMA
import { 
  Eye, EyeOff, AlertCircle, Sun, Moon // <-- IMPORT ÍCONES
} from "lucide-react";
import { MobileNav } from "../../components/MobileNav"; 
import { Sidebar } from "../../components/Sidebar"; 
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
  isFixed?: boolean; 
  realized: MonthlyValue; 
};

type ExpenseCategory = {
  id: string | number;
  name: string;
  planned: number;
  realized: MonthlyValue;
  subcategories: PlanningItem[];
};

export default function PlanningPage() {
  const router = useRouter();
  
  // --- ESTADOS DE PRIVACIDADE E TEMA ---
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);

  const [loading, setLoading] = useState(true);
  
  const [incomes, setIncomes] = useState<PlanningItem[]>([]);
  const [expenses, setExpenses] = useState<ExpenseCategory[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [visibleMonths, setVisibleMonths] = useState<string[]>([]);

  // 1. Configurar Janela de Tempo
  useEffect(() => {
    setMounted(true);
    const savedPrivacy = localStorage.getItem("flui_privacy_mode");
    if (savedPrivacy === "true") setIsPrivacyMode(true);

    const today = new Date();
    const currentMonthIndex = today.getMonth(); 
    const nextMonths = [];
    for (let i = 0; i < 6; i++) {
        const index = (currentMonthIndex + i) % 12;
        nextMonths.push(ALL_MONTH_KEYS[index]);
    }
    setVisibleMonths(nextMonths);
    loadData();
  }, [router]);

  const togglePrivacy = () => {
    const newValue = !isPrivacyMode;
    setIsPrivacyMode(newValue);
    localStorage.setItem("flui_privacy_mode", String(newValue));
  };

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

    // B. Mapeia CATEGORIAS DE RECEITA
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
        const cat = incomesMap.find(c => c.id === t.category_id);
        if (cat) {
          cat.realized[monthKey] = (cat.realized[monthKey] || 0) + Number(t.amount);
        }
      }
    });

    // D. O FILTRO MATADOR: Remove categorias "fantasmas"
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
        if (value > 0) loadData(); 
      }
  };

  // --- FORMATADOR ATUALIZADO (Respeita Privacidade) ---
  const formatMoney = (val: number) => {
    if (isPrivacyMode) return "R$ •••••";
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatPercent = (val: number, total: number) => total === 0 ? "0%" : `${((val / total) * 100).toFixed(0)}%`;
  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/auth"); };

  const currentMonthKey = visibleMonths[0]; 
  const currentBalance = getMonthlyBalance(currentMonthKey);

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans flex-col md:flex-row dark:bg-slate-950 dark:text-slate-100">
      <MobileNav userEmail={userEmail} onLogout={handleLogout} />
      <Sidebar userEmail={userEmail} onLogout={handleLogout} />

      <main className="flex-1 overflow-y-auto relative z-0">
        <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-20 border-b border-slate-200 dark:border-slate-800 px-8 py-5 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-3 dark:text-slate-100">
              Planejamento
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Saldo ({currentMonthKey && MONTH_LABELS[currentMonthKey]})</p>
                <p className={`text-2xl font-extrabold ${currentBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                   {formatMoney(currentBalance)}
                </p>
              </div>

              <div className="w-px h-8 bg-slate-200 mx-2 hidden sm:block dark:bg-slate-700"></div>

              {/* --- BOTÕES DE AÇÃO (HEADER) --- */}
              <div className="flex items-center gap-2">
                 <button 
                    onClick={togglePrivacy} 
                    className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all shadow-sm active:scale-95 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                    title={isPrivacyMode ? "Mostrar Valores" : "Ocultar Valores"}
                 >
                    {isPrivacyMode ? <EyeOff size={18}/> : <Eye size={18}/>}
                 </button>

                 <button 
                    onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')} 
                    className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all shadow-sm active:scale-95 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                    title={resolvedTheme === 'dark' ? "Modo Claro" : "Modo Escuro"}
                 >
                    {resolvedTheme === 'dark' ? <Sun size={18}/> : <Moon size={18}/>}
                 </button>
              </div>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-full mx-auto">
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border-0 overflow-hidden dark:bg-slate-900 dark:shadow-none">
            <div className="overflow-x-auto pb-4">
              <table className="w-full text-left border-collapse min-w-[1200px]">
                
                <thead>
                  {/* LINHA SALDO */}
                  <tr className="bg-slate-50 border-b border-slate-200 dark:bg-slate-800/50 dark:border-slate-800">
                    <th className="p-4 pl-6 text-sm font-bold text-slate-400 uppercase tracking-wider bg-slate-50 sticky left-0 z-20 text-right dark:bg-slate-900" colSpan={3}>
                      Resultado do Mês
                    </th>
                    {visibleMonths.map((month) => {
                      const bal = getMonthlyBalance(month);
                      return (
                        <th key={month} className="p-4 text-right min-w-[120px]">
                           <span className={`text-base font-extrabold ${bal >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                             {formatMoney(bal)}
                           </span>
                        </th>
                      );
                    })}
                  </tr>

                  {/* CABEÇALHO */}
                  <tr className="bg-slate-100 text-slate-600 text-xs uppercase tracking-wider font-bold dark:bg-slate-800 dark:text-slate-400">
                    <th className="p-4 pl-6 sticky left-0 bg-slate-100 z-10 border-b border-slate-200 min-w-[280px] dark:bg-slate-800 dark:border-slate-700">Categorias</th>
                    <th className="p-4 text-center border-x border-slate-200 min-w-[140px] border-b bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:border-slate-700 dark:text-amber-400">Meta</th>
                    <th className="p-4 text-center min-w-[60px] border-b border-slate-200 dark:border-slate-700">%</th>
                    
                    {visibleMonths.map((month, index) => (
                      <th key={month} className="p-4 text-right min-w-[120px] whitespace-nowrap border-b border-slate-200 dark:border-slate-700">
                         {MONTH_LABELS[month]} {index === 0 && <span className="ml-1 text-[9px] bg-brand-600 text-white px-1.5 py-0.5 rounded-full relative -top-0.5 dark:bg-brand-500">VIGENTE</span>}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  
                  {/* === RECEITAS === */}
                  <tr className="bg-emerald-600 text-white font-bold text-sm dark:bg-emerald-800">
                    <td className="p-4 pl-6 sticky left-0 bg-emerald-600 z-10 dark:bg-emerald-800">Receitas Totais</td>
                    <td className="p-4 text-right bg-emerald-700/50 dark:bg-emerald-900/50">{formatMoney(totalIncomePlanned)}</td>
                    <td className="p-4 text-center">100%</td>
                    {visibleMonths.map(month => <td key={month} className="p-4 text-right">{formatMoney(getTotalIncome(month))}</td>)}
                  </tr>
                  
                  {incomes.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors font-medium text-slate-700 dark:hover:bg-slate-800/50 dark:text-slate-300">
                      <td className="p-4 pl-10 sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-100 flex items-center gap-2 dark:bg-slate-900 dark:border-slate-800 dark:group-hover:bg-slate-800">
                        {item.name}
                      </td>
                      <td className="p-0 relative bg-amber-50/30 dark:bg-amber-900/10">
                        <div className="absolute inset-0 m-1">
                          <input type="number" 
                            value={item.planned || ''} 
                            onChange={(e) => handleMetaChange('income', item.id, e.target.value)}
                            onBlur={(e) => handleMetaBlur(item.id, e.target.value)}
                            className="w-full h-full text-right bg-transparent focus:bg-white focus:ring-2 focus:ring-emerald-500 rounded-md px-3 font-bold text-slate-700 outline-none placeholder:text-slate-300 dark:text-slate-200 dark:focus:bg-slate-800 dark:placeholder:text-slate-600" placeholder="0,00" />
                        </div>
                      </td>
                      <td className="p-4 text-center text-xs text-slate-400">{formatPercent(item.planned, totalIncomePlanned)}</td>
                      {visibleMonths.map((month) => (
                        <td key={month} className="p-4 text-right text-slate-600 text-sm dark:text-slate-400">
                          {formatMoney(item.realized[month] || 0)}
                        </td>
                      ))}
                    </tr>
                  ))}

                  <tr><td colSpan={3 + visibleMonths.length} className="h-6 bg-slate-50 border-y border-slate-100 dark:bg-slate-950 dark:border-slate-800"></td></tr>

                  {/* === DESPESAS === */}
                  <tr className="bg-rose-600 text-white font-bold text-sm dark:bg-rose-800">
                    <td className="p-4 pl-6 sticky left-0 bg-rose-600 z-10 dark:bg-rose-800">Despesas Totais</td>
                    <td className="p-4 text-right bg-rose-700/50 dark:bg-rose-900/50">{formatMoney(totalExpensePlanned)}</td>
                    <td className="p-4 text-center opacity-90">{formatPercent(totalExpensePlanned, totalIncomePlanned)}</td>
                    {visibleMonths.map(month => <td key={month} className="p-4 text-right">{formatMoney(getTotalExpense(month))}</td>)}
                  </tr>

                  {expenses.map(category => {
                    const catPlanned = calculateCategoryTotal(category, 'planned');
                    return (
                      <tr key={category.id} className="bg-white hover:bg-slate-50 group border-b border-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/50 dark:border-slate-800">
                        <td className="p-4 pl-6 sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-100 font-bold text-slate-700 flex items-center gap-2 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 dark:group-hover:bg-slate-800">
                           {category.name}
                        </td>
                        
                        <td className="p-0 relative bg-amber-50/30 dark:bg-amber-900/10">
                           <div className="absolute inset-0 m-1">
                             <input type="number" 
                               value={category.planned || ''} 
                               onChange={(e) => handleMetaChange('expense', category.id, e.target.value)}
                               onBlur={(e) => handleMetaBlur(category.id, e.target.value)}
                               className="w-full h-full text-right bg-transparent focus:bg-white focus:ring-2 focus:ring-rose-500 rounded-md px-3 font-bold text-slate-800 outline-none placeholder:text-slate-300 dark:text-slate-200 dark:focus:bg-slate-800 dark:placeholder:text-slate-600" placeholder="0,00" />
                           </div>
                        </td>
                        
                        <td className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">{formatPercent(catPlanned, totalExpensePlanned)}</td>
                        
                        {visibleMonths.map((month) => {
                          const val = category.realized[month] || 0;
                          const isOverBudget = category.planned > 0 && val > category.planned;
                          return (
                            <td key={month} className={`p-4 text-right transition-colors ${isOverBudget ? 'text-red-600 dark:text-red-400 font-bold' : 'text-slate-600 dark:text-slate-400'}`}>
                              {formatMoney(val)}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                  
                  {expenses.length === 0 && incomes.length === 0 && !loading && (
                    <tr>
                      <td colSpan={3 + visibleMonths.length} className="p-12 text-center text-slate-400 italic dark:text-slate-500">
                        <div className="flex flex-col items-center gap-2">
                           <AlertCircle className="text-slate-300 dark:text-slate-600" size={32}/>
                           <p>Nenhuma movimentação ou meta encontrada.</p>
                           <a href="/" className="text-brand-600 hover:underline text-sm font-bold bg-brand-50 px-3 py-1 rounded-full mt-1 inline-block dark:bg-brand-900/30 dark:text-brand-400">Criar transação no Dashboard</a>
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