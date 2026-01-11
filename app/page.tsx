"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  LogOut, 
  Plus,
  Loader2,
  Briefcase,
  AlertCircle, 
  Tags,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { NewTransactionModal } from "../components/NewTransactionModal";
import { ExpenseChart } from "../components/ExpenseChart";
import { supabase } from "../lib/supabase";
import { getCurrentPrice } from "../lib/priceService";
import { OnboardingWidget } from "../components/OnboardingWidget";
import { SmartAlertsWidget } from "../components/SmartAlertsWidget";
import { InsightsWidget } from "../components/InsightsWidget";

// ... (Interfaces Transaction e Card permanecem iguais)
interface Transaction {
  id: number;
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  date: string;
  categories: { name: string } | null;
}

interface Card {
  id: number;
  name: string;
  brand: string;
  color: string;
  limit_amount: number;
  due_day: number;
  current_invoice: number;
}

export default function Home() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cards, setCards] = useState<Card[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Estados dos Resumos
  const [summary, setSummary] = useState({ income: 0, expense: 0, total: 0 });
  const [totalInvested, setTotalInvested] = useState(0);
  const [topExpense, setTopExpense] = useState<{ name: string; value: number } | null>(null);
  const [hasAnyTransaction, setHasAnyTransaction] = useState(false);
  const [hasAnyInvestment, setHasAnyInvestment] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth");
      } else {
        setUserId(user.id);
        setUserEmail(user.email);
        fetchData(user.id);
      }
    };
    checkUser();
  }, [router]);

  async function fetchData(currentUserId: string) {
    setIsLoading(true);
    
    // 1. BUSCA TRANSAÇÕES
    const { data: transactionsData } = await supabase
      .from("transactions")
      .select(`*, categories (name)`)
      .eq('user_id', currentUserId)
      .order('date', { ascending: false });

    if (transactionsData) {
      // @ts-ignore 
      setTransactions(transactionsData);
      setHasAnyTransaction(transactionsData.length > 0);
      // @ts-ignore
      calculateSummary(transactionsData);
      // @ts-ignore
      calculateTopExpense(transactionsData);
    }

    // 2. BUSCA INVESTIMENTOS
    const { data: assetsData } = await supabase.from("assets").select("*").eq("user_id", currentUserId);
    const { data: goalsData } = await supabase.from("goals").select("id").eq("user_id", currentUserId);

    if (assetsData) {
      let totalAssetsValue = 0;
      await Promise.all(assetsData.map(async (asset) => {
        const price = await getCurrentPrice(asset.ticker || asset.name, asset.type);
        totalAssetsValue += price * asset.quantity;
      }));
      setTotalInvested(totalAssetsValue);
    }
    setHasAnyInvestment((assetsData && assetsData.length > 0) || (goalsData && goalsData.length > 0) || false);

    // 3. BUSCA CARTÕES
    const { data: cardsData } = await supabase.from("credit_cards").select("*").eq("user_id", currentUserId);
    if (cardsData) {
      const cardsWithInvoice = await Promise.all(cardsData.map(async (card) => {
        const { data: cardTrans } = await supabase
          .from("transactions")
          .select("amount")
          .eq("credit_card_id", card.id)
          .eq("type", "EXPENSE");
        const invoice = cardTrans?.reduce((acc, curr) => acc + curr.amount, 0) || 0;
        return { ...card, current_invoice: invoice };
      }));
      setCards(cardsWithInvoice);
    }
    setIsLoading(false);
  }

  function calculateSummary(items: Transaction[]) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    let income = 0; let expense = 0; let total = 0;
    items.forEach(item => {
      if (item.type === "INCOME") total += item.amount; else total -= item.amount;
      const tDate = new Date(item.date);
      if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) {
        if (item.type === "INCOME") income += item.amount; else expense += item.amount;
      }
    });
    setSummary({ income, expense, total });
  }

  function calculateTopExpense(items: Transaction[]) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthlyExpenses = items.filter(t => {
      const tDate = new Date(t.date);
      return t.type === 'EXPENSE' && tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
    });
    const grouped: Record<string, number> = {};
    monthlyExpenses.forEach(t => {
      const catName = t.categories?.name || "Outros";
      grouped[catName] = (grouped[catName] || 0) + t.amount;
    });
    let maxName = ""; let maxValue = 0;
    Object.entries(grouped).forEach(([name, val]) => { if (val > maxValue) { maxValue = val; maxName = name; } });
    setTopExpense(maxValue > 0 ? { name: maxName, value: maxValue } : null);
  }

  const formatMoney = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

  // Componente de Link da Sidebar (para evitar repetição e facilitar estilo)
  const SidebarLink = ({ href, icon: Icon, label, active = false }: any) => (
    <a href={href} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group ${active ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
      <Icon size={20} className={active ? 'text-white' : 'text-slate-500 group-hover:text-white transition-colors'} /> 
      {label}
    </a>
  );

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      
{/* --- SIDEBAR DARK PREMIUM (Sem Categorias) --- */}
      <aside className="w-72 bg-slate-900 hidden md:flex flex-col shadow-2xl z-10 relative">
        <div className="p-8">
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3 tracking-tight">
            <div className="bg-brand-600 p-2 rounded-lg shadow-lg shadow-brand-600/50">
              <Wallet className="w-7 h-7 text-white" /> 
            </div>
            FinSaaS
          </h1>
        </div>
        
        <nav className="flex-1 px-6 space-y-3 overflow-y-auto py-4 custom-scrollbar">
          <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Principal</p>
          <SidebarLink href="/" icon={LayoutDashboard} label="Dashboard" active={true} />
          <SidebarLink href="/incomes" icon={TrendingUp} label="Receitas" />
          <SidebarLink href="/expenses" icon={TrendingDown} label="Despesas" />
          
          <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mt-8 mb-2">Gestão</p>
          <SidebarLink href="/investments" icon={PieChart} label="Investimentos" />
          <SidebarLink href="/credit-cards" icon={CreditCard} label="Cartões" />
          {/* REMOVIDO: Link de Categorias */}
        </nav>

        <div className="p-6 bg-slate-950/50 m-4 rounded-2xl border border-slate-800 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-brand-900 rounded-full flex items-center justify-center text-brand-300 font-bold text-lg mb-3 shadow-md shadow-brand-900/50">
              {userEmail?.charAt(0).toUpperCase()}
          </div>
          <div className="w-full overflow-hidden mb-4">
               <p className="text-sm text-white font-medium truncate w-full" title={userEmail || ''}>
                 {userEmail}
               </p>
               <p className="text-xs text-slate-500 mt-0.5">Conta Gratuita</p>
          </div>
          <button onClick={handleLogout} className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all w-full border border-slate-700 hover:border-slate-600 active:scale-95">
            <LogOut size={16} /> 
            <span>Sair da conta</span>
          </button>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 overflow-y-auto relative z-0">
        {/* Header com gradiente sutil */}
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-slate-200 px-8 py-5 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-800">Visão Geral</h2>
            <p className="text-slate-500 text-sm">Bem-vindo de volta! Aqui está o resumo das suas finanças.</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-full flex items-center gap-2 font-semibold transition-all shadow-lg shadow-brand-600/30 hover:scale-105 active:scale-95">
            <Plus size={20} /> Nova Transação
          </button>
        </header>

        <div className="p-8 space-y-8 max-w-7xl mx-auto">
          
          {/* WIDGETS INTELIGENTES (Onboarding & Alertas) */}
          {!isLoading && (
            <div className="space-y-6">
              <SmartAlertsWidget balance={summary.total} transactions={transactions} cards={cards} />
              <OnboardingWidget hasTransactions={hasAnyTransaction} hasInvestments={hasAnyInvestment} onOpenTransactionModal={() => setIsModalOpen(true)} />
            </div>
          )}

          {/* --- CARDS DE RESUMO (Novo Visual Flutuante) --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Saldo Total */}
            <div className="bg-white p-6 rounded-2xl shadow-xl shadow-slate-200/60 border-0 relative overflow-hidden transition-transform hover:-translate-y-1">
              <div className="absolute top-0 right-0 -mr-12 -mt-12 w-32 h-32 bg-brand-50 rounded-full blur-3xl opacity-70"></div>
              <div className="flex justify-between items-start relative">
                <div>
                   <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Saldo Total</p>
                   <h3 className={`text-3xl font-extrabold mt-3 ${summary.total >= 0 ? 'text-slate-900' : 'text-red-600'}`}>{formatMoney(summary.total)}</h3>
                </div>
                <div className="p-3 bg-brand-100 text-brand-600 rounded-2xl shadow-sm">
                  <Wallet size={28} />
                </div>
              </div>
            </div>

             {/* Total Investido */}
             <div className="bg-white p-6 rounded-2xl shadow-xl shadow-slate-200/60 border-0 relative overflow-hidden transition-transform hover:-translate-y-1">
              <div className="absolute top-0 right-0 -mr-12 -mt-12 w-32 h-32 bg-purple-50 rounded-full blur-3xl opacity-70"></div>
              <div className="flex justify-between items-start relative">
                <div>
                   <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Investido</p>
                   <h3 className="text-3xl font-extrabold mt-3 text-purple-900">{formatMoney(totalInvested)}</h3>
                </div>
                <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl shadow-sm">
                  <Briefcase size={28} />
                </div>
              </div>
            </div>

            {/* Entradas */}
            <div className="bg-white p-6 rounded-2xl shadow-xl shadow-slate-200/60 border-0 transition-transform hover:-translate-y-1">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">Entradas <span className="text-[10px] bg-green-100 text-green-700 px-1.5 rounded font-bold">MÊS</span></p>
                  <h3 className="text-3xl font-extrabold text-emerald-600 mt-3">{formatMoney(summary.income)}</h3>
                </div>
                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl shadow-sm">
                  <ArrowUpRight size={28} />
                </div>
              </div>
            </div>

            {/* Saídas */}
            <div className="bg-white p-6 rounded-2xl shadow-xl shadow-slate-200/60 border-0 transition-transform hover:-translate-y-1">
              <div className="flex justify-between items-start">
                <div>
                   <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">Saídas <span className="text-[10px] bg-red-100 text-red-700 px-1.5 rounded font-bold">MÊS</span></p>
                   <h3 className="text-3xl font-extrabold text-rose-600 mt-3">{formatMoney(summary.expense)}</h3>
                </div>
                <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl shadow-sm">
                  <ArrowDownRight size={28} />
                </div>
              </div>
            </div>
          </div>

          {/* INSIGHTS & CARTÕES */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Coluna da Esquerda: Insights + Cartões */}
            <div className="lg:col-span-2 space-y-8">
               {!isLoading && <InsightsWidget transactions={transactions} />}
               
               {cards.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4 px-1">
                    <h3 className="text-xl font-bold text-slate-800">Meus Cartões</h3>
                    <a href="/credit-cards" className="text-sm font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1">Ver todos <ArrowUpRight size={14}/></a>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {cards.slice(0, 2).map(card => { // Mostra só os 2 primeiros
                      const usage = (card.current_invoice / card.limit_amount) * 100;
                      return (
                        <div key={card.id} className="bg-white p-5 rounded-2xl shadow-lg shadow-slate-200/50 border-0 relative overflow-hidden hover:shadow-xl transition-shadow">
                          <div className="absolute top-0 left-0 w-2 h-full" style={{ backgroundColor: card.color }}></div>
                          <div className="pl-4">
                            <div className="flex justify-between items-start mb-4">
                              <span className="font-bold text-lg text-slate-700">{card.name}</span>
                              <CreditCard size={22} className="text-slate-400"/>
                            </div>
                            
                            <div className="mb-4">
                              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Fatura Atual</p>
                              <p className="text-2xl font-extrabold text-slate-900">{formatMoney(card.current_invoice)}</p>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(usage, 100)}%`, backgroundColor: card.color }}></div>
                              </div>
                              <p className="text-xs font-bold text-slate-500 whitespace-nowrap">{usage.toFixed(0)}% uso</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Coluna da Direita: Gráfico */}
            <div className="lg:col-span-1">
               <ExpenseChart transactions={transactions} />
            </div>
          </div>


          {/* TABELA RECENTES (Novo Visual Clean) */}
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border-0 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-xl text-slate-800">Transações Recentes</h3>
                <a href="/expenses" className="text-sm font-medium text-brand-600 hover:text-brand-700">Ver tudo</a>
              </div>
              
              {isLoading ? (
                <div className="p-12 text-center text-slate-500"><Loader2 className="animate-spin mx-auto mb-3 text-brand-500" size={24} /> Carregando dados...</div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                      <th className="p-5 rounded-tl-2xl">Descrição</th>
                      <th className="p-5">Categoria</th>
                      <th className="p-5">Data</th>
                      <th className="p-5 text-right rounded-tr-2xl">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.slice(0, 5).map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-5">
                          <p className="text-slate-900 font-bold">{t.description}</p>
                          {t.type === 'EXPENSE' && t.categories?.name && <span className="md:hidden text-xs text-slate-500">{t.categories.name}</span>}
                        </td>
                        <td className="p-5 hidden md:table-cell">
                          <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider">{t.categories?.name || "Geral"}</span>
                        </td>
                        <td className="p-5 text-slate-500 text-sm font-medium">{new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</td>
                        <td className={`p-5 text-right font-extrabold ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {t.type === 'INCOME' ? '+' : '-'} {formatMoney(t.amount)}
                        </td>
                      </tr>
                    ))}
                    {transactions.length === 0 && <tr><td colSpan={4} className="p-12 text-center text-slate-500">Nenhuma transação encontrada.</td></tr>}
                  </tbody>
                </table>
              )}
            </div>
        </div>
      </main>

      <NewTransactionModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          if (userId) fetchData(userId);
        }}
        userId={userId}
      />
    </div>
  );
}