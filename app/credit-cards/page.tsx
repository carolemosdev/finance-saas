"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { 
  LayoutDashboard, Wallet, TrendingUp, TrendingDown, PieChart, LogOut, 
  CreditCard, Plus, Loader2, Trash2, Pencil
} from "lucide-react";
import { NewCreditCardModal } from "../../components/NewCreditCardModal";
import { MobileNav } from "../../components/MobileNav";

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
      setUserId(user.id); setUserEmail(user.email ?? null); fetchCards(user.id);
    };
    checkUser();
  }, [router]);

  const fetchCards = async (uid: string) => {
    setIsLoading(true);
    const { data } = await supabase.from("credit_cards").select("*").eq("user_id", uid).order('created_at', { ascending: true });
    if (data) {
       const cardsWithInvoice = await Promise.all(data.map(async (card) => {
        const { data: transactions } = await supabase.from("transactions").select("amount").eq("credit_card_id", card.id).eq("type", "EXPENSE");
        const totalSpent = transactions?.reduce((acc, curr) => acc + curr.amount, 0) || 0;
        return { ...card, current_invoice: totalSpent };
      }));
      setCards(cardsWithInvoice);
    }
    setIsLoading(false);
  };

  const handleDelete = async (id: number) => { if (!confirm("Tem certeza?")) return; await supabase.from("credit_cards").delete().eq("id", id); if (userId) fetchCards(userId); };
  const handleEdit = (card: any) => { setCardToEdit(card); setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setCardToEdit(undefined); };
  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/auth"); };
  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  
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
          <SidebarLink href="/credit-cards" icon={CreditCard} label="Cartões" active={true} />
        </nav>
        <div className="p-6 bg-slate-950/50 m-4 rounded-2xl border border-slate-800 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-brand-900 rounded-full flex items-center justify-center text-brand-300 font-bold text-lg mb-3 shadow-md shadow-brand-900/50">{userEmail?.charAt(0).toUpperCase()}</div>
          <div className="w-full overflow-hidden mb-4"><p className="text-sm text-white font-medium truncate w-full" title={userEmail || ''}>{userEmail}</p><p className="text-xs text-slate-500 mt-0.5">Conta Gratuita</p></div>
          <button onClick={handleLogout} className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all w-full border border-slate-700 hover:border-slate-600 active:scale-95"><LogOut size={16} /> <span>Sair da conta</span></button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8 relative z-0">
        <header className="flex justify-between items-center mb-8">
          <div><h2 className="text-3xl font-extrabold text-slate-800">Meus Cartões</h2><p className="text-slate-500">Gerencie seus limites e datas.</p></div>
          {cards.length > 0 && <button onClick={() => setIsModalOpen(true)} className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-full flex items-center gap-2 font-semibold shadow-lg shadow-brand-600/30 transition-all hover:scale-105"><Plus size={20} /> Novo Cartão</button>}
        </header>

        {isLoading ? <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-brand-600" size={32}/></div> : (
          <>
            {cards.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl shadow-xl shadow-slate-200/60 border-0">
                <div className="bg-brand-50 p-6 rounded-full mb-6"><CreditCard className="text-brand-500 w-16 h-16" /></div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Sem cartões por enquanto</h3>
                <p className="text-slate-500 mb-8 max-w-md text-center">Adicione seus cartões para controlar faturas e limites.</p>
                <button onClick={() => setIsModalOpen(true)} className="bg-brand-600 hover:bg-brand-700 text-white px-8 py-3 rounded-full font-bold flex items-center gap-2 transition-all shadow-lg hover:scale-105"><Plus size={20} /> Cadastrar Primeiro Cartão</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {cards.map(card => {
                  const usage = (card.current_invoice / card.limit_amount) * 100;
                  return (
                    // MUDANÇA AQUI: Removi group-hover, agora os botões aparecem sempre ou em click
                    <div key={card.id} className="rounded-2xl shadow-xl shadow-slate-200/60 border-0 p-6 text-white relative overflow-hidden h-64 flex flex-col justify-between transition-transform hover:-translate-y-2" style={{ backgroundColor: card.color || '#3b82f6' }}>
                      <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 bg-white/20 rounded-full blur-2xl pointer-events-none"></div>
                      
                      <div className="flex justify-between items-start z-10">
                        <div><p className="text-xs font-bold opacity-80 uppercase tracking-widest">{card.brand}</p><h3 className="text-xl font-bold tracking-wide mt-1">{card.name}</h3></div>
                        {/* Botões VISÍVEIS (Sem group-hover) */}
                        <div className="flex gap-2">
                           <button onClick={(e) => { e.stopPropagation(); handleEdit(card); }} className="bg-black/20 p-2 rounded-full hover:bg-white/20 transition-colors active:scale-95"><Pencil size={16} className="text-white" /></button>
                           <button onClick={(e) => { e.stopPropagation(); handleDelete(card.id); }} className="bg-black/20 p-2 rounded-full hover:bg-red-500/80 transition-colors active:scale-95"><Trash2 size={16} className="text-white" /></button>
                        </div>
                      </div>
                      
                      <div className="z-10 mt-4">
                        <div className="flex justify-between text-xs opacity-90 mb-2"><div className="flex flex-col"><span className="opacity-70 text-[10px]">FECHAMENTO</span><span className="font-bold">DIA {card.closing_day}</span></div><div className="flex flex-col text-right"><span className="opacity-70 text-[10px]">VENCIMENTO</span><span className="font-bold">DIA {card.due_day}</span></div></div>
                        <div className="border-t border-white/20 pt-3 mt-1 flex justify-between items-end"><div><p className="text-xs opacity-80">LIMITE TOTAL</p><p className="text-lg font-bold">{formatMoney(card.limit_amount)}</p></div><div className="text-right"><p className="text-xs opacity-80">USO</p><p className="text-sm font-bold">{usage.toFixed(0)}%</p></div></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
      <NewCreditCardModal isOpen={isModalOpen} onClose={handleCloseModal} userId={userId} onSuccess={() => userId && fetchCards(userId)} cardToEdit={cardToEdit} />
    </div>
  );
}