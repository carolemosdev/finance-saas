"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface Transaction {
  amount: number;
  type: "INCOME" | "EXPENSE";
  categories: { name: string } | null;
}

interface ExpenseChartProps {
  transactions: Transaction[];
}

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316", "#84cc16", "#64748b"];

export function ExpenseChart({ transactions }: ExpenseChartProps) {
  const dataMap = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((acc, curr) => {
      const cat = curr.categories?.name || "Outros";
      acc[cat] = (acc[cat] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

  const data = Object.keys(dataMap)
    .map((name, index) => ({
      name,
      value: dataMap[name],
      color: COLORS[index % COLORS.length],
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const formatMoney = (val: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
  const totalVisible = data.reduce((acc, curr) => acc + curr.value, 0);

  if (data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-xl shadow-slate-200/60 border-0 h-[520px] flex flex-col justify-center items-center text-center">
        <p className="text-slate-400 text-sm font-medium">Sem despesas para exibir.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-xl shadow-slate-200/60 border-0 h-[520px] flex flex-col font-sans">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-xl text-slate-800">Despesas por Categoria</h3>
        <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-full uppercase tracking-wider">Top {data.length}</span>
      </div>

      <div className="flex-1 flex flex-col items-center gap-6 overflow-hidden">
        
        {/* CORREÇÃO: Adicionado 'w-full min-w-0' e style explícito para garantir dimensões */}
        <div className="w-full min-w-0 relative flex-shrink-0" style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                innerRadius={70}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
                cornerRadius={6}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} className="outline-none transition-all hover:opacity-80"/>
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
             <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Total Visível</span>
             <span className="text-slate-800 font-extrabold text-lg">{formatMoney(totalVisible)}</span>
          </div>
        </div>

        <div className="w-full flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-3">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between text-sm group w-full p-2 hover:bg-slate-50 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full shrink-0 shadow-sm ring-2 ring-white" style={{ backgroundColor: item.color }}></div>
                <span className="text-slate-600 font-medium text-sm">{item.name}</span>
              </div>
              <span className="font-bold text-slate-800 whitespace-nowrap text-sm">{formatMoney(item.value)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}