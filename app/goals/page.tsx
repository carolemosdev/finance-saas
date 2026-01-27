"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { 
  LayoutDashboard, Wallet, TrendingUp, TrendingDown, PieChart, 
  Target, Plus, Loader2, Trash2, Pencil, CreditCard, LogOut
} from "lucide-react";
import { NewGoalModal } from "../../components/NewGoalModal";
import { MobileNav } from "../../components/MobileNav";

interface Goal { id: number; name: string; target_amount: number; current_amount: number; deadline: string; }

export default function GoalsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<Goal | undefined>(undefined);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }
      setUserId(user.id); setUserEmail(user.email ?? null); fetchGoals(user.id);
    };
    checkUser();
  }, [router]);

  const fetchGoals = async (uid: string) => {
    setIsLoading(true);
    const { data: goalsData } = await supabase.from("goals").select("*").eq("user_id", uid);
    if (goalsData) setGoals(goalsData as any);
    setIsLoading(false);
  };

  const handleDeleteGoal = async (id: number) => { if (!confirm("Tem certeza?")) return; await supabase.from("goals").delete().eq("id", id); if(userId) fetchGoals(userId); };
  const handleEditGoal = (goal: Goal) => { setGoalToEdit(goal); setIsGoalModalOpen(true); };
  const closeModals = () => { setIsGoalModalOpen(false); setGoalToEdit(undefined); if (userId) fetchGoals(userId); };
  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/auth"); };
  
  const SidebarLink = ({ href, icon: Icon, label, active = false }: any) => (
    <a href={href} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group ${active ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
      <Icon size={20} className={active ? 'text-white' : 'text-slate-500 group-hover:text-white transition-colors'} /> {label}
    </a>
  );

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans flex-col md:flex-row">
      <MobileNav userEmail={userEmail} onLogout={handleLogout} />
      <aside className="w-72 bg-slate-900 hidden md:flex flex-col shadow-2xl z-10 relative">
        <div className="p-8">
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3 tracking-tight">
            <div className="bg-brand-600 p-2 rounded-lg shadow-lg shadow-brand-600/50"><Wallet className="w-7 h-7 text-white" /></div>FinSaaS
          </h1>
        </div>
        <nav className="flex-1 px-6 space-y-3 overflow-y-auto py-4 custom-scrollbar">
          <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Principal</p>
          <SidebarLink href="/" icon={LayoutDashboard} label="Dashboard" />
          <SidebarLink href="/incomes" icon={TrendingUp} label="Receitas" />
          <SidebarLink href="/expenses" icon={TrendingDown} label="Despesas" />
          <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mt-8 mb-2">Gestão</p>
          <SidebarLink href="/investments" icon={PieChart} label="Investimentos" />
          <SidebarLink href="/goals" icon={Target} label="Metas" active={true} />
          <SidebarLink href="/credit-cards" icon={CreditCard} label="Cartões" />
        </nav>
        <div className="p-6 bg-slate-950/50 m-4 rounded-2xl border border-slate-800 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-brand-900 rounded-full flex items-center justify-center text-brand-300 font-bold text-lg mb-3 shadow-md shadow-brand-900/50">{userEmail?.charAt(0).toUpperCase()}</div>
          <div className="w-full overflow-hidden mb-4"><p className="text-sm text-white font-medium truncate w-full" title={userEmail || ''}>{userEmail}</p><p className="text-xs text-slate-500 mt-0.5">Conta Gratuita</p></div>
          <button onClick={handleLogout} className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all w-full border border-slate-700 hover:border-slate-600 active:scale-95"><LogOut size={16} /> <span>Sair da conta</span></button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8 relative z-0">
        <header className="flex justify-between items-center mb-8">
          <div><h2 className="text-3xl font-extrabold text-slate-800">Minhas Metas</h2><p className="text-slate-500 flex items-center gap-2 mt-1">Acompanhe seus sonhos.</p></div>
          <button onClick={() => setIsGoalModalOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-full flex items-center gap-2 font-semibold shadow-lg shadow-purple-600/30 transition-all hover:scale-105"><Plus size={20} /> Nova Meta</button>
        </header>

        {isLoading ? <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-brand-600" size={32}/></div> : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {goals.map((goal) => {
                 const percent = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
                 return (
                 <div key={goal.id} className="bg-white p-6 rounded-2xl shadow-xl shadow-slate-200/60 border-0 relative transition-transform hover:-translate-y-1">
                   <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-purple-50 rounded-2xl"><Target className="text-purple-600" size={24} /></div>
                      <div className="flex gap-2">
                         <button onClick={() => handleEditGoal(goal)} className="bg-slate-50 p-2 rounded-full hover:bg-purple-100 text-slate-400 hover:text-purple-600 transition-colors"><Pencil size={16} /></button>
                         <button onClick={() => handleDeleteGoal(goal.id)} className="bg-slate-50 p-2 rounded-full hover:bg-red-100 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                       </div>
                   </div>
                   <h3 className="font-bold text-lg text-slate-800 mb-1">{goal.name}</h3>
                   <div className="flex justify-between items-end mb-3"><span className="text-2xl font-extrabold text-purple-700">{formatMoney(goal.current_amount)}</span><span className="text-xs text-slate-400 mb-1 font-medium">de {formatMoney(goal.target_amount)}</span></div>
                   <div className="w-full bg-slate-100 rounded-full h-3 mb-2 overflow-hidden"><div className="bg-purple-600 h-3 rounded-full transition-all duration-1000" style={{ width: `${percent}%` }}></div></div>
                   <p className="text-xs text-right text-purple-600 font-bold">{percent.toFixed(0)}% Concluído</p>
                 </div>
                 )
             })}
           </div>
        )}
      </main>
      <NewGoalModal isOpen={isGoalModalOpen} onClose={closeModals} userId={userId} goalToEdit={goalToEdit} />
    </div>
  );
}