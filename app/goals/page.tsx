"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { 
  Wallet, Briefcase, Target, CreditCard, LogOut, 
  Menu, Plus, TrendingUp, PiggyBank, Calendar, ArrowRight, LayoutGrid,
  Pencil, Trash2, CheckCircle2, Loader2
} from "lucide-react";
import { MobileNav } from "../../components/MobileNav"; 
import { NewGoalModal } from "../../components/NewGoalModal";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { toast } from "sonner";

// --- TIPAGEM ---
interface Goal {
  id: number;
  name: string;
  target_amount: number;
  current_amount: number;
}

interface FinancialSummary {
  income: number;
  expenses: number;
  invested: number;
  balance: number;
}

// --- DADOS DO GRÁFICO (Estático para visualização anual, pode ser dinamizado futuramente) ---
const chartData = [
  { name: 'Jan', value: 4000 }, { name: 'Fev', value: 3000 }, { name: 'Mar', value: 2000 },
  { name: 'Abr', value: 2780 }, { name: 'Mai', value: 1890 }, { name: 'Jun', value: 2390 },
  { name: 'Jul', value: 3490 }, { name: 'Ago', value: 4000 }, { name: 'Set', value: 3000 },
  { name: 'Out', value: 4500 }, { name: 'Nov', value: 3800 }, { name: 'Dez', value: 5000 },
];

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
  const [loading, setLoading] = useState(true);
  
  // Controle de Modais
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | undefined>(undefined);
  
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // --- CARREGAMENTO INICIAL ---
  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth"); return; }
    
    setUserId(user.id);
    setUserEmail(user.email ?? null);

    // 1. Buscar Metas
    const { data: goalsData } = await supabase.from('goals').select('*').eq('user_id', user.id).order('id');
    
    // 2. Buscar Transações do Mês Atual (Para o Dashboard Topo)
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString();

    const { data: transactionsData } = await supabase
      .from('transactions')
      .select('amount, type')
      .eq('user_id', user.id)
      .gte('date', startOfMonth)
      .lte('date', endOfMonth);

    // 3. Processar Dados
    if (goalsData) setGoals(goalsData);
    
    if (transactionsData) {
      const income = transactionsData.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + Number(t.amount), 0);
      const expenses = transactionsData.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + Number(t.amount), 0);
      const invested = goalsData ? goalsData.reduce((acc, g) => acc + Number(g.current_amount), 0) : 0; // Total acumulado em metas
      
      setSummary({
        income,
        expenses,
        invested, // Aqui você pode ajustar se quer mostrar o total investido no mês ou acumulado
        balance: income - expenses // Saldo livre do mês
      });
    }

    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [router]);

  // --- AÇÕES DO USUÁRIO ---
  
  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/auth"); };
  
  const handleDeleteGoal = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir esta meta?")) return;
    const { error } = await supabase.from('goals').delete().eq('id', id);
    if (error) toast.error("Erro ao excluir meta");
    else {
      toast.success("Meta excluída!");
      fetchData();
    }
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setIsGoalModalOpen(true);
  };

  const handleQuickAdd = async (goal: Goal) => {
    // Exemplo de adição rápida: Abre um prompt (Pode ser substituído por um modal pequeno)
    const amountStr = prompt(`Quanto deseja adicionar para "${goal.name}"?`);
    if (!amountStr) return;
    
    const amount = parseFloat(amountStr.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      toast.error("Valor inválido");
      return;
    }

    const newAmount = goal.current_amount + amount;
    
    const { error } = await supabase
      .from('goals')
      .update({ current_amount: newAmount })
      .eq('id', goal.id);

    if (error) toast.error("Erro ao atualizar valor");
    else {
      toast.success(`Adicionado R$ ${amount} com sucesso!`);
      fetchData();
    }
  };

  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans flex-col md:flex-row">
      <MobileNav userEmail={userEmail} onLogout={handleLogout} />
      <Sidebar userEmail={userEmail} onLogout={handleLogout} />

      <main className="flex-1 overflow-y-auto relative z-0 p-4 md:p-8">
        
        <div className="mb-8 flex justify-between items-center">
           <div>
             <h2 className="text-2xl font-extrabold text-slate-800">Meus Planos</h2>
             <p className="text-slate-500 text-sm">Gerencie seus sonhos de curto e longo prazo</p>
           </div>
           <button onClick={() => fetchData()} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-brand-600 hover:border-brand-200 transition-colors shadow-sm">
             <div className={`${loading ? 'animate-spin' : ''}`}><Loader2 size={18}/></div>
           </button>
        </div>

        {/* --- DASHBOARD FINANCEIRO REAL --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* CARD 1: Resumo Financeiro (Conectado ao Banco) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-full">
             <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                  Fluxo do Mês (Atual)
                </h3>
                <div className="space-y-4">
                   <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 font-medium flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Receitas</span>
                      <span className="font-bold text-emerald-600">{formatMoney(summary.income)}</span>
                   </div>
                   <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 font-medium flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-rose-500"></div> Despesas</span>
                      <span className="font-bold text-rose-600">{formatMoney(summary.expenses)}</span>
                   </div>
                   <div className="flex justify-between items-center text-sm opacity-60">
                      <span className="text-slate-500 font-medium flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-brand-500"></div> Total em Metas</span>
                      <span className="font-bold text-brand-600">{formatMoney(summary.invested)}</span>
                   </div>
                </div>
             </div>
             <div className="mt-6 pt-4 border-t border-slate-100 bg-slate-50/50 -mx-6 -mb-6 p-6 rounded-b-2xl">
                <div className="flex justify-between items-end">
                   <span className="text-sm font-bold text-slate-600">Saldo Livre</span>
                   <span className={`text-2xl font-extrabold ${summary.balance >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>
                     {formatMoney(summary.balance)}
                   </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Disponível para aportar nas metas</p>
             </div>
          </div>

          {/* CARD 2: Gráfico Visual (Estético) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2 flex flex-col">
             <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Balanço Mensal (Projeção)
                </h3>
                <div className="flex gap-4 text-[10px] font-bold text-slate-400 uppercase">
                   <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Positivo</div>
                   <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-300"></div> Previsto</div>
                </div>
             </div>
             <div className="flex-1 w-full min-h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={chartData} barSize={24}>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#94a3b8', fontWeight: 600}} dy={10} />
                      <Tooltip 
                        cursor={{fill: '#f8fafc'}}
                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '12px'}}
                      />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#10b981' : '#34d399'} />
                        ))}
                      </Bar>
                   </BarChart>
                </ResponsiveContainer>
             </div>
          </div>
        </div>

        {/* --- BARRA DE AÇÕES --- */}
        <div className="flex gap-3 mb-6">
           <button onClick={() => { setEditingGoal(undefined); setIsGoalModalOpen(true); }} className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 hover:shadow-xl hover:-translate-y-0.5">
              <Plus size={18} /> Nova Meta
           </button>
        </div>

        {/* --- LISTA DE METAS (GRID CARDS INTERATIVOS) --- */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
           {loading ? (
             <div className="col-span-2 py-12 flex justify-center text-brand-600"><Loader2 className="animate-spin" size={32}/></div>
           ) : goals.map((goal, index) => {
             const progress = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
             const bgGradient = index % 2 === 0 ? "from-emerald-500 to-teal-400" : "from-brand-500 to-purple-400";
             
             return (
               <div key={goal.id} className="bg-white rounded-2xl p-1 shadow-sm border border-slate-100 hover:shadow-md transition-all group relative">
                  <div className="flex flex-col sm:flex-row h-full">
                    
                    {/* Imagem/Ícone */}
                    <div className={`sm:w-32 h-32 sm:h-auto rounded-xl bg-gradient-to-br ${bgGradient} flex items-center justify-center shrink-0 text-white shadow-inner m-4 mb-0 sm:mb-4 sm:mr-0`}>
                       <Target size={40} className="opacity-90 group-hover:scale-110 transition-transform duration-500" />
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 p-5 flex flex-col justify-between">
                       <div>
                          <div className="flex justify-between items-start mb-1">
                             <h3 className="font-bold text-lg text-slate-800 group-hover:text-brand-600 transition-colors">{goal.name}</h3>
                             {/* Menu de Ações (Aparece no Hover) */}
                             <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEditGoal(goal)} className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-50 rounded-lg" title="Editar"><Pencil size={14}/></button>
                                <button onClick={() => handleDeleteGoal(goal.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg" title="Excluir"><Trash2 size={14}/></button>
                             </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-x-8 gap-y-2 my-3">
                             <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Meta Total</p>
                                <p className="text-sm font-bold text-slate-600">{formatMoney(goal.target_amount)}</p>
                             </div>
                             <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Acumulado</p>
                                <p className="text-sm font-bold text-emerald-600">{formatMoney(goal.current_amount)}</p>
                             </div>
                          </div>
                       </div>

                       {/* Barra e Botão Adicionar */}
                       <div className="mt-2">
                          <div className="flex justify-between text-xs mb-1.5">
                             <span className="font-bold text-slate-700">{progress.toFixed(0)}%</span>
                             <span className="text-slate-400 font-medium">Falta {formatMoney(goal.target_amount - goal.current_amount)}</span>
                          </div>
                          <div className="flex items-center gap-3">
                             <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex-1">
                                <div className={`h-full rounded-full transition-all duration-1000 ${index % 2 === 0 ? 'bg-emerald-500' : 'bg-brand-500'}`} style={{ width: `${progress}%` }}></div>
                             </div>
                             {/* Botão de Adicionar Rápido */}
                             <button onClick={() => handleQuickAdd(goal)} className="bg-slate-900 text-white p-1.5 rounded-lg hover:bg-emerald-600 transition-colors shadow-md active:scale-95" title="Adicionar valor">
                                <Plus size={14} />
                             </button>
                          </div>
                       </div>
                    </div>
                  </div>
               </div>
             )
           })}
           
           {!loading && goals.length === 0 && (
             <div className="col-span-1 xl:col-span-2 border-2 border-dashed border-slate-200 rounded-2xl p-10 flex flex-col items-center justify-center gap-3 text-slate-400">
                <PiggyBank size={48} className="text-slate-200"/>
                <p>Você ainda não criou nenhuma meta.</p>
                <button onClick={() => { setEditingGoal(undefined); setIsGoalModalOpen(true); }} className="text-brand-600 font-bold hover:underline">Começar agora</button>
             </div>
           )}
        </div>

      </main>

      {/* MODAL DE CRIAÇÃO/EDIÇÃO */}
      <NewGoalModal 
        isOpen={isGoalModalOpen} 
        onClose={() => { setIsGoalModalOpen(false); fetchData(); }} 
        userId={userId} 
        goalToEdit={editingGoal}
      />
    </div>
  );
}
