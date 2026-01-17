"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Wallet, TrendingUp, TrendingDown, Briefcase, Plus, 
  ArrowUpRight, CreditCard, ArrowRight, LogOut, Lightbulb, PiggyBank, AlertTriangle, CheckCircle2
} from "lucide-react";
import { NewTransactionModal } from "./NewTransactionModal";
import { ExpenseChart } from "./ExpenseChart";
import { OnboardingWidget } from "./OnboardingWidget";
import { SmartAlertsWidget } from "./SmartAlertsWidget";
import { InsightsWidget } from "./InsightsWidget";
import { MobileNav } from "./MobileNav";
import { supabase } from "../lib/supabase";
// 1. IMPORTAÇÃO DO BOTÃO DE PAGAMENTO
import { PayInvoiceButton } from "./PayInvoiceButton";

interface DashboardProps {
  transactions: any[];
  cards: any[];
  assets: any[];
  goals: any[];
  userEmail: string | null;
  userId: string;
  summary: { income: number; expense: number; total: number; };
  totalInvested: number;
  hasAnyTransaction: boolean;
  hasAnyInvestment: boolean;
}

export function DashboardView({ 
  transactions = [], 
  cards = [], 
  assets = [],
  goals = [],
  userEmail,
  userId,
  summary,
  totalInvested,
  hasAnyTransaction,
  hasAnyInvestment
}: DashboardProps) {
  
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const formatMoney = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

  const handleSuccess = () => {
    setIsModalOpen(false);
    router.refresh(); 
  };

  // --- LÓGICA DE ECONOMIA INTELIGENTE ---
  const recommendedSavings = summary.income * 0.20; 
  const currentSavings = summary.income - summary.expense;
  const savingsRate = summary.income > 0 ? (currentSavings / summary.income) * 100 : 0;
  
  let feedbackMessage = "";
  let feedbackColor = "";
  let FeedbackIcon = Lightbulb;
  let savingsPotential = 0;

  if (summary.income === 0) {
    feedbackMessage = "Cadastre suas receitas para receber dicas de economia personalizadas.";
    feedbackColor = "bg-slate-100 border-slate-200 text-slate-600";
    FeedbackIcon = Lightbulb;
  } else if (currentSavings < 0) {
    feedbackMessage = `Cuidado! Você gastou R$ ${formatMoney(Math.abs(currentSavings))} a mais do que ganhou. Tente reduzir gastos não essenciais.`;
    feedbackColor = "bg-red-50 border-red-100 text-red-700";
    FeedbackIcon = AlertTriangle;
  } else if (currentSavings < recommendedSavings) {
    savingsPotential = recommendedSavings - currentSavings;
    feedbackMessage = `Você poupou ${savingsRate.toFixed(0)}% da renda. Pela regra 50/30/20, tente economizar mais ${formatMoney(savingsPotential)} para atingir 20%.`;
    feedbackColor = "bg-amber-50 border-amber-100 text-amber-700";
    FeedbackIcon = PiggyBank;
  } else {
    feedbackMessage = `Parabéns! Você está poupando ${savingsRate.toFixed(0)}% da sua renda. Esse é um ritmo excelente para construir patrimônio.`;
    feedbackColor = "bg-emerald-50 border-emerald-100 text-emerald-700";
    FeedbackIcon = CheckCircle2;
  }
  // ---------------------------------------

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans flex-col md:flex-row">
      
      <MobileNav userEmail={userEmail} onLogout={handleLogout} />

      {/* SIDEBAR DESKTOP */}
      <aside className="w-72 bg-slate-900 hidden md:flex flex-col shadow-2xl z-10 relative shrink-0">
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
          <a href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group bg-brand-600 text-white shadow-md shadow-brand-600/30">
            <Wallet size={20} className="text-white" /> Dashboard
          </a>
          <a href="/incomes" className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group text-slate-400 hover:bg-slate-800 hover:text-white">
            <TrendingUp size={20} /> Receitas
          </a>
          <a href="/expenses" className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group text-slate-400 hover:bg-slate-800 hover:text-white">
            <TrendingDown size={20} /> Despesas
          </a>
          
          <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mt-8 mb-2">Gestão</p>
          <a href="/investments" className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group text-slate-400 hover:bg-slate-800 hover:text-white">
             <Briefcase size={20} /> Investimentos
          </a>
          <a href="/credit-cards" className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group text-slate-400 hover:bg-slate-800 hover:text-white">
             <CreditCard size={20} /> Cartões
          </a>
        </nav>
        
        <div className="p-6 bg-slate-950/50 m-4 rounded-2xl border border-slate-800 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-brand-900 rounded-full flex items-center justify-center text-brand-300 font-bold text-lg mb-3 shadow-md shadow-brand-900/50">
              {userEmail?.charAt(0).toUpperCase()}
          </div>
          <div className="w-full overflow-hidden mb-4">
             <p className="text-sm text-white font-medium truncate w-full" title={userEmail || ''}>{userEmail}</p>
             <p className="text-xs text-slate-500 mt-0.5">Conta Gratuita</p>
          </div>
          <button onClick={handleLogout} className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all w-full border border-slate-700 hover:border-slate-600 active:scale-95">
             <ArrowRight size={16} /> <span>Sair da conta</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto relative z-0">
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-slate-200 px-8 py-5 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-800">Visão Geral</h2>
            <p className="text-slate-500 text-sm hidden md:block">Bem-vindo de volta! Seus dados foram carregados do servidor.</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-full flex items-center gap-2 font-semibold transition-all shadow-lg shadow-brand-600/30 hover:scale-105 active:scale-95">
            <Plus size={20} /> <span className="hidden md:inline">Nova Transação</span>
          </button>
        </header>

        <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
          
          <div className="space-y-6">
            <SmartAlertsWidget balance={summary.total} transactions={transactions} cards={cards} />
            <OnboardingWidget hasTransactions={hasAnyTransaction} hasInvestments={hasAnyInvestment} onOpenTransactionModal={() => setIsModalOpen(true)} />
            
            {hasAnyTransaction && summary.income > 0 && (
              <div className={`p-5 rounded-2xl border flex items-start gap-4 shadow-sm ${feedbackColor}`}>
                <div className="p-2 bg-white/50 rounded-xl shrink-0">
                   <FeedbackIcon size={24} />
                </div>
                <div>
                   <h3 className="font-bold text-lg mb-1">Análise de Economia</h3>
                   <p className="text-sm font-medium opacity-90 leading-relaxed">
                     {feedbackMessage}
                   </p>
                   {savingsPotential > 0 && (
                     <p className="text-xs font-bold mt-2 uppercase tracking-wide opacity-80">
                        Potencial de economia extra: {formatMoney(savingsPotential)}
                     </p>
                   )}
                </div>
              </div>
            )}
          </div>

          {/* CARDS DE RESUMO */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-xl shadow-slate-200/60 border-0 relative overflow-hidden transition-transform hover:-translate-y-1">
              <div className="absolute top-0 right-0 -mr-12 -mt-12 w-32 h-32 bg-brand-50 rounded-full blur-3xl opacity-70"></div>
              <div className="flex justify-between items-start relative">
                <div><p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Saldo Total</p><h3 className={`text-3xl font-extrabold mt-3 ${summary.total >= 0 ? 'text-slate-900' : 'text-red-600'}`}>{formatMoney(summary.total)}</h3></div>
                <div className="p-3 bg-brand-100 text-brand-600 rounded-2xl shadow-sm"><Wallet size={28} /></div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-xl shadow-slate-200/60 border-0 relative overflow-hidden transition-transform hover:-translate-y-1">
              <div className="absolute top-0 right-0 -mr-12 -mt-12 w-32 h-32 bg-purple-50 rounded-full blur-3xl opacity-70"></div>
              <div className="flex justify-between items-start relative">
                <div><p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Investido</p><h3 className="text-3xl font-extrabold mt-3 text-purple-900">{formatMoney(totalInvested)}</h3></div>
                <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl shadow-sm"><Briefcase size={28} /></div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-xl shadow-slate-200/60 border-0 transition-transform hover:-translate-y-1">
              <div className="flex justify-between items-start">
                <div><p className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">Entradas <span className="text-[10px] bg-green-100 text-green-700 px-1.5 rounded font-bold">MÊS</span></p><h3 className="text-3xl font-extrabold text-emerald-600 mt-3">{formatMoney(summary.income)}</h3></div>
                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl shadow-sm"><ArrowUpRight size={28} /></div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-xl shadow-slate-200/60 border-0 transition-transform hover:-translate-y-1">
              <div className="flex justify-between items-start">
                <div><p className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">Saídas <span className="text-[10px] bg-red-100 text-red-700 px-1.5 rounded font-bold">MÊS</span></p><h3 className="text-3xl font-extrabold text-rose-600 mt-3">{formatMoney(summary.expense)}</h3></div>
                <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl shadow-sm"><TrendingDown size={28} /></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 flex flex-col gap-8">
               <InsightsWidget transactions={transactions} />
               
               {/* SEÇÃO DE CARTÕES */}
               {cards.length > 0 && (
                <div className="bg-transparent">
                  <div className="flex items-center justify-between mb-4 px-1">
                    <h3 className="text-xl font-bold text-slate-800">Meus Cartões</h3>
                    <a href="/credit-cards" className="text-sm font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1">Ver todos <ArrowUpRight size={14}/></a>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {cards.slice(0, 2).map((card: any) => {
                      const usage = card.limit_amount > 0 ? (card.current_invoice / card.limit_amount) * 100 : 0;
                      return (
                        <div key={card.id} className="bg-white p-5 rounded-2xl shadow-lg shadow-slate-200/50 border-0 relative overflow-hidden hover:shadow-xl transition-shadow min-h-[11rem] flex flex-col justify-between">
                          <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: card.color }}></div>
                          <div className="pl-4 w-full">
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-bold text-lg text-slate-700 truncate">{card.name}</span>
                                <CreditCard size={20} className="text-slate-400 shrink-0"/>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fatura Atual</p>
                                <p className="text-2xl font-extrabold text-slate-900">{formatMoney(card.current_invoice)}</p>
                            </div>
                          </div>
                          
                          {/* Barra de Progresso */}
                          <div className="pl-4 w-full flex items-center gap-3 mb-2">
                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(usage, 100)}%`, backgroundColor: card.color }}></div>
                              </div>
                              <p className="text-[10px] font-bold text-slate-500 whitespace-nowrap">{usage.toFixed(0)}% uso</p>
                          </div>

                          {/* 2. BOTÃO DE PAGAR FATURA ADICIONADO AQUI */}
                          <div className="pl-4 w-full flex justify-end mt-1">
                            <PayInvoiceButton 
                                cardId={card.id} 
                                invoiceAmount={card.current_invoice} 
                                userId={userId} 
                            />
                          </div>

                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="lg:col-span-1">
                <ExpenseChart transactions={transactions} />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border-0 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-bold text-xl text-slate-800">Transações Recentes</h3>
                  <a href="/expenses" className="text-sm font-medium text-brand-600 hover:text-brand-700">Ver tudo</a>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                      <th className="p-5">Descrição</th>
                      <th className="p-5">Categoria</th>
                      <th className="p-5">Data</th>
                      <th className="p-5 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.slice(0, 5).map((t: any) => (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-5"><p className="text-slate-900 font-bold">{t.description}</p></td>
                        <td className="p-5"><span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider">{t.categories?.name || "Geral"}</span></td>
                        <td className="p-5 text-slate-500 text-sm font-medium">{new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</td>
                        <td className={`p-5 text-right font-extrabold ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>{t.type === 'INCOME' ? '+' : '-'} {formatMoney(t.amount)}</td>
                      </tr>
                    ))}
                    {transactions.length === 0 && <tr><td colSpan={4} className="p-12 text-center text-slate-500">Nenhuma transação encontrada.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
        </div>
      </main>

      <NewTransactionModal 
        isOpen={isModalOpen} 
        onClose={handleSuccess} 
        userId={userId} 
      />
    </div>
  );
}