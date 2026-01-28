"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { 
  Wallet, TrendingDown, Target, CreditCard, LogOut, 
  Plus, Calendar, Search, Filter, ArrowLeft, Loader2, Trash2, Pencil
} from "lucide-react";
import { MobileNav } from "../../components/MobileNav"; 
import { NewTransactionModal } from "../../components/NewTransactionModal";
import { toast } from "sonner";

export default function ExpensesPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<any>(undefined);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth"); return; }
    
    setUserId(user.id);
    setUserEmail(user.email ?? null);

    const { data } = await supabase
      .from('transactions')
      .select(`*, categories (name)`)
      .eq('user_id', user.id)
      .eq('type', 'EXPENSE') // Só despesas
      .order('date', { ascending: false });

    if (data) setTransactions(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [router]);

  const handleDelete = async (id: string) => {
    if(!confirm("Tem certeza que deseja excluir?")) return;
    await supabase.from('transactions').delete().eq('id', id);
    toast.success("Despesa excluída.");
    fetchData();
  };

  const handleEdit = (transaction: any) => {
    setTransactionToEdit(transaction);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTransactionToEdit(undefined);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/auth"); };
  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans flex-col md:flex-row">
      <MobileNav userEmail={userEmail} onLogout={handleLogout} />
      
      {/* Sidebar Simplificada para páginas internas */}
      <aside className="w-72 bg-slate-900 hidden md:flex flex-col shadow-2xl z-10 relative shrink-0">
        <div className="p-8"><h1 className="text-3xl font-extrabold text-white flex items-center gap-3">Flui</h1></div>
        <nav className="flex-1 px-6 space-y-3 overflow-y-auto py-4 custom-scrollbar">
           <a href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all"><ArrowLeft size={20} /> Voltar ao Dashboard</a>
           <div className="h-px bg-slate-800 my-2"></div>
           <a href="/expenses" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-rose-600 text-white shadow-md"><TrendingDown size={20} /> Despesas</a>
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto relative z-0 p-4 md:p-8">
        
        <div className="flex justify-between items-center mb-8">
           <div>
             <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
               <div className="p-2 bg-rose-100 rounded-lg text-rose-600"><TrendingDown size={24}/></div>
               Minhas Despesas
             </h2>
             <p className="text-slate-500 text-sm mt-1">Gerencie todas as suas saídas.</p>
           </div>
           <button onClick={() => { setTransactionToEdit(undefined); setIsModalOpen(true); }} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2">
             <Plus size={18}/> Nova Despesa
           </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
           {loading ? (
             <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-slate-400"/></div>
           ) : transactions.length === 0 ? (
             <div className="p-12 text-center text-slate-400">Nenhuma despesa encontrada.</div>
           ) : (
             <div className="overflow-x-auto">
               <table className="w-full text-left">
                 <thead className="bg-slate-50 border-b border-slate-100">
                   <tr>
                     <th className="p-5 text-xs font-bold text-slate-500 uppercase">Descrição</th>
                     <th className="p-5 text-xs font-bold text-slate-500 uppercase">Categoria</th>
                     <th className="p-5 text-xs font-bold text-slate-500 uppercase">Data</th>
                     <th className="p-5 text-xs font-bold text-slate-500 uppercase text-right">Valor</th>
                     <th className="p-5 text-xs font-bold text-slate-500 uppercase text-center">Ações</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {transactions.map((t) => (
                     <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
                       <td className="p-5 font-bold text-slate-700">{t.description}</td>
                       <td className="p-5"><span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold uppercase">{t.categories?.name || 'Geral'}</span></td>
                       <td className="p-5 text-sm text-slate-500">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                       <td className="p-5 text-right font-bold text-rose-600">- {formatMoney(t.amount)}</td>
                       <td className="p-5 flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(t)} className="p-2 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded-lg"><Pencil size={16}/></button>
                          <button onClick={() => handleDelete(t.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 size={16}/></button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           )}
        </div>

      </main>

      {/* AQUI ESTAVA O ERRO: Agora passamos onSuccess */}
      <NewTransactionModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        userId={userId} 
        transactionToEdit={transactionToEdit}
        onSuccess={fetchData} // <--- CORREÇÃO APLICADA
      />
    </div>
  );
}