"use client";

import { useEffect, useState } from "react";
import { 
  Sparkles, TrendingDown, AlertCircle, PiggyBank, Target, ArrowRight 
} from "lucide-react";
import { useRouter } from "next/navigation";

interface InsightsWidgetProps {
  transactions: any[];
  balance?: number;
}

interface Insight {
  id: string;
  type: "CRITICAL" | "SUGGESTION" | "POSITIVE";
  title: string;
  message: string;
  icon: any;
  actionText?: string;
  actionRoute?: string;
}

export function InsightsWidget({ transactions, balance = 0 }: InsightsWidgetProps) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const router = useRouter();

  useEffect(() => {
    generateAIInsights();
  }, [transactions, balance]);

  const generateAIInsights = () => {
    const newInsights: Insight[] = [];
    const currentMonth = new Date().getMonth();
    
    const thisMonthTransactions = transactions.filter(t => new Date(t.date).getMonth() === currentMonth);
    const expenses = thisMonthTransactions.filter(t => t.type === 'EXPENSE');
    const incomes = thisMonthTransactions.filter(t => t.type === 'INCOME');

    const totalExpense = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const totalIncome = incomes.reduce((acc, curr) => acc + curr.amount, 0);

    // Regra 1: Fluxo de Caixa Negativo
    if (totalExpense > totalIncome && totalIncome > 0) {
      newInsights.push({
        id: "cashflow-negative",
        type: "CRITICAL",
        title: "Alerta de Sobregasto",
        message: `Você gastou a mais do que ganhou este mês. Cuidado com o cheque especial.`,
        icon: AlertCircle,
        actionText: "Ver Despesas",
        actionRoute: "/expenses"
      });
    }

    // Regra 2: Categoria Vilã
    if (expenses.length > 0) {
      const expensesByCategory = expenses.reduce((acc, curr) => {
        const catName = curr.categories?.name || "Outros";
        acc[catName] = (acc[catName] || 0) + curr.amount;
        return acc;
      }, {} as Record<string, number>);

      const entries = Object.entries(expensesByCategory) as [string, number][];
      const topCategory = entries.sort((a, b) => b[1] - a[1])[0];

      if (topCategory && topCategory[1] > (totalIncome * 0.3) && totalIncome > 0) {
        newInsights.push({
          id: "high-category-spend",
          type: "SUGGESTION",
          title: "Oportunidade de Economia",
          message: `Reduzir os gastos com "${topCategory[0]}" é o caminho mais rápido para sobrar dinheiro este mês!`,
          icon: TrendingDown,
          actionText: "Ajustar Orçamento",
          actionRoute: "/planning"
        });
      }
    }

    // Regra 3: Dinheiro Parado
    if (balance > 1500 && totalExpense < balance) {
      newInsights.push({
        id: "idle-money",
        type: "POSITIVE",
        title: "Dinheiro Parado",
        message: `Você tem saldo livre na conta. Que tal investir uma parte para render juros?`,
        icon: PiggyBank,
        actionText: "Ir para Investimentos",
        actionRoute: "/investments"
      });
    }

    setInsights(newInsights);
  };

  if (insights.length === 0) return null;

  return (
    <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className="bg-gradient-to-r from-brand-600 to-indigo-600 p-1 rounded-md shadow-sm">
            <Sparkles size={14} className="text-white" />
        </div>
        <h3 className="text-xs font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-700 to-indigo-700 dark:from-brand-400 dark:to-indigo-400 uppercase tracking-wider">
            Flui AI Insights
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {insights.map((insight) => {
          const styles = {
            CRITICAL: "bg-rose-50 border-rose-100/60 dark:bg-rose-950/20 dark:border-rose-900/50",
            SUGGESTION: "bg-amber-50 border-amber-100/60 dark:bg-amber-950/20 dark:border-amber-900/50",
            POSITIVE: "bg-emerald-50 border-emerald-100/60 dark:bg-emerald-950/20 dark:border-emerald-900/50",
          }[insight.type];

          const iconStyles = {
            CRITICAL: "bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-400",
            SUGGESTION: "bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400",
            POSITIVE: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400",
          }[insight.type];

          const Icon = insight.icon;

          return (
            <div key={insight.id} className={`p-4 rounded-2xl border ${styles} flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group`}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/40 dark:bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
              <div>
                <div className="flex items-center gap-3 mb-2 relative z-10">
                  <div className={`p-2 rounded-xl ${iconStyles}`}>
                    <Icon size={16} strokeWidth={2.5} />
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{insight.title}</h4>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed relative z-10 mb-3">
                  {insight.message}
                </p>
              </div>
              {insight.actionText && insight.actionRoute && (
                <button 
                  onClick={() => router.push(insight.actionRoute!)}
                  className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 transition-colors mt-auto w-fit relative z-10"
                >
                  {insight.actionText} <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}