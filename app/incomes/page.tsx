"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { useTheme } from "next-themes"; // <-- IMPORT TEMA
import { 
  TrendingUp, Plus, Loader2, Trash2, Pencil, Search, Filter,
  Eye, EyeOff, Sun, Moon // <-- IMPORT ÍCONES
} from "lucide-react";
import { MobileNav } from "../../components/MobileNav"; 
import { Sidebar } from "../../components/Sidebar"; 
import { NewTransactionModal } from "../../components/NewTransactionModal";
import { toast } from "sonner";

export default function IncomesPage() {
  const router = useRouter();

  // --- ESTADOS DE PRIVACIDADE E TEMA ---
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);

  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<any>(undefined);

  useEffect(() => {
    setMounted(true);
    // Verifica se já estava oculto antes
    const savedPrivacy = localStorage.getItem("flui_privacy_mode");
    if (savedPrivacy === "true") setIsPrivacyMode(true);
    
    fetchData(); 
  }, [router]);

  const togglePrivacy = () => {
    const newValue = !isPrivacyMode;
    setIsPrivacyMode(newValue);
    localStorage.setItem("flui_privacy_mode", String(newValue));
  };

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
      .eq('type', 'INCOME') // Filtro de Receitas
      .order('date', { ascending: false });

    if (data) setTransactions(data);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Tem certeza que deseja excluir?")) return;
    await supabase.from('transactions').delete().eq('id', id);
    toast.success("Receita excluída.");
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
  
  // --- FORMATADOR ATUALIZADO (Respeita Privacidade) ---
  const formatMoney = (val: number) => {
    if (isPrivacyMode) return "R$ •••••";
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  if (!mounted) return null; // Previne flicker do next-themes

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans flex-col md:flex-row dark:bg-slate-950 dark:text-slate-100">
      <MobileNav userEmail={userEmail} onLogout={handleLogout} />
      <Sidebar userEmail={userEmail} onLogout={handleLogout} />

      <main className="flex-1 overflow-y-auto relative z-0 p-4 md:p-8 bg-slate-50 dark:bg-slate-950">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
           <div>
             <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2 dark:text-slate-100">
               <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"><TrendingUp size={24}/></div>
               Minhas Receitas
             </h2>
             <p className="text-slate-500 text-sm mt-1 dark:text-slate-400">Gerencie todas as suas entradas.</p>
           </div>
           
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
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
                  className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all shadow-sm active:scale-95 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                  title={theme === 'dark' ? "Modo Claro" : "Modo Escuro"}
               >
                  {theme === 'dark' ? <Sun size={18}/> : <Moon size={18}/>}
               </button>

               <button onClick={() => { setTransactionToEdit(undefined); setIsModalOpen(true); }} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2 dark:bg-brand-600 dark:hover:bg-brand-700">
                 <Plus size={18}/> Nova Receita
               </button>
           </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden dark:bg-slate-900 dark:border-slate-800">
           {loading ? (
             <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-slate-400 dark:text-slate-500"/></div>
           ) : transactions.length === 0 ? (
             <div className="p-12 text-center text-slate-400 dark:text-slate-500">Nenhuma receita encontrada.</div>
           ) : (
             <div className="overflow-x-auto">
               <table className="w-full text-left">
                 <thead className="bg-slate-50 border-b border-slate-100 dark:bg-slate-800/50 dark:border-slate-800">
                   <tr>
                     <th className="p-5 text-xs font-bold text-slate-500 uppercase dark:text-slate-400">Descrição</th>
                     <th className="p-5 text-xs font-bold text-slate-500 uppercase dark:text-slate-400">Categoria</th>
                     <th className="p-5 text-xs font-bold text-slate-500 uppercase dark:text-slate-400">Data</th>
                     <th className="p-5 text-xs font-bold text-slate-500 uppercase text-right dark:text-slate-400">Valor</th>
                     <th className="p-5 text-xs font-bold text-slate-500 uppercase text-center dark:text-slate-400">Ações</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                   {transactions.map((t) => (
                     <tr key={t.id} className="hover:bg-slate-50 transition-colors group dark:hover:bg-slate-800/50">
                       <td className="p-5 font-bold text-slate-700 dark:text-slate-200">{t.description}</td>
                       <td className="p-5"><span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold uppercase dark:bg-slate-800 dark:text-slate-400">{t.categories?.name || 'Geral'}</span></td>
                       <td className="p-5 text-sm text-slate-500 dark:text-slate-400">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                       <td className="p-5 text-right font-bold text-emerald-600 dark:text-emerald-400">+ {formatMoney(t.amount)}</td>
                       <td className="p-5 flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(t)} className="p-2 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded-lg dark:hover:bg-slate-800 dark:hover:text-brand-400"><Pencil size={16}/></button>
                          <button onClick={() => handleDelete(t.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg dark:hover:bg-rose-900/30 dark:hover:text-rose-400"><Trash2 size={16}/></button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           )}
        </div>

      </main>

      <NewTransactionModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        userId={userId} 
        transactionToEdit={transactionToEdit}
        onSuccess={fetchData} 
      />
    </div>
  );
}