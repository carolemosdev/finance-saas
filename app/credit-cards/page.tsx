"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { useTheme } from "next-themes"; // <-- IMPORT TEMA
import { 
  Wallet, CreditCard, Plus, Loader2, Trash2, Pencil,
  Eye, EyeOff, Sun, Moon // <-- IMPORT ÍCONES
} from "lucide-react";
import { NewCreditCardModal } from "../../components/NewCreditCardModal";
import { MobileNav } from "../../components/MobileNav";
import { Sidebar } from "../../components/Sidebar";

export default function CreditCardsPage() {
  const router = useRouter();
  
  // --- ESTADOS DE PRIVACIDADE E TEMA ---
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);

  const [cards, setCards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cardToEdit, setCardToEdit] = useState<any>(undefined); 

  useEffect(() => {
    setMounted(true);
    const savedPrivacy = localStorage.getItem("flui_privacy_mode");
    if (savedPrivacy === "true") setIsPrivacyMode(true);

    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }
      setUserId(user.id); 
      setUserEmail(user.email ?? null); 
      fetchCards(user.id);
    };
    checkUser();
  }, [router]);

  const togglePrivacy = () => {
    const newValue = !isPrivacyMode;
    setIsPrivacyMode(newValue);
    localStorage.setItem("flui_privacy_mode", String(newValue));
  };

  const fetchCards = async (uid: string) => {
    setIsLoading(true);
    const { data: cardsData } = await supabase
      .from("credit_cards")
      .select("*")
      .eq("user_id", uid)
      .order('created_at', { ascending: true });

    if (cardsData) {
       const cardsWithInvoice = await Promise.all(cardsData.map(async (card) => {
         const { data: transactions } = await supabase
           .from("transactions")
           .select("amount")
           .eq("credit_card_id", card.id)
           .eq("type", "EXPENSE")
           .is("is_paid", false);

         const totalSpent = transactions?.reduce((acc, curr) => acc + curr.amount, 0) || 0;
         return { ...card, current_invoice: totalSpent };
       }));
       setCards(cardsWithInvoice);
    }
    setIsLoading(false);
  };

  const handleDelete = async (id: number) => { 
      if (!confirm("Tem certeza que deseja excluir este cartão?")) return; 
      await supabase.from("credit_cards").delete().eq("id", id); 
      if (userId) fetchCards(userId); 
  };

  const handleEdit = (card: any) => { 
      setCardToEdit(card); 
      setIsModalOpen(true); 
  };

  const handleCloseModal = () => { 
      setIsModalOpen(false); 
      setCardToEdit(undefined); 
  };

  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/auth"); };
  
  // --- FORMATADOR ATUALIZADO (Respeita Privacidade) ---
  const formatMoney = (val: number) => {
    if (isPrivacyMode) return "R$ •••••";
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };
  
  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans flex-col md:flex-row dark:bg-slate-950 dark:text-slate-100">
      <MobileNav userEmail={userEmail} onLogout={handleLogout} />
      <Sidebar userEmail={userEmail} onLogout={handleLogout} />

      <main className="flex-1 overflow-y-auto p-4 md:p-8 relative z-0 bg-slate-50 dark:bg-slate-950">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
              <h2 className="text-3xl font-extrabold text-slate-800 flex items-center gap-2 dark:text-slate-100">
                  <CreditCard className="text-brand-600 dark:text-brand-400"/> Meus Cartões
              </h2>
              <p className="text-slate-500 dark:text-slate-400">Gerencie seus limites e datas.</p>
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
                  onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')} 
                  className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all shadow-sm active:scale-95 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                  title={resolvedTheme === 'dark' ? "Modo Claro" : "Modo Escuro"}
               >
                  {resolvedTheme === 'dark' ? <Sun size={18}/> : <Moon size={18}/>}
               </button>

               <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold shadow-lg transition-all hover:scale-105 active:scale-95 dark:bg-brand-600 dark:hover:bg-brand-700">
                  <Plus size={20} /> Novo Cartão
               </button>
          </div>
        </header>

        {isLoading ? (
            <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-brand-600 dark:text-brand-400" size={32}/></div>
        ) : (
          <>
            {cards.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
                <div className="bg-slate-50 p-6 rounded-full mb-6 dark:bg-slate-800"><CreditCard className="text-slate-400 w-16 h-16 dark:text-slate-500" /></div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2 dark:text-slate-100">Sem cartões por enquanto</h3>
                <p className="text-slate-500 mb-8 max-w-md text-center dark:text-slate-400">Adicione seus cartões para controlar faturas e limites.</p>
                <button onClick={() => setIsModalOpen(true)} className="bg-brand-600 hover:bg-brand-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg hover:scale-105">
                    <Plus size={20} /> Cadastrar Primeiro Cartão
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {cards.map(card => {
                  const usage = card.limit_amount > 0 ? (card.current_invoice / card.limit_amount) * 100 : 0;
                  
                  return (
                    <div key={card.id} className="rounded-2xl shadow-xl shadow-slate-200/60 dark:shadow-none border-0 p-6 text-white relative overflow-hidden h-64 flex flex-col justify-between transition-transform hover:-translate-y-2 group" style={{ backgroundColor: card.color || '#3b82f6' }}>
                      
                      {/* Efeito de Fundo */}
                      <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 bg-white/20 rounded-full blur-2xl pointer-events-none"></div>
                      
                      <div className="flex justify-between items-start z-10">
                        <div>
                            <p className="text-xs font-bold opacity-80 uppercase tracking-widest">Cartão</p>
                            <h3 className="text-xl font-bold tracking-wide mt-1">{card.name}</h3>
                        </div>
                        {/* Botões de Ação */}
                        <div className="flex gap-2">
                           <button onClick={(e) => { e.stopPropagation(); handleEdit(card); }} className="bg-black/20 p-2 rounded-lg hover:bg-white/20 transition-colors active:scale-95" title="Editar">
                               <Pencil size={16} className="text-white" />
                           </button>
                           <button onClick={(e) => { e.stopPropagation(); handleDelete(card.id); }} className="bg-black/20 p-2 rounded-lg hover:bg-red-500/80 transition-colors active:scale-95" title="Excluir">
                               <Trash2 size={16} className="text-white" />
                           </button>
                        </div>
                      </div>
                      
                      <div className="z-10 mt-4">
                        <div className="flex justify-between items-end mb-2">
                            <div className="flex flex-col">
                                <span className="opacity-70 text-[10px] uppercase font-bold">Fatura Atual</span>
                                <span className="font-extrabold text-2xl">{formatMoney(card.current_invoice)}</span>
                            </div>
                        </div>

                        {/* Barra de Progresso do Limite */}
                        <div className="w-full bg-black/20 h-1.5 rounded-full overflow-hidden mb-2">
                            <div className="h-full bg-white/90 rounded-full transition-all duration-1000" style={{ width: `${Math.min(usage, 100)}%` }}></div>
                        </div>

                        <div className="flex justify-between text-xs opacity-90 font-medium">
                            <span>Disponível: {formatMoney(card.limit_amount - card.current_invoice)}</span>
                            <span>{isPrivacyMode ? "•••" : usage.toFixed(0)}% uso</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
      
      <NewCreditCardModal 
          isOpen={isModalOpen} 
          onClose={handleCloseModal} 
          userId={userId} 
          onSuccess={() => userId && fetchCards(userId)} 
          cardToEdit={cardToEdit} 
      />
    </div>
  );
}