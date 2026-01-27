"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { 
  Wallet, Briefcase, Target, CreditCard, LogOut, 
  Menu, Plus, TrendingUp, PiggyBank, Calendar, ArrowRight, LayoutGrid,
  Pencil, Trash2, Loader2
} from "lucide-react";
import { MobileNav } from "../../components/MobileNav"; 
import { NewGoalModal } from "../../components/NewGoalModal";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, Legend, CartesianGrid } from "recharts";
import { toast } from "sonner";

// --- TIPAGEM ---
interface Goal {
  id: number;
  name: string;
  target_amount: number;
  current_amount: number;
}

interface MonthlyData {
  name: string; // Jan, Fev...
  income: number;
  expenses: number;
  goals_contribution: number; // Quanto foi para metas neste mês
  balance: number; // O que sobrou (Income - Expenses - Goals)
}

interface FinancialSummary {
  income: number;
  expenses: number;
  invested: number;
  balance: number;
}

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// --- SIDEBAR ---
function Sidebar({ userEmail, onLogout }: any) {
  return (
    <aside className="w-72 bg-slate-900 hidden md:flex flex-col shadow-2xl z-10 relative shrink-0">
      <div className="p-8"><h1 className="text-3xl font-extrabold text-white flex items-center gap-3">Flui</h1></div>
      <nav className="flex-1 px-6 space-y-3 overflow-y-auto py-4 custom-scrollbar">
        <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Principal</p>
        <a href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all"><Wallet size={20} /> Dashboard</a>
        <a href="/planning" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all"><Target size={20} /> Planejamento</a>
        
        <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mt-6 mb-2">Gestão</p>
        <a href="/investments" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all"><Briefcase size={20} /> Investimentos</a>
        <a href="/goals" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-brand-600 text-white shadow-md"><Target size={20} /> Metas</a>
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
export default function GoalsPage() {
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [summary, setSummary] = useState<FinancialSummary>({ income: 0, expenses: 0, invested: 0, balance: 0 });
  const [yearData, setYearData] = useState<MonthlyData[]>([]); // Dados do Gráfico
  const [loading, setLoading] = useState(true);
  
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | undefined>(undefined);
  
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // --- CARREGAMENTO DE DADOS ---
  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth"); return; }
    
    setUserId(user.id);
    setUserEmail(user.email ?? null);

    // 1. Buscar Metas
    const { data: goalsData } = await supabase.from('goals').select('*').eq('user_id', user.id).order('id');
    if (goalsData) setGoals(goalsData);

    // 2. Buscar Transações do ANO TODO (Para o Gráfico)
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1).toISOString();
    const endOfYear = new Date(today.getFullYear(), 11, 31).toISOString();

    const { data: transactions } = await supabase
      .from('transactions')
      .select('amount, type, date')
      .eq('user_id', user.id)
      .gte('date', startOfYear)
      .lte('date', endOfYear);

    if (transactions) {
      processFinancialData(transactions, goalsData || [], today.getMonth());
    }

    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [router]);

  // --- PROCESSAMENTO INTELIGENTE DOS DADOS ---
  const processFinancialData = (transactions: any[], goals: any[], currentMonthIndex: number) => {
    
    // Inicializa os 12 meses zerados
    const monthlyStats: MonthlyData[] = MONTH_NAMES.map(name => ({
      name, income: 0, expenses: 0, goals_contribution: 0, balance: 0
    }));

    // Preenche com transações reais
    transactions.forEach(t => {
      const date = new Date(t.date);
      // Ajuste de fuso
      const userTimezoneOffset = date.getTimezoneOffset() * 60000;
      const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
      const monthIdx = adjustedDate.getMonth();

      if (t.type === 'INCOME') {
        monthlyStats[monthIdx].income += Number(t.amount);
      } else if (t.type === 'EXPENSE') {
        monthlyStats[monthIdx].expenses += Number(t.amount);
      }
    });

    // Calcula o "Meta/Planos" e "Saldo"
    // Nota: Como não temos data de aporte na meta, vamos simular que o valor guardado foi diluído ou usar um valor fixo.
    // Para este exemplo real, vamos considerar que o "Saldo Livre" (Income - Expense) é o que sobra.
    // Se quiser ver "Metas" no gráfico, precisaríamos de uma transação categorizada como "Investimento".
    
    monthlyStats.forEach(stat => {
      // Simulação: Se não houver categoria 'Investimento', o gráfico mostrará apenas Despesa + Saldo.
      // O Saldo é calculado dinamicamente.
      stat.balance = Math.max(0, stat.income - stat.expenses - stat.goals_contribution);
    });

    // Atualiza o Resumo do Mês Atual (Card da Esquerda)
    const currentStats = monthlyStats[currentMonthIndex];
    const totalInvestedAccumulated = goals.reduce((acc, g) => acc + Number(g.current_amount), 0);

    setSummary({
      income: currentStats.income,
      expenses: currentStats.expenses,
      invested: totalInvestedAccumulated, 
      balance: currentStats.balance
    });

    setYearData(monthlyStats);
  };

  // --- HANDLERS ---
  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/auth"); };
  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // Ações de Meta
  const handleDeleteGoal = async (id: number) => {
    if (!confirm("Excluir meta?")) return;
    await supabase.from('goals').delete().eq('id', id);
    fetchData();
  };
  const handleEditGoal = (goal: Goal) => { setEditingGoal(goal); setIsGoalModalOpen(true); };
  
  const handleQuickAdd = async (goal: Goal) => {
    const amountStr = prompt(`Adicionar valor para ${goal.name}:`);
    if (!amountStr) return;
    const amount = parseFloat(amountStr.replace(',', '.'));
    if (!isNaN(amount) && amount > 0) {
      await supabase.from('goals').update({ current_amount: goal.current_amount + amount }).eq('id', goal.id);
      toast.success("Valor adicionado!");
      fetchData();
    }
  };

  // Custom Tooltip para o Gráfico
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-xl shadow-xl border border-slate-100 text-xs">
          <p className="font-bold text-slate-700 mb-2">{label}</p>
          <div className="space-y-1">
            <p className="text-emerald-600 font-bold">Rec: {formatMoney(payload[0].payload.income)}</p>
            <div className="h-px bg-slate-100 my-1"></div>
            <p className="text-rose-500">Desp: {formatMoney(payload[0].value)}</p>
            <p className="text-brand-500">Saldo: {formatMoney(payload[1].value)}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans flex-col md:flex-row">
      <MobileNav userEmail={userEmail} onLogout={handleLogout} />
      <Sidebar userEmail={userEmail} onLogout={handleLogout} />

      <main className="flex-1 overflow-y-auto relative z-0 p-4 md:p-8">
        
        <div className="mb-8 flex justify-between items-center">
           <div>
             <h2 className="text-2xl font-extrabold text-slate-800">Meus Planos</h2>
             <p className="text-slate-500 text-sm">Visão geral do seu progresso financeiro</p>
           </div>
           <button onClick={() => fetchData()} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-brand-600 transition-colors">
             <div className={`${loading ? 'animate-spin' : ''}`}><Loader2 size={18}/></div>
           </button>
        </div>

        {/* --- PAINEL SUPERIOR (DASHBOARD) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* CARD 1: RESUMO DO MÊS ATUAL */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
             <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-5">
                  Planejamento no Mês
                </h3>
                <div className="space-y-4">
                   <div className="flex justify-between items-center text-sm group">
                      <span className="text-slate-500 font-medium flex items-center gap-2 group-hover:text-emerald-600 transition-colors">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Receitas
                      </span>
                      <span className="font-bold text-emerald-600">{formatMoney(summary.income)}</span>
                   </div>
                   <div className="flex justify-between items-center text-sm group">
                      <span className="text-slate-500 font-medium flex items-center gap-2 group-hover:text-rose-600 transition-colors">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div> Despesas Fixas
                      </span>
                      <span className="font-bold text-rose-600">{formatMoney(summary.expenses)}</span>
                   </div>
                   <div className="flex justify-between items-center text-sm group">
                      <span className="text-slate-500 font-medium flex items-center gap-2 group-hover:text-brand-600 transition-colors">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-500"></div> Acumulado em Metas
                      </span>
                      <span className="font-bold text-brand-600">{formatMoney(summary.invested)}</span>
                   </div>
                </div>
             </div>
             
             <div className="mt-6 pt-4 border-t border-slate-100">
                <div className="flex justify-between items-end">
                   <span className="text-sm font-bold text-slate-700">Saldo do Mês</span>
                   <span className={`text-xl font-extrabold ${summary.balance >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                     {formatMoney(summary.balance)}
                   </span>
                </div>
             </div>
          </div>

          {/* CARD 2: GRÁFICO DE BALANÇO MENSAL (STACKED BAR) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2 flex flex-col">
             <div className="flex justify-between items-start mb-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Balanço Mensal</h3>
                
                {/* Legenda Customizada */}
                <div className="flex gap-4 text-[10px] font-bold uppercase text-slate-400">
                   <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-rose-400"></div> Despesas</div>
                   <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-brand-500"></div> Metas</div>
                   <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-emerald-200"></div> Saldo</div>
                </div>
             </div>

             <div className="flex-1 w-full min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={yearData} barSize={24} margin={{top: 10, right: 0, left: -20, bottom: 0}}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#94a3b8', fontWeight: 600}} dy={10} />
                      <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
                      
                      {/* BARRA EMPILHADA: Ordem importa (Base -> Topo) */}
                      <Bar dataKey="expenses" stackId="a" fill="#fb7185" radius={[0, 0, 4, 4]} /> {/* Rose-400 */}
                      <Bar dataKey="goals_contribution" stackId="a" fill="#6366f1" /> {/* Brand-500 */}
                      <Bar dataKey="balance" stackId="a" fill="#a7f3d0" radius={[4, 4, 0, 0]} /> {/* Emerald-200 */}
                   </BarChart>
                </ResponsiveContainer>
             </div>
          </div>
        </div>

        {/* --- BOTÃO NOVA META --- */}
        <div className="flex gap-3 mb-6">
           <button onClick={() => { setEditingGoal(undefined); setIsGoalModalOpen(true); }} className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 hover:shadow-xl hover:-translate-y-0.5">
              <Plus size={18} /> Nova Meta
           </button>
        </div>

        {/* --- GRID DE METAS --- */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
           {loading ? (
             <div className="col-span-2 py-10 flex justify-center text-slate-300"><Loader2 className="animate-spin"/></div>
           ) : goals.map((goal, index) => {
             const progress = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
             // Alternar cores para dar dinamismo (Verde / Brand)
             const isEven = index % 2 === 0;
             
             return (
               <div key={goal.id} className="bg-white rounded-2xl p-1 shadow-sm border border-slate-100 hover:shadow-md transition-all group relative">
                  <div className="flex flex-col sm:flex-row h-full">
                    
                    {/* Imagem/Ícone (Igual referência) */}
                    <div className={`sm:w-32 h-32 sm:h-auto rounded-xl bg-gradient-to-br ${isEven ? 'from-emerald-500 to-teal-400' : 'from-indigo-500 to-purple-500'} flex items-center justify-center shrink-0 text-white shadow-inner m-4 mb-0 sm:mb-4 sm:mr-0`}>
                       <Target size={36} className="opacity-90 group-hover:scale-110 transition-transform duration-500" />
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 p-5 flex flex-col justify-between">
                       <div>
                          <div className="flex justify-between items-start mb-1">
                             <h3 className="font-bold text-lg text-slate-800 group-hover:text-brand-600 transition-colors">{goal.name}</h3>
                             {/* Ações */}
                             <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEditGoal(goal)} className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-50 rounded-lg"><Pencil size={14}/></button>
                                <button onClick={() => handleDeleteGoal(goal.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 size={14}/></button>
                             </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-x-8 gap-y-2 my-3">
                             <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Valor Total</p>
                                <p className="text-sm font-bold text-slate-600">{formatMoney(goal.target_amount)}</p>
                             </div>
                             <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Valor Guardado</p>
                                <p className={`text-sm font-bold ${isEven ? 'text-emerald-600' : 'text-indigo-600'}`}>{formatMoney(goal.current_amount)}</p>
                             </div>
                          </div>
                       </div>

                       {/* Barra de Progresso */}
                       <div className="mt-2">
                          <div className="flex justify-between text-xs mb-1.5">
                             <span className="font-bold text-slate-700">{progress.toFixed(0)}%</span>
                             <span className="text-slate-400 font-medium">Restam {formatMoney(goal.target_amount - goal.current_amount)}</span>
                          </div>
                          <div className="flex items-center gap-3">
                             <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex-1">
                                <div className={`h-full rounded-full transition-all duration-1000 ${isEven ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${progress}%` }}></div>
                             </div>
                             <button onClick={() => handleQuickAdd(goal)} className="bg-slate-900 text-white p-1.5 rounded-lg hover:bg-brand-600 transition-colors shadow-md active:scale-95" title="Adicionar valor">
                                <Plus size={14} />
                             </button>
                          </div>
                       </div>
                    </div>
                  </div>
               </div>
             )
           })}
        </div>

      </main>

      {/* MODAL */}
      <NewGoalModal 
        isOpen={isGoalModalOpen} 
        onClose={() => { setIsGoalModalOpen(false); fetchData(); }} 
        userId={userId} 
        goalToEdit={editingGoal}
      />
    </div>
  );
}
