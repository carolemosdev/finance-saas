"use client";

import { useEffect, useState } from "react";
import { Lightbulb, TrendingUp, PiggyBank, ArrowRight, X } from "lucide-react";

interface Transaction {
  id: number;
  amount: number;
  date: string;
  type: "INCOME" | "EXPENSE";
  categories: { name: string } | null;
}

interface Insight {
  id: string;
  title: string;
  message: string;
  type: "ALERT" | "TREND" | "SAVING";
  icon: any;
}

export function InsightsWidget({ transactions }: { transactions: Transaction[] }) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (transactions.length > 0) generateInsights();
  }, [transactions]);

  const generateInsights = () => {
    const newInsights: Insight[] = [];
    const now = new Date();
    
    // Helper: Formatar Mês (Ex: "2024-01")
    const getMonthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    const currentMonthKey = getMonthKey(now);
    const lastMonthKey = getMonthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    const twoMonthsAgoKey = getMonthKey(new Date(now.getFullYear(), now.getMonth() - 2, 1));

    // Agrupar transações por Mês e Categoria
    const history: Record<string, { total: number; categories: Record<string, number> }> = {};

    transactions.forEach(t => {
      if (t.type !== 'EXPENSE') return;
      
      const tDate = new Date(t.date);
      const mKey = getMonthKey(tDate);
      const catName = t.categories?.name || "Outros";

      if (!history[mKey]) history[mKey] = { total: 0, categories: {} };
      
      history[mKey].total += t.amount;
      history[mKey].categories[catName] = (history[mKey].categories[catName] || 0) + t.amount;
    });

    // 1. ANÁLISE DE CATEGORIA (Mês Atual vs Mês Anterior)
    if (history[currentMonthKey] && history[lastMonthKey]) {
      Object.entries(history[currentMonthKey].categories).forEach(([cat, amount]) => {
        const lastAmount = history[lastMonthKey].categories[cat] || 0;
        
        // Se gastou mais de R$ 100 e aumentou mais de 20%
        if (lastAmount > 0 && amount > lastAmount * 1.2 && amount > 100) {
          const percent = ((amount - lastAmount) / lastAmount) * 100;
          newInsights.push({
            id: `spike-${cat}`,
            type: "ALERT",
            title: `Aumento em ${cat}`,
            message: `Você gastou ${percent.toFixed(0)}% a mais que no mês passado.`,
            icon: TrendingUp
          });
        }
      });
    }

    // 2. TENDÊNCIA DE ALTA (3 meses seguidos subindo)
    const currentTotal = history[currentMonthKey]?.total || 0;
    const lastTotal = history[lastMonthKey]?.total || 0;
    const twoMonthsTotal = history[twoMonthsAgoKey]?.total || 0;

    if (currentTotal > lastTotal && lastTotal > twoMonthsTotal && twoMonthsTotal > 0) {
      newInsights.push({
        id: "trend-up",
        type: "TREND",
        title: "Cuidado: Gastos Crescentes",
        message: "Seu custo de vida subiu por 3 meses consecutivos.",
        icon: TrendingUp
      });
    }

    // 3. POTENCIAL DE ECONOMIA (Categorias "Supérfluas")
    // Lista de categorias que geralmente dá para cortar
    const superfluous = ["Delivery", "Restaurantes", "Lazer", "Assinaturas", "Uber", "Compras"];
    let superfluousTotal = 0;
    
    if (history[currentMonthKey]) {
      Object.entries(history[currentMonthKey].categories).forEach(([cat, val]) => {
        // Verifica se o nome da categoria contém alguma das palavras chave
        if (superfluous.some(s => cat.toLowerCase().includes(s.toLowerCase()))) {
          superfluousTotal += val;
        }
      });

      if (superfluousTotal > 300) { // Se gastou mais de 300 nisso
        const saving = superfluousTotal * 0.20; // Sugere cortar 20%
        newInsights.push({
          id: "saving-opp",
          type: "SAVING",
          title: "Oportunidade de Economia",
          message: `Se reduzir 20% em gastos de estilo de vida, você economiza ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(saving)}/mês.`,
          icon: PiggyBank
        });
      }
    }

    setInsights(newInsights.slice(0, 3)); // Pega só os top 3
  };

  if (!isVisible || insights.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-blue-100 rounded-xl p-5 mb-6 relative animate-in fade-in slide-in-from-top-4 duration-700">
      <button onClick={() => setIsVisible(false)} className="absolute top-3 right-3 text-blue-300 hover:text-blue-500">
        <X size={18} />
      </button>

      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="text-amber-500 fill-amber-500" size={20} />
        <h3 className="font-bold text-gray-800">Insights Financeiros</h3>
      </div>

      <div className="space-y-3">
        {insights.map((insight) => {
          const Icon = insight.icon;
          let colorClass = "text-gray-600";
          if (insight.type === 'ALERT') colorClass = "text-red-600";
          if (insight.type === 'SAVING') colorClass = "text-green-600";
          
          return (
            <div key={insight.id} className="flex items-start gap-3 bg-white/60 p-3 rounded-lg border border-white/50 shadow-sm">
              <div className={`mt-0.5 ${colorClass}`}>
                <Icon size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">{insight.title}</p>
                <p className="text-xs text-gray-600 mt-0.5">{insight.message}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}