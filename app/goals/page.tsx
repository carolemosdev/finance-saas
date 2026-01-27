"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { 
  Wallet, Briefcase, Target, CreditCard, LogOut, 
  Menu, Plus, TrendingUp, PiggyBank, Calendar, ArrowRight, LayoutGrid
} from "lucide-react";
import { MobileNav } from "../../components/MobileNav"; 
import { NewGoalModal } from "../../components/NewGoalModal";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

// --- TIPAGEM ---
interface Goal {
  id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline?: string; // Data limite (opcional)
}

// --- CONFIGURAÇÃO GRÁFICO (Mockado para visualização, pode ser conectado depois) ---
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
  const [loading, setLoading] = useState(true);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // --- BUSCAR DADOS ---
  useEffect(() => {
    const fetchGoals = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }
      
      setUserId(user.id);
      setUserEmail(user.email ?? null);

      const { data } = await supabase.from('goals').select('*').eq('user_id', user.id);
      if (data) setGoals(data);
      setLoading(false);
    };
    fetchGoals();
  }, [router]);

  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/auth"); };
  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans flex-col md:flex-row">
      <MobileNav userEmail={userEmail} onLogout={handleLogout} />
      <Sidebar userEmail={userEmail} onLogout={handleLogout} />

      <main className="flex-1 overflow-y-auto relative z-0 p-4 md:p-8">
        
        {/* HEADER */}
        <div className="mb-8">
           <h2 className="text-2xl font-extrabold text-slate-800">Meus Planos</h2>
           <p className="text-slate-500 text-sm">Gerencie seus sonhos de curto e longo prazo</p>
        </div>

        {/* --- SEÇÃO SUPERIOR: DASHBOARD DE METAS --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* CARD 1: RESUMO DO MÊS (Estilo da Referência) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-full">
             <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                  Planejamento no Mês
                </h3>
                <div className="space-y-4">
                   <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 font-medium">Receitas</span>
                      <span className="font-bold text-emerald-600">R$ 14.790,00</span>
                   </div>
                   <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 font-medium">Despesas Fixas</span>
                      <span className="font-bold text-rose-600">R$ 9.171,45</span>
                   </div>
                   <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 font-medium">Investimentos/Metas</span>
                      <span className="font-bold text-brand-600">R$ 4.281,30</span>
                   </div>
                </div>
             </div>
             <div className="mt-6 pt-4 border-t border-slate-100">
                <div className="flex justify-between items-end">
                   <span className="text-sm font-bold text-slate-700">Saldo Livre</span>
                   <span className="text-xl font-extrabold text-slate-800">R$ 1.337,25</span>
                </div>
             </div>
          </div>

          {/* CARD 2: GRÁFICO DE BALANÇO (Estilo Barras Arredondadas) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2 flex flex-col">
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
               Balanço Mensal (Projeção)
             </h3>
             <div className="flex-1 w-full min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={chartData} barSize={20}>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} dy={10} />
                      <Tooltip 
                        cursor={{fill: '#f1f5f9'}}
                        contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#059669' : '#10b981'} />
                        ))}
                      </Bar>
                   </BarChart>
                </ResponsiveContainer>
             </div>
             <div className="mt-4 flex justify-center gap-4 text-xs text-slate-400">
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-600"></div> Saldo Positivo</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-400"></div> Previsão</div>
             </div>
          </div>
        </div>

        {/* --- BARRA DE AÇÕES --- */}
        <div className="flex gap-3 mb-6">
           <button onClick={() => setIsGoalModalOpen(true)} className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-700 transition-colors shadow-lg shadow-slate-200">
              <Plus size={16} /> Nova Meta
           </button>
           <button className="p-2 text-slate-400 hover:bg-white hover:text-brand-600 rounded-lg transition-colors border border-transparent hover:border-slate-200">
              <LayoutGrid size={20} />
           </button>
        </div>

        {/* --- LISTA DE METAS (GRID CARDS) --- */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
           {loading ? (
             <p className="col-span-2 text-center py-10 text-slate-400">Carregando metas...</p>
           ) : goals.map((goal, index) => {
             const progress = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
             
             // Imagens aleatórias baseadas no ID para dar vida (pode substituir por ícones fixos)
             const bgGradient = index % 2 === 0 ? "from-emerald-500 to-teal-400" : "from-brand-500 to-purple-400";
             
             return (
               <div key={goal.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-6 hover:shadow-md transition-shadow group">
                  
                  {/* Lado Esquerdo: Imagem/Ícone */}
                  <div className={`w-full sm:w-32 h-32 rounded-xl bg-gradient-to-br ${bgGradient} flex items-center justify-center shrink-0 text-white shadow-inner`}>
                     <Target size={40} className="opacity-80 group-hover:scale-110 transition-transform" />
                  </div>

                  {/* Lado Direito: Informações */}
                  <div className="flex-1 flex flex-col justify-between">
                     
                     {/* Cabeçalho do Card */}
                     <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg text-slate-800">{goal.name}</h3>
                        <button className="text-slate-300 hover:text-slate-600"><ArrowRight size={18} /></button>
                     </div>

                     {/* Grid de Valores */}
                     <div className="grid grid-cols-2 gap-4 my-2">
                        <div>
                           <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Valor Total</p>
                           <p className="text-sm font-bold text-slate-600">{formatMoney(goal.target_amount)}</p>
                        </div>
                        <div>
                           <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Já Guardado</p>
                           <p className="text-sm font-bold text-emerald-600">{formatMoney(goal.current_amount)}</p>
                        </div>
                     </div>

                     {/* Barra de Progresso */}
                     <div className="mt-2">
                        <div className="flex justify-between text-xs mb-1">
                           <span className="font-bold text-slate-500">{progress.toFixed(1)}%</span>
                           <span className="text-slate-400">Falta {formatMoney(goal.target_amount - goal.current_amount)}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                           <div 
                             className={`h-full rounded-full transition-all duration-1000 ${index % 2 === 0 ? 'bg-emerald-500' : 'bg-brand-500'}`} 
                             style={{ width: `${progress}%` }}
                           ></div>
                        </div>
                     </div>

                  </div>
               </div>
             )
           })}
           
           {/* Card Vazio para Adicionar */}
           {!loading && (
             <button onClick={() => setIsGoalModalOpen(true)} className="border-2 border-dashed border-slate-200 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-brand-400 hover:text-brand-600 hover:bg-brand-50/30 transition-all min-h-[180px]">
                <div className="bg-slate-50 p-3 rounded-full group-hover:bg-white"><Plus size={24}/></div>
                <span className="font-bold text-sm">Criar nova meta</span>
             </button>
           )}
        </div>

      </main>

      {/* MODAL (Reutilizando o componente que você já tem) */}
      <NewGoalModal 
        isOpen={isGoalModalOpen} 
        onClose={() => { setIsGoalModalOpen(false); window.location.reload(); }} // Recarrega simples para atualizar lista
        userId={userId} 
      />
    </div>
  );
}
