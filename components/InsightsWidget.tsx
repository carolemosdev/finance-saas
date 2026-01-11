"use client";

import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface InsightsWidgetProps {
  transactions: any[];
}

export function InsightsWidget({ transactions }: InsightsWidgetProps) {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const data = last7Days.map(date => {
    const dayTransactions = transactions.filter(t => t.date.startsWith(date) && t.type === 'EXPENSE');
    const total = dayTransactions.reduce((acc, curr) => acc + curr.amount, 0);
    return {
      date: new Date(date).toLocaleDateString('pt-BR', { weekday: 'short' }),
      value: total,
      fullDate: date
    };
  });

  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-xl shadow-slate-200/60 border-0 flex flex-col">
      <div className="mb-6">
        <h3 className="font-bold text-xl text-slate-800">Gastos da Semana</h3>
        <p className="text-sm text-slate-500">Acompanhe sua evolução diária.</p>
      </div>

      {/* AQUI: Altura fixa obrigatória para o Recharts não bugar */}
      <div className="w-full min-w-0" style={{ height: 250 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#94a3b8' }} 
              dy={10}
            />
            <Tooltip 
              cursor={{ fill: '#f1f5f9', radius: 4 }}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              formatter={(value: any) => [formatMoney(value), "Gasto"]}
            />
            <Bar dataKey="value" radius={[4, 4, 4, 4]} barSize={40}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.value > 0 ? '#6366f1' : '#e2e8f0'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}