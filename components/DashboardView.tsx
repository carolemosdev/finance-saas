"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { useTheme } from "next-themes"; 
import { 
  Wallet, TrendingUp, TrendingDown, Target, Plus, 
  Eye, EyeOff, Sun, Moon 
} from "lucide-react";
import { NewTransactionModal } from "./NewTransactionModal"; 
import { Sidebar } from "./Sidebar"; 
import { MobileNav } from "./MobileNav"; 
import { InsightsWidget } from "./InsightsWidget"; 
import { WhatsNewModal } from "./WhatsNewModal"; // <--- IMPORT DO MODAL DE NOVIDADES
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';

const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

interface DashboardProps {
  transactions: any[];
  categories: any[];
  cards: any[];
  assets: any[];
  goals: any[];
  userEmail: string | null;
  userId: string;
  totalInvested: number;
}

export function DashboardView({ 
  transactions = [], 
  categories = [], 
  cards = [], 
  userEmail, 
  userId 
}: DashboardProps) {
  
  const router = useRouter();
  
  // --- ESTADOS DE PRIVACIDADE, TEMA E NOVIDADES ---
  const { resolvedTheme, setTheme } = useTheme(); 
  const [mounted, setMounted] = useState(false);
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [showWhatsNew, setShowWhatsNew] = useState(false); // <--- ESTADO DO MODAL

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setMounted(true);
    // Recupera a preferência salva do usuário (Privacidade)
    const savedPrivacy = localStorage.getItem("flui_privacy_mode");
    if (savedPrivacy === "true") setIsPrivacyMode(true);

    // Verifica se já viu as novidades da versão 2.0
    const version = "v2.0"; 
    if (localStorage.getItem("flui_version_seen") !== version) {
      setShowWhatsNew(true);
      localStorage.setItem("flui_version_seen", version); // Marca como visto
    }
  }, []);

  const togglePrivacy = () => {
    const newValue = !isPrivacyMode;
    setIsPrivacyMode(newValue);
    localStorage.setItem("flui_privacy_mode", String(newValue));
  };

  const { summary, areaChartData, categoryStats, budgetProgress, filteredTransactions } = useMemo(() => {
    const filtered = transactions.filter(t => {
      const d = new Date(t.date);
      const dateOffset = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
      return dateOffset.getMonth() === selectedMonth && dateOffset.getFullYear() === selectedYear;
    });

    const income = filtered.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + Number(t.amount), 0);
    const expense = filtered.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + Number(t.amount), 0);
    const balance = income - expense;

    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const dailyDataMap: any = {};
    for(let i=1; i<=daysInMonth; i++) dailyDataMap[i] = { day: i, income: 0, expense: 0 };

    filtered.forEach(t => {
      const d = new Date(t.date);
      const userDay = new Date(d.getTime() + d.getTimezoneOffset() * 60000).getDate();
      if (dailyDataMap[userDay]) {
        if (t.type === 'INCOME') dailyDataMap[userDay].income += t.amount;
        else dailyDataMap[userDay].expense += t.amount;
      }
    });
    const areaData = Object.values(dailyDataMap);

    const catStats = categories
      .filter(c => c.type === 'EXPENSE')
      .map(cat => {
        const spent = filtered
          .filter(t => t.category_id === cat.id && t.type === 'EXPENSE')
          .reduce((acc, t) => acc + t.amount, 0);
        
        const budget = Number(cat.budget) || 0;
        const percent = budget > 0 ? (spent / budget) * 100 : 0;

        return { name: cat.name, spent, budget, percent };
      })
      .filter(c => c.spent > 0 || c.budget > 0)
      .sort((a, b) => b.percent - a.percent); 

    const totalBudget = catStats.reduce((acc, c) => acc + c.budget, 0);
    const totalSpent = catStats.reduce((acc, c) => acc + c.spent, 0);
    const progress = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    return {
      summary: { income, expense, balance },
      areaChartData: areaData,
      categoryStats: catStats,
      budgetProgress: progress,
      filteredTransactions: filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) 
    };
  }, [transactions, categories, selectedMonth, selectedYear]);

  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/auth"); };
  const handleSuccess = () => { setIsModalOpen(false); router.refresh(); };
  
  const formatMoney = (val: number) => {
    if (isPrivacyMode) return "R$ •••••";
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans flex-col md:flex-row dark:bg-slate-950 dark:text-slate-100 transition-colors duration-300">
      
      <MobileNav userEmail={userEmail} onLogout={handleLogout} />
      <Sidebar userEmail={userEmail} onLogout={handleLogout} />

      <main className="flex-1 overflow-y-auto relative z-0 p-4 md:p-8">
        
        {/* --- CABEÇALHO SUPERIOR --- */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-6">
           <div className="flex items-center gap-4">
              <h2 className="text-2xl font-extrabold text-slate-800 hidden md:block dark:text-slate-100">Balanço Mensal</h2>
              
              <div className="flex bg-white rounded-lg shadow-sm border border-slate-200 p-1 dark:bg-slate-900 dark:border-slate-800">
                 <select 
                   value={selectedMonth} 
                   onChange={(e) => setSelectedMonth(Number(e.target.value))}
                   className="bg-transparent text-sm font-bold text-slate-600 outline-none px-2 py-1 cursor-pointer dark:text-slate-300 dark:bg-slate-900"
                 >
                    {MONTH_NAMES.map((m, i) => <option key={i} value={i}>{m}</option>)}
                 </select>
                 <select 
                   value={selectedYear} 
                   onChange={(e) => setSelectedYear(Number(e.target.value))}
                   className="bg-transparent text-sm font-bold text-slate-600 outline-none px-2 py-1 border-l border-slate-200 cursor-pointer dark:text-slate-300 dark:bg-slate-900 dark:border-slate-800"
                 >
                    <option value={2024}>2024</option>
                    <option value={2025}>2025</option>
                    <option value={2026}>2026</option>
                 </select>
              </div>
           </div>

           <div className="flex flex-col md:flex-row items-start md:items-center gap-6 w-full xl:w-auto">
              <div className="flex gap-6 overflow-x-auto pb-2 md:pb-0 scrollbar-hide w-full md:w-auto">
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"><TrendingUp size={20}/></div>
                    <div><p className="text-[10px] uppercase font-bold text-slate-400">Receitas</p><p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatMoney(summary.income)}</p></div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="p-2 bg-rose-100 rounded-lg text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"><TrendingDown size={20}/></div>
                    <div><p className="text-[10px] uppercase font-bold text-slate-400">Despesas</p><p className="text-lg font-bold text-rose-600 dark:text-rose-400">{formatMoney(summary.expense)}</p></div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="p-2 bg-brand-100 rounded-lg text-brand-600 dark:bg-brand-900/30 dark:text-brand-400"><Wallet size={20}/></div>
                    <div><p className="text-[10px] uppercase font-bold text-slate-400">Saldo Atual</p><p className={`text-lg font-bold ${summary.balance >= 0 ? 'text-brand-600 dark:text-brand-400' : 'text-rose-600 dark:text-rose-400'}`}>{formatMoney(summary.balance)}</p></div>
                  </div>
              </div>

              <div className="hidden md:block w-px h-8 bg-slate-200 dark:bg-slate-800"></div>

              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
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

                 <button onClick={() => setIsModalOpen(true)} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl active:scale-95 dark:bg-brand-600 dark:hover:bg-brand-700 font-bold">
                    <Plus size={18}/> Nova Transação
                 </button>
              </div>
           </div>
        </div>

        <InsightsWidget transactions={transactions} balance={summary.balance} />

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 xl:col-span-2 flex flex-col min-h-[350px] dark:bg-slate-900 dark:border-slate-800 transition-colors duration-300">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">Evolução Diária</h3>
                 <div className="flex gap-3 text-xs font-bold">
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Entradas</span>
                    <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400"><div className="w-2 h-2 rounded-full bg-rose-500"></div> Saídas</span>
                 </div>
              </div>
              <div className="flex-1 w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={areaChartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                       <defs>
                          <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                             <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#e11d48" stopOpacity={0.1}/>
                             <stop offset="95%" stopColor="#e11d48" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={resolvedTheme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(148, 163, 184, 0.2)'} />
                       <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                       <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} tickFormatter={(v) => isPrivacyMode ? '•••' : `R$${v}`} />
                       <Tooltip 
                         contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: resolvedTheme === 'dark' ? '#1e293b' : '#fff', color: resolvedTheme === 'dark' ? '#fff' : '#000'}} 
                         formatter={(value: any) => [formatMoney(value), "Valor"]} 
                       />
                       <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                       <Area type="monotone" dataKey="expense" stroke="#e11d48" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </div>

           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col dark:bg-slate-900 dark:border-slate-800 transition-colors duration-300">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6 dark:text-slate-400">Orçamento do Mês</h3>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-5 max-h-[300px] xl:max-h-none">
                 {categoryStats.length === 0 ? (
                    <div className="text-center text-slate-400 py-10 text-sm">
                       <p>Nenhum gasto ou meta definida.</p>
                       <button onClick={() => router.push('/planning')} className="text-brand-600 hover:underline dark:text-brand-400 mt-2 font-bold">Configurar Orçamento</button>
                    </div>
                 ) : categoryStats.map((cat, idx) => (
                    <div key={idx}>
                       <div className="flex justify-between text-xs font-bold mb-1.5">
                          <span className="text-slate-700 truncate max-w-[120px] dark:text-slate-300">{cat.name}</span>
                          <div className="flex gap-2">
                             <span className={`${cat.percent > 100 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}>{cat.percent.toFixed(0)}%</span>
                             <span className="text-slate-800 dark:text-slate-100">{formatMoney(cat.spent)}</span>
                          </div>
                       </div>
                       <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden dark:bg-slate-800">
                          <div className={`h-full rounded-full transition-all duration-500 ${cat.percent > 100 ? 'bg-rose-500' : 'bg-brand-500'}`} style={{ width: `${Math.min(cat.percent, 100)}%` }}></div>
                       </div>
                    </div>
                 ))}
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                 <div>
                    <p className="text-xs text-slate-400 font-bold uppercase">Uso Geral</p>
                    <p className="text-2xl font-extrabold text-brand-600 dark:text-brand-400">{budgetProgress.toFixed(0)}%</p>
                    <p className="text-[10px] text-slate-400">do orçamento planejado</p>
                 </div>
                 <div className="w-16 h-16 relative">
                    <ResponsiveContainer>
                       <PieChart>
                          <Pie data={[{value: budgetProgress}, {value: Math.max(0, 100-budgetProgress)}]} dataKey="value" innerRadius={20} outerRadius={30} startAngle={90} endAngle={-270}>
                             <Cell fill={budgetProgress > 100 ? '#e11d48' : '#4f46e5'} />
                             <Cell fill={resolvedTheme === 'dark' ? '#1e293b' : '#f1f5f9'} />
                          </Pie>
                       </PieChart>
                    </ResponsiveContainer>
                 </div>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 min-h-[300px] flex flex-col dark:bg-slate-900 dark:border-slate-800 transition-colors duration-300">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6 dark:text-slate-400">Top Categorias (Gastos)</h3>
              <div className="flex-1 w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryStats.slice(0, 7)} barSize={30}>
                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} interval={0} />
                       <Tooltip cursor={{fill: resolvedTheme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(148, 163, 184, 0.1)'}} contentStyle={{borderRadius: '8px', border: 'none', backgroundColor: resolvedTheme === 'dark' ? '#1e293b' : '#fff', color: resolvedTheme === 'dark' ? '#fff' : '#000'}} formatter={(value: any) => [formatMoney(value), "Gasto"]} />
                       <Bar dataKey="spent" radius={[4, 4, 0, 0]}>
                          {categoryStats.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={index === 0 ? '#f97316' : '#fb923c'} /> 
                          ))}
                       </Bar>
                    </BarChart>
                 </ResponsiveContainer>
              </div>
           </div>

           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col dark:bg-slate-900 dark:border-slate-800 transition-colors duration-300">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6 dark:text-slate-400">Últimas Movimentações</h3>
              <div className="flex-1 space-y-4 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                 {filteredTransactions.length === 0 ? (
                    <p className="text-center text-slate-400 text-sm mt-10">Nenhuma movimentação neste mês.</p>
                 ) : filteredTransactions.slice(0, 10).map((t: any) => (
                    <div key={t.id} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors">
                       <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${t.type === 'INCOME' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                             {t.type === 'INCOME' ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}
                          </div>
                          <div>
                             <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{t.description}</p>
                             <p className="text-[10px] text-slate-500 font-bold uppercase dark:text-slate-400">{t.categories?.name || "Geral"} • {new Date(t.date).toLocaleDateString('pt-BR')} {t.type === 'EXPENSE' && t.credit_card_id && !t.is_paid ? '💳 (Crédito)' : ''}</p>
                          </div>
                       </div>
                       <span className={`text-sm font-bold ${t.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {t.type === 'INCOME' ? '+' : '-'} {formatMoney(t.amount)}
                       </span>
                    </div>
                 ))}
              </div>
           </div>
        </div>

      </main>

      <button onClick={() => setIsModalOpen(true)} className="md:hidden fixed bottom-6 right-6 bg-brand-600 text-white p-4 rounded-full shadow-2xl z-50 hover:scale-105 transition-transform dark:bg-brand-500">
         <Plus size={24}/>
      </button>

      {/* MODAIS AQUI NO FINAL */}
      <NewTransactionModal isOpen={isModalOpen} onClose={handleSuccess} userId={userId} onSuccess={handleSuccess} />
      
      {/* O MODAL DE NOVIDADES */}
      <WhatsNewModal isOpen={showWhatsNew} onClose={() => setShowWhatsNew(false)} />
    </div>
  );
}