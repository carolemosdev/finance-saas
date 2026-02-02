"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { PieChart as PieIcon } from "lucide-react";

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
  // Processamento de Dados
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

  // --- ESTADO VAZIO ---
  if (data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-[520px] flex flex-col justify-center items-center text-center">
        <div className="bg-slate-50 p-4 rounded-full mb-3">
            <PieIcon size={32} className="text-slate-300" />
        </div>
        <p className="text-slate-500 font-medium">Sem despesas neste período.</p>
        <p className="text-slate-400 text-xs mt-1">Suas categorias aparecerão aqui.</p>
      </div>
    );
  }

  // --- GRÁFICO ---
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-[520px] flex flex-col font-sans">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Despesas por Categoria</h3>
        <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-full uppercase tracking-wider">Top {data.length}</span>
      </div>

      <div className="flex-1 flex flex-col items-center gap-6 overflow-hidden">
        
        {/* GRÁFICO PIE */}
        <div className="w-full min-w-0 relative flex-shrink-0" style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                innerRadius={65}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
                cornerRadius={5}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} className="outline-none transition-all hover:opacity-80"/>
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => formatMoney(value)}
                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
              />
            </PieChart>
          </ResponsiveContainer>
          
          {/* TOTAL NO CENTRO */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
             <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Total</span>
             <span className="text-slate-800 font-extrabold text-lg">{formatMoney(totalVisible)}</span>
          </div>
        </div>

        {/* LISTA DE CATEGORIAS */}
        <div className="w-full flex-1 overflow-y-auto custom-scrollbar pr-1 flex flex-col gap-1">
          {data.map((item, index) => {
            const percent = ((item.value / totalVisible) * 100).toFixed(0);
            return (
                <div key={index} className="flex items-center justify-between text-sm group w-full p-3 hover:bg-slate-50 rounded-xl transition-colors">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></div>
                    <span className="text-slate-600 font-bold text-sm truncate">{item.name}</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-slate-400">{percent}%</span>
                    <span className="font-bold text-slate-800 whitespace-nowrap text-sm">{formatMoney(item.value)}</span>
                </div>
                </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}