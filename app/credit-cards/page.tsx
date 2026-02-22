"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { useTheme } from "next-themes"; 
import { 
  Wallet, CreditCard, Plus, Loader2, Trash2, Pencil,
  Eye, EyeOff, Sun, Moon, Calendar, AlertTriangle, ArrowUpRight
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
  
  const formatMoney = (val: number) => {
    if (isPrivacyMode) return "R$ •••••";
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // --- CÁLCULOS DO RESUMO GLOBAL ---
  const totalInvoices = cards.reduce((acc, c) => acc + c.current_invoice, 0);
  const globalLimit = cards.reduce((acc, c) => acc + c.limit_amount, 0);
  const globalAvailable = globalLimit - totalInvoices;
  
  // Encontrar o próximo vencimento
  const today = new Date().getDate();
  const sortedCardsByDue = [...cards].sort((a, b) => {
    // Lógica super simples para achar o próximo dia útil
    let diffA = a.due_day - today;
    let diffB = b.due_day - today;
    if (diffA < 0) diffA += 30; // Se já passou, é pro mês que vem
    if (diffB < 0) diffB += 30;
    return diffA - diffB;
  });
  const nextCardDue = sortedCardsByDue.length > 0 ? sortedCardsByDue[0] : null;

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans flex-col md:flex-row dark:bg-slate-950 dark:text-slate-100">
      <MobileNav userEmail={userEmail} onLogout={handleLogout} />
      <Sidebar userEmail={userEmail} onLogout={handleLogout} />

      <main className="flex-1 overflow-y-auto p-4 md:p-8 relative z-0 bg-slate-50 dark:bg-slate-950">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
              <h2 className="text-3xl font-extrabold text-slate-800 flex items-center gap-2 dark:text-slate-100">
                  <CreditCard className="text-brand-600 dark:text-brand-400"/> Gestão de Cartões
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Controle suas faturas e limites em tempo real.</p>
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
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

               <button onClick={() => setIsModalOpen(true)} className="flex-1 md:flex-none bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold shadow-lg transition-all active:scale-95 dark:bg-brand-600 dark:hover:bg-brand-700">
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
              <div className="space-y-8">
                
                {/* --- PAINEL DE RESUMO GLOBAL --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 dark:bg-slate-900 dark:border-slate-800">
                     <div className="bg-rose-50 p-3 rounded-xl text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                        <AlertTriangle size={24} />
                     </div>
                     <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Faturas em Aberto</p>
                        <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{formatMoney(totalInvoices)}</p>
                     </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 dark:bg-slate-900 dark:border-slate-800">
                     <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <Wallet size={24} />
                     </div>
                     <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Limite Disponível</p>
                        <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{formatMoney(globalAvailable)}</p>
                     </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between dark:bg-slate-900 dark:border-slate-800">
                     <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Próximo Vencimento</p>
                        <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{nextCardDue ? nextCardDue.name : '---'}</p>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                          {nextCardDue ? `Dia ${nextCardDue.due_day} • ${formatMoney(nextCardDue.current_invoice)}` : 'Nenhuma fatura'}
                        </p>
                     </div>
                     <div className="bg-slate-50 p-3 rounded-full text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                        <Calendar size={24} />
                     </div>
                  </div>
                </div>

                {/* --- GRID DE CARTÕES (Redesign) --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pt-4">
                  {cards.map(card => {
                    const usage = card.limit_amount > 0 ? (card.current_invoice / card.limit_amount) * 100 : 0;
                    
                    // Lógica de Cores do Limite
                    let progressColor = "bg-white";
                    let dangerText = "";
                    if (usage > 85) {
                      progressColor = "bg-red-400";
                      dangerText = "Limite Crítico!";
                    } else if (usage > 60) {
                      progressColor = "bg-amber-400";
                    }
                    
                    return (
                      <div key={card.id} className="relative group">
                        
                        {/* O CARTÃO FÍSICO (Neumorfismo simples) */}
                        <div 
                          className="rounded-[20px] shadow-xl dark:shadow-none border border-white/20 p-6 text-white relative overflow-hidden h-56 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl z-10" 
                          style={{ 
                            background: `linear-gradient(135deg, ${card.color || '#3b82f6'}, #0f172a)` // Gradiente para dar profundidade
                          }}
                        >
                          {/* Símbolos Decorativos do Cartão */}
                          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
                          
                          <div className="flex justify-between items-start z-10">
                            <div className="flex items-center gap-3">
                               {/* Simulação de Chip */}
                               <div className="w-10 h-8 rounded bg-gradient-to-br from-amber-200 to-amber-400/50 opacity-80 border border-amber-300/30"></div>
                               <svg className="w-5 h-5 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                            </div>

                            {/* Marca / Apelido */}
                            <h3 className="text-xl font-black tracking-widest opacity-90 drop-shadow-sm uppercase">{card.name}</h3>
                          </div>
                          
                          <div className="z-10 mt-auto">
                            <div className="flex justify-between items-end mb-4">
                                <div className="flex flex-col">
                                    <span className="opacity-70 text-[10px] uppercase font-bold tracking-widest mb-1">Fatura Atual</span>
                                    <span className="font-extrabold text-3xl drop-shadow-sm">{formatMoney(card.current_invoice)}</span>
                                </div>
                            </div>

                            {/* Detalhes de Fechamento */}
                            <div className="flex justify-between text-xs opacity-80 font-medium uppercase tracking-wider">
                                <span>Fecha: Dia {card.closing_day}</span>
                                <span>Vence: Dia {card.due_day}</span>
                            </div>
                          </div>
                        </div>

                        {/* BARRA DE INFORMAÇÕES EXTRAS (Aparece embaixo do cartão) */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 border-t-0 rounded-b-2xl p-4 pt-6 -mt-4 relative z-0 shadow-sm transition-all group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50">
                            
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Uso do Limite</span>
                                <span className={`text-xs font-bold ${usage > 85 ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}`}>
                                  {isPrivacyMode ? "•••" : usage.toFixed(0)}%
                                </span>
                            </div>
                            
                            {/* Barra de Progresso do Limite colorida */}
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mb-3">
                                <div className={`h-full rounded-full transition-all duration-1000 ${progressColor}`} style={{ width: `${Math.min(usage, 100)}%` }}></div>
                            </div>

                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-400 font-medium">Disponível: {formatMoney(card.limit_amount - card.current_invoice)}</span>
                                {dangerText && <span className="text-red-500 font-bold animate-pulse">{dangerText}</span>}
                            </div>

                            {/* Botões de Ação Movemos para cá para não poluir o cartão físico */}
                            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                               <button onClick={() => handleEdit(card)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/30 transition-colors">
                                   <Pencil size={14} /> Editar
                               </button>
                               <button onClick={() => handleDelete(card.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors">
                                   <Trash2 size={14} /> Excluir
                               </button>
                            </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
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