"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { 
  Wallet, TrendingUp, TrendingDown, Target, CreditCard, LogOut, 
  Menu, Plus, PieChart as PieIcon, ArrowRight, X, Loader2
} from "lucide-react";
// Certifique-se que o caminho desses imports está correto no seu projeto
import { NewTransactionModal } from "./NewTransactionModal"; 
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';

// --- CONFIGURAÇÃO ---
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
  hasAnyTransaction?: boolean;
  hasAnyInvestment?: boolean;
}

export function DashboardView({ 
  transactions = [], 
  categories = [], 
  cards = [], 
  userEmail, 
  userId 
}: DashboardProps) {
  
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- FILTROS DE DATA (Estado Local) ---
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // --- LÓGICA DE PROCESSAMENTO (useMemo para performance) ---
  const { summary, areaChartData, categoryStats, budgetProgress, filteredTransactions } = useMemo(() => {
    
    // 1. Filtrar Transações pelo Mês/Ano Selecionado
    const filtered = transactions.filter(t => {
      const d = new Date(t.date);
      // Ajuste simples de fuso horário para garantir o mês correto
      const dateOffset = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
      return dateOffset.getMonth() === selectedMonth && dateOffset.getFullYear() === selectedYear;
    });

    // 2. Calcular Resumo (Cards do Topo)
    const income = filtered.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + Number(t.amount), 0);
    const expense = filtered.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + Number(t.amount), 0);
    const balance = income - expense;

    // 3. Preparar Dados do Gráfico de Área (Dia a Dia)
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const dailyDataMap: any = {};
    // Inicializa todos os dias com 0
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

    // 4. Categorias: Realizado vs Planejado (Meta)
    const catStats = categories
      .filter(c => c.type === 'EXPENSE')
      .map(cat => {
        // Soma gastos desta categoria no mês selecionado
        const spent = filtered
          .filter(t => t.category_id === cat.id && t.type === 'EXPENSE')
          .reduce((acc, t) => acc + t.amount, 0);
        
        const budget = Number(cat.budget) || 0;
        const percent = budget > 0 ? (spent / budget) * 100 : 0;

        return { name: cat.name, spent, budget, percent };
      })
      // Mostra apenas categorias com movimento ou meta definida
      .filter(c => c.spent > 0 || c.budget > 0)
      .sort((a, b) => b.percent - a.percent); // Ordena pelos que mais consumiram a meta

    // 5. Progresso Geral do Orçamento (Donut Chart)
    const totalBudget = catStats.reduce((acc, c) => acc + c.budget, 0);
    const totalSpent = catStats.reduce((acc, c) => acc + c.spent, 0);
    const progress = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    return {
      summary: { income, expense, balance },
      areaChartData: areaData,
      categoryStats: catStats,
      budgetProgress: progress,
      filteredTransactions: filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Ordenar por data
    };
  }, [transactions, categories, selectedMonth, selectedYear]);

  // --- AÇÕES ---
  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/auth"); };
  const handleSuccess = () => { setIsModalOpen(false); router.refresh(); };
  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans flex-col md:flex-row">
      
      {/* MOBILE NAV */}
      <MobileNav userEmail={userEmail} onLogout={handleLogout} />

      {/* SIDEBAR DESKTOP */}
      <aside className="w-72 bg-slate-900 hidden md:flex flex-col shadow-2xl z-10 relative shrink-0">
        <div className="p-8"><h1 className="text-3xl font-extrabold text-white flex items-center gap-3">Flui</h1></div>
        <nav className="flex-1 px-6 space-y-3 overflow-y-auto py-4 custom-scrollbar">
          <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Principal</p>
          <a href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-brand-600 text-white shadow-md"><Wallet size={20} /> Dashboard</a>
          <a href="/planning" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all"><Target size={20} /> Planejamento</a>
          
          <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mt-6 mb-2">Gestão</p>
          <a href="/investments" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all"><TrendingUp size={20} /> Investimentos</a>
          <a href="/goals" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all"><PieIcon size={20} /> Metas</a>
          <a href="/credit-cards" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all"><CreditCard size={20} /> Cartões</a>
        </nav>
        <div className="p-6 m-4 flex flex-col items-center text-center">
          <p className="text-sm text-white mb-4 truncate w-full">{userEmail}</p>
          <button onClick={handleLogout} className="flex items-center justify-center gap-2 px-4 py-2 text-sm text-slate-300 border border-slate-700 rounded-xl hover:bg-slate-800 w-full"><LogOut size={16} /> Sair</button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto relative z-0 p-4 md:p-8">
        
        {/* --- HEADER: Filtros e Totais --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
           
           {/* Seletor de Data e Título */}
           <div className="flex items-center gap-4">
              <h2 className="text-2xl font-extrabold text-slate-800 hidden md:block">Balanço Mensal</h2>
              <div className="flex bg-white rounded-lg shadow-sm border border-slate-200 p-1">
                 <select 
                   value={selectedMonth} 
                   onChange={(e) => setSelectedMonth(Number(e.target.value))}
                   className="bg-transparent text-sm font-bold text-slate-600 outline-none px-2 py-1 cursor-pointer"
                 >
                    {MONTH_NAMES.map((m, i) => <option key={i} value={i}>{m}</option>)}
                 </select>
                 <select 
                   value={selectedYear} 
                   onChange={(e) => setSelectedYear(Number(e.target.value))}
                   className="bg-transparent text-sm font-bold text-slate-600 outline-none px-2 py-1 border-l border-slate-200 cursor-pointer"
                 >
                    <option value={2025}>2025</option>
                    <option value={2026}>2026</option>
                 </select>
              </div>
           </div>

           {/* KPIs (Indicadores) */}
           <div className="flex gap-6 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
              <div className="flex items-center gap-3 shrink-0">
                 <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><TrendingUp size={20}/></div>
                 <div><p className="text-[10px] uppercase font-bold text-slate-400">Receitas</p><p className="text-lg font-bold text-emerald-600">{formatMoney(summary.income)}</p></div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                 <div className="p-2 bg-rose-100 rounded-lg text-rose-600"><TrendingDown size={20}/></div>
                 <div><p className="text-[10px] uppercase font-bold text-slate-400">Despesas</p><p className="text-lg font-bold text-rose-600">{formatMoney(summary.expense)}</p></div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                 <div className="p-2 bg-brand-100 rounded-lg text-brand-600"><Wallet size={20}/></div>
                 <div><p className="text-[10px] uppercase font-bold text-slate-400">Saldo</p><p className={`text-lg font-bold ${summary.balance >= 0 ? 'text-brand-600' : 'text-rose-600'}`}>{formatMoney(summary.balance)}</p></div>
              </div>
           </div>

           <button onClick={() => setIsModalOpen(true)} className="hidden md:flex bg-slate-900 text-white p-3 rounded-xl hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl active:scale-95">
              <Plus size={20}/>
           </button>
        </div>

        {/* --- GRID PRINCIPAL --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
           
           {/* GRÁFICO DE ÁREA (Evolução Diária) - Ocupa 2 colunas no desktop */}
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 xl:col-span-2 flex flex-col min-h-[350px]">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Evolução Diária</h3>
                 <div className="flex gap-3 text-xs font-bold">
                    <span className="flex items-center gap-1 text-emerald-600"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Entradas</span>
                    <span className="flex items-center gap-1 text-rose-600"><div className="w-2 h-2 rounded-full bg-rose-500"></div> Saídas</span>
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
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                       <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                       <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} tickFormatter={(v) => `R$${v}`} />
                       <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                       <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                       <Area type="monotone" dataKey="expense" stroke="#e11d48" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </div>

           {/* PAINEL LATERAL: METAS vs REALIZADO */}
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">Orçamento do Mês</h3>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-5 max-h-[300px] xl:max-h-none">
                 {categoryStats.length === 0 ? (
                    <div className="text-center text-slate-400 py-10 text-sm">
                       <p>Nenhum gasto ou meta definida.</p>
                       <a href="/planning" className="text-brand-600 hover:underline">Configurar no Planejamento</a>
                    </div>
                 ) : categoryStats.map((cat, idx) => (
                    <div key={idx}>
                       <div className="flex justify-between text-xs font-bold mb-1.5">
                          <span className="text-slate-700 truncate max-w-[120px]">{cat.name}</span>
                          <div className="flex gap-2">
                             <span className={`${cat.percent > 100 ? 'text-rose-600' : 'text-slate-500'}`}>{cat.percent.toFixed(0)}%</span>
                             <span className="text-slate-800">{formatMoney(cat.spent)}</span>
                          </div>
                       </div>
                       <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${cat.percent > 100 ? 'bg-rose-500' : 'bg-brand-500'}`} 
                            style={{ width: `${Math.min(cat.percent, 100)}%` }}
                          ></div>
                       </div>
                    </div>
                 ))}
              </div>

              {/* Gráfico Donut Resumo */}
              <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
                 <div>
                    <p className="text-xs text-slate-400 font-bold uppercase">Uso Geral</p>
                    <p className="text-2xl font-extrabold text-brand-600">{budgetProgress.toFixed(0)}%</p>
                    <p className="text-[10px] text-slate-400">do orçamento planejado</p>
                 </div>
                 <div className="w-16 h-16 relative">
                    <ResponsiveContainer>
                       <PieChart>
                          <Pie data={[{value: budgetProgress}, {value: Math.max(0, 100-budgetProgress)}]} dataKey="value" innerRadius={20} outerRadius={30} startAngle={90} endAngle={-270}>
                             <Cell fill={budgetProgress > 100 ? '#e11d48' : '#4f46e5'} />
                             <Cell fill="#f1f5f9" />
                          </Pie>
                       </PieChart>
                    </ResponsiveContainer>
                 </div>
              </div>
           </div>
        </div>

        {/* --- RODAPÉ: GRÁFICO E LISTA RECENTE --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           
           {/* Top Categorias (Gráfico de Barras) */}
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 min-h-[300px] flex flex-col">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">Top Categorias (Gastos)</h3>
              <div className="flex-1 w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryStats.slice(0, 7)} barSize={30}>
                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} interval={0} />
                       <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none'}} />
                       <Bar dataKey="spent" radius={[4, 4, 0, 0]}>
                          {categoryStats.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={index === 0 ? '#f97316' : '#fb923c'} /> 
                          ))}
                       </Bar>
                    </BarChart>
                 </ResponsiveContainer>
              </div>
           </div>

           {/* Lista de Transações Recentes do Mês */}
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">Últimas Movimentações</h3>
              <div className="flex-1 space-y-4 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                 {filteredTransactions.length === 0 ? (
                    <p className="text-center text-slate-400 text-sm mt-10">Nenhuma movimentação neste mês.</p>
                 ) : filteredTransactions.slice(0, 10).map((t: any) => (
                    <div key={t.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors">
                       <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${t.type === 'INCOME' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                             {t.type === 'INCOME' ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}
                          </div>
                          <div>
                             <p className="text-sm font-bold text-slate-800">{t.description}</p>
                             <p className="text-[10px] text-slate-500 font-bold uppercase">{t.categories?.name || "Geral"} • {new Date(t.date).toLocaleDateString('pt-BR')}</p>
                          </div>
                       </div>
                       <span className={`text-sm font-bold ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {t.type === 'INCOME' ? '+' : '-'} {formatMoney(t.amount)}
                       </span>
                    </div>
                 ))}
              </div>
           </div>

        </div>

      </main>

      {/* BOTÃO FLUTUANTE (Mobile) */}
      <button onClick={() => setIsModalOpen(true)} className="md:hidden fixed bottom-6 right-6 bg-brand-600 text-white p-4 rounded-full shadow-2xl z-50 hover:scale-105 transition-transform">
         <Plus size={24}/>
      </button>

      {/* MODAL */}
      <NewTransactionModal 
        isOpen={isModalOpen} 
        onClose={handleSuccess} 
        userId={userId} 
        onSuccess={handleSuccess} 
      />
    </div>
  );
}

