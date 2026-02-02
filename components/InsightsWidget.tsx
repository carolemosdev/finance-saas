"use client";

import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface InsightsWidgetProps {
  transactions: any[];
}

export function InsightsWidget({ transactions }: InsightsWidgetProps) {
  // Gera os últimos 7 dias
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  // Processa os dados
  const data = last7Days.map(date => {
    // Filtra gastos do dia (ajustar fuso se necessário, aqui simplificado string match)
    const dayTransactions = transactions.filter(t => t.date.startsWith(date) && t.type === 'EXPENSE');
    const total = dayTransactions.reduce((acc, curr) => acc + curr.amount, 0);
    
    // Dia da semana (seg, ter...)
    const dayLabel = new Date(date).toLocaleDateString('pt-BR', { weekday: 'short' });
    
    return {
      date: dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1).replace('.', ''), // Capitaliza: Seg, Ter...
      value: total,
      fullDate: date
    };
  });

  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full">
      <div className="mb-6">
        <h3 className="font-bold text-sm text-slate-500 uppercase tracking-wider">Gastos da Semana</h3>
        <p className="text-2xl font-extrabold text-slate-800 mt-1">
            {formatMoney(data.reduce((acc, curr) => acc + curr.value, 0))}
        </p>
      </div>

      {/* Container do Gráfico com altura fixa para evitar bugs de renderização */}
      <div className="w-full flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barSize={32}>
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} 
              dy={10}
            />
            <Tooltip 
              cursor={{ fill: '#f8fafc', radius: 4 }}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              formatter={(value: any) => [formatMoney(value), "Gasto"]}
              labelStyle={{ color: '#64748b', marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}
            />
            <Bar dataKey="value" radius={[4, 4, 4, 4]}>
              {data.map((entry, index) => (
                // Destaca o dia com maior gasto com uma cor mais forte (Brand-600 vs Brand-300)
                <Cell 
                    key={`cell-${index}`} 
                    fill={entry.value > 0 ? '#6366f1' : '#e2e8f0'} 
                    className="transition-all hover:opacity-80"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}