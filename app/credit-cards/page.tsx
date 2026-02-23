"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { useTheme } from "next-themes"; 
import { 
  Wallet, CreditCard, Plus, Loader2, Trash2, Pencil,
  Eye, EyeOff, Sun, Moon, Calendar, AlertTriangle, CheckCircle2
} from "lucide-react";
import { NewCreditCardModal } from "../../components/NewCreditCardModal";
import { MobileNav } from "../../components/MobileNav";
import { Sidebar } from "../../components/Sidebar";
import { toast } from "sonner"; // Garantindo os toasts de sucesso

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
           .is("is_paid", false); // Só pega o que NÃO foi pago

         const totalSpent = transactions?.reduce((acc, curr) => acc + curr.amount, 0) || 0;
         return { ...card, current_invoice: totalSpent };
       }));
       setCards(cardsWithInvoice);
    }
    setIsLoading(false);
  };

  // --- MOTOR DE CICLO DE FATURA (A Mágica do Banco) ---
const getInvoiceStatus = (closingDay: number, dueDay: number, invoiceAmount: number) => {
    const today = new Date().getDate();
    let isClosed = false;
    let isOverdue = false;
    let daysToClose = 0;
    let daysToDue = 0;

    if (closingDay < dueDay) {
        if (today < closingDay) {
            daysToClose = closingDay - today;
        } else if (today >= closingDay && today <= dueDay) {
            isClosed = true;
            daysToDue = dueDay - today;
        } else {
            isOverdue = true;
        }
    } else {
        if (today <= dueDay) {
            isClosed = true;
            daysToDue = dueDay - today;
        } else if (today > dueDay && today < closingDay) {
            daysToClose = closingDay - today;
        } else {
            isClosed = true;
            const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
            daysToDue = (daysInMonth - today) + dueDay;
        }
    }

    // A CORREÇÃO ESTÁ AQUI: Se o valor for 0, não tem nada atrasado ou fechado aguardando pagamento.
    if (invoiceAmount <= 0) {
        return { 
          label: `Próximo fechamento: Dia ${closingDay}`, 
          color: 'bg-emerald-500 text-white', 
          badge: 'FATURA ZERADA', 
          isUrgent: false 
        };
    }

    // Se tiver valor a pagar, segue a lógica de alerta:
    if (isOverdue) return { label: 'Atrasada', color: 'bg-red-500 text-white animate-pulse', badge: 'ATRASADA', isUrgent: true };
    if (isClosed) {
        if (daysToDue <= 3) return { label: `Vence em ${daysToDue} dias`, color: 'bg-rose-500 text-white', badge: 'VENCE LOGO', isUrgent: true };
        return { label: `Vence dia ${dueDay}`, color: 'bg-sky-500 text-white', badge: 'FECHADA', isUrgent: false };
    }
    
    if (daysToClose <= 3) return { label: `Fecha em ${daysToClose} dias`, color: 'bg-amber-500 text-white', badge: 'FECHA LOGO', isUrgent: true };
    return { label: `Fecha dia ${closingDay}`, color: 'bg-emerald-500 text-white', badge: 'ABERTA', isUrgent: false };
  };

  // --- PAGAR FATURA ---
  const handlePayInvoice = async (cardId: number, cardName: string) => {
    if (!confirm(`Deseja confirmar o pagamento da fatura atual do cartão ${cardName}? O limite será liberado.`)) return;
    
    // Atualiza todas as transações não pagas até hoje para is_paid = true
    const todayStr = new Date().toISOString();
    
    const { error } = await supabase
        .from("transactions")
        .update({ is_paid: true })
        .eq("credit_card_id", cardId)
        .eq("type", "EXPENSE")
        .is("is_paid", false)
        .lte("date", todayStr); 

    if (error) {
        toast.error("Erro ao processar o pagamento.");
        console.error(error);
    } else {
        toast.success(`Fatura do ${cardName} paga! Ciclo renovado.`);
        if (userId) fetchCards(userId); // Recarrega a tela (A fatura vai a zero)
    }
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

  const totalInvoices = cards.reduce((acc, c) => acc + c.current_invoice, 0);
  const globalLimit = cards.reduce((acc, c) => acc + c.limit_amount, 0);
  const globalAvailable = globalLimit - totalInvoices;

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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Limite Global Disponível</p>
                        <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{formatMoney(globalAvailable)}</p>
                     </div>
                  </div>
                </div>

                {/* --- GRID DE CARTÕES --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pt-4">
                  {cards.map(card => {
                    const usage = card.limit_amount > 0 ? (card.current_invoice / card.limit_amount) * 100 : 0;
                    const status = getInvoiceStatus(card.closing_day, card.due_day, card.current_invoice);
                    
                    let progressColor = "bg-white";
                    if (usage > 85) progressColor = "bg-red-400";
                    else if (usage > 60) progressColor = "bg-amber-400";
                    
                    return (
                      <div key={card.id} className="relative group">
                        
                        {/* CARTÃO FÍSICO */}
                        <div 
                          className={`rounded-[20px] shadow-xl dark:shadow-none border p-6 text-white relative overflow-hidden h-56 flex flex-col justify-between transition-all duration-300 z-10 ${status.isUrgent ? 'border-red-400/50 shadow-red-500/20' : 'border-white/20 hover:-translate-y-1 hover:shadow-2xl'}`}
                          style={{ background: `linear-gradient(135deg, ${card.color || '#3b82f6'}, #0f172a)` }}
                        >
                          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
                          
                          {/* Etiqueta de Status Dinâmica */}
                          <div className={`absolute top-4 right-4 text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-sm tracking-wider ${status.color}`}>
                             {status.badge}
                          </div>
                          
                          <div className="flex justify-between items-start z-10 mt-1">
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-8 rounded bg-gradient-to-br from-amber-200 to-amber-400/50 opacity-80 border border-amber-300/30"></div>
                               <svg className="w-5 h-5 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                            </div>
                          </div>
                          
                          <div className="z-10 mt-auto">
                            <h3 className="text-lg font-black tracking-widest opacity-90 drop-shadow-sm uppercase mb-3">{card.name}</h3>
                            <div className="flex justify-between items-end mb-1">
                                <div className="flex flex-col">
                                    <span className="opacity-80 text-[10px] uppercase font-bold tracking-widest mb-1">{status.label}</span>
                                    <span className="font-extrabold text-3xl drop-shadow-sm">{formatMoney(card.current_invoice)}</span>
                                </div>
                            </div>
                          </div>
                        </div>

                        {/* ÁREA DE AÇÕES */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 border-t-0 rounded-b-2xl p-4 pt-6 -mt-4 relative z-0 shadow-sm transition-all">
                            
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Uso do Limite</span>
                                <span className={`text-xs font-bold ${usage > 85 ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}`}>
                                  {isPrivacyMode ? "•••" : usage.toFixed(0)}%
                                </span>
                            </div>
                            
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mb-3">
                                <div className={`h-full rounded-full transition-all duration-1000 ${progressColor}`} style={{ width: `${Math.min(usage, 100)}%` }}></div>
                            </div>

                            <div className="flex justify-between items-center text-xs mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                                <span className="text-slate-400 font-medium">Livre: {formatMoney(card.limit_amount - card.current_invoice)}</span>
                            </div>

                            {/* Botões */}
                            <div className="flex justify-between items-center gap-2">
                               <div className="flex gap-1">
                                 <button onClick={() => handleEdit(card)} className="p-2 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/30 transition-colors" title="Editar Cartão">
                                     <Pencil size={16} />
                                 </button>
                                 <button onClick={() => handleDelete(card.id)} className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors" title="Excluir Cartão">
                                     <Trash2 size={16} />
                                 </button>
                               </div>

                               {card.current_invoice > 0 && (
                                 <button onClick={() => handlePayInvoice(card.id, card.name)} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:hover:bg-emerald-900/60 rounded-xl text-xs font-bold transition-colors shadow-sm active:scale-95">
                                    <CheckCircle2 size={16} /> Pagar Fatura
                                 </button>
                               )}
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