// --- SUBCOMPONENTE MOBILE NAV ---
function MobileNav({ userEmail, onLogout }: { userEmail: string | null, onLogout: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center shadow-lg sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <div className="bg-brand-500 p-1.5 rounded-lg"><Wallet className="text-white w-5 h-5" /></div>
        <span className="font-bold text-lg tracking-tight">Flui</span>
      </div>
      <button onClick={() => setIsOpen(!isOpen)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-slate-900 border-t border-slate-800 shadow-2xl animate-in slide-in-from-top-2">
          <div className="p-4 space-y-4">
            <div className="px-4 py-3 bg-slate-800/50 rounded-xl border border-slate-700">
               <p className="text-xs text-slate-400 uppercase font-bold mb-1">Logado como</p>
               <p className="text-sm font-medium truncate text-white">{userEmail}</p>
            </div>
            <nav className="flex flex-col gap-2">
               <a href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800 text-white"><Wallet size={18} /> Dashboard</a>
               <a href="/planning" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800"><Target size={18} /> Planejamento</a>
               <a href="/goals" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800"><PieIcon size={18} /> Metas</a>
            </nav>
            <div className="h-px bg-slate-800 my-2"></div>
            <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl"><LogOut size={18} /> Sair</button>
          </div>
        </div>
      )}
    </div>
  );
}