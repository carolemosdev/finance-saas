"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { 
  Wallet, CreditCard, Plus, Loader2, Trash2, Pencil
} from "lucide-react";
import { NewCreditCardModal } from "../../components/NewCreditCardModal";
import { MobileNav } from "../../components/MobileNav";
import { Sidebar } from "../../components/Sidebar"; // Usando a Sidebar unificada

export default function CreditCardsPage() {
  const router = useRouter();
  const [cards, setCards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cardToEdit, setCardToEdit] = useState<any>(undefined); 

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }
      setUserId(user.id); 
      setUserEmail(user.email ?? null); 
      fetchCards(user.id);
    };
    checkUser();
  }, [router]);

  const fetchCards = async (uid: string) => {
    setIsLoading(true);
    // Busca cartões
    const { data: cardsData } = await supabase
      .from("credit_cards")
      .select("*")
      .eq("user_id", uid)
      .order('created_at', { ascending: true });

    if (cardsData) {
       // Para cada cartão, busca a soma das despesas NÃO pagas (Fatura Aberta)
       const cardsWithInvoice = await Promise.all(cardsData.map(async (card) => {
         const { data: transactions } = await supabase
           .from("transactions")
           .select("amount")
           .eq("credit_card_id", card.id)
           .eq("type", "EXPENSE")
           .is("is_paid", false); // Só soma o que não foi pago ainda

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
  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  
  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans flex-col md:flex-row">
      <MobileNav userEmail={userEmail} onLogout={handleLogout} />

      {/* Sidebar Padronizada */}
      <Sidebar userEmail={userEmail} onLogout={handleLogout} />

      <main className="flex-1 overflow-y-auto p-8 relative z-0">
        <header className="flex justify-between items-center mb-8">
          <div>
              <h2 className="text-3xl font-extrabold text-slate-800 flex items-center gap-2">
                  <CreditCard className="text-brand-600"/> Meus Cartões
              </h2>
              <p className="text-slate-500">Gerencie seus limites e datas.</p>
          </div>
          {cards.length > 0 && (
              <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold shadow-lg transition-all hover:scale-105 active:scale-95">
                  <Plus size={20} /> Novo Cartão
              </button>
          )}
        </header>

        {isLoading ? (
            <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-brand-600" size={32}/></div>
        ) : (
          <>
            {cards.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl shadow-sm border border-slate-100">
                <div className="bg-slate-50 p-6 rounded-full mb-6"><CreditCard className="text-slate-400 w-16 h-16" /></div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Sem cartões por enquanto</h3>
                <p className="text-slate-500 mb-8 max-w-md text-center">Adicione seus cartões para controlar faturas e limites.</p>
                <button onClick={() => setIsModalOpen(true)} className="bg-brand-600 hover:bg-brand-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg hover:scale-105">
                    <Plus size={20} /> Cadastrar Primeiro Cartão
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {cards.map(card => {
                  const usage = card.limit_amount > 0 ? (card.current_invoice / card.limit_amount) * 100 : 0;
                  
                  return (
                    <div key={card.id} className="rounded-2xl shadow-xl shadow-slate-200/60 border-0 p-6 text-white relative overflow-hidden h-64 flex flex-col justify-between transition-transform hover:-translate-y-2 group" style={{ backgroundColor: card.color || '#3b82f6' }}>
                      
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
                            <span>{usage.toFixed(0)}% uso</span>
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