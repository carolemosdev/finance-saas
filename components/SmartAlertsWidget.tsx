"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, TrendingDown, Wallet, CalendarClock, X } from "lucide-react";

interface SmartAlertsProps {
  balance: number;
  transactions: any[];
  cards: any[];
}

interface Alert {
  id: string;
  type: "CRITICAL" | "WARNING" | "INFO";
  title: string;
  message: string;
  icon: any;
}

export function SmartAlertsWidget({ balance, transactions, cards }: SmartAlertsProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    generateAlerts();
  }, [balance, transactions, cards]);

  const generateAlerts = () => {
    const newAlerts: Alert[] = [];
    const today = new Date();
    const currentDay = today.getDate();

    // 1. ANÁLISE DE SALDO (Saldo Baixo)
    if (balance < 0) {
      newAlerts.push({
        id: "balance-critical",
        type: "CRITICAL",
        title: "Saldo Negativo",
        message: "Sua conta está no vermelho. Evite juros!",
        icon: AlertTriangle
      });
    } else if (balance < 100) {
      newAlerts.push({
        id: "balance-low",
        type: "WARNING",
        title: "Saldo Baixo",
        message: "Você tem menos de R$ 100,00 disponíveis.",
        icon: Wallet
      });
    }

    // 2. ANÁLISE DE GASTOS FORA DO PADRÃO (Últimos 3 dias)
    const recentBigExpense = transactions.find(t => {
      const tDate = new Date(t.date);
      const diffTime = Math.abs(today.getTime() - tDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      return t.type === 'EXPENSE' && t.amount > 500 && diffDays <= 3;
    });

    if (recentBigExpense) {
      newAlerts.push({
        id: "high-expense",
        type: "INFO",
        title: "Gasto Atípico Detectado",
        message: `Você gastou ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(recentBigExpense.amount)} em "${recentBigExpense.description}".`,
        icon: TrendingDown
      });
    }

    // 3. ANÁLISE DE CARTÕES (Atrasos e Vencimentos Próximos)
    cards.forEach(card => {
      if (card.current_invoice > 0) {
        if (currentDay > card.due_day) {
           newAlerts.push({
            id: `card-late-${card.id}`,
            type: "CRITICAL",
            title: `Fatura em Atraso: ${card.name}`,
            message: `A fatura venceu dia ${card.due_day}. Pague agora para evitar multas.`,
            icon: CalendarClock
          });
        } 
        else if (card.due_day === currentDay || card.due_day === currentDay + 1) {
          newAlerts.push({
            id: `card-due-${card.id}`,
            type: "WARNING",
            title: `Fatura Vence ${card.due_day === currentDay ? 'Hoje' : 'Amanhã'}`,
            message: `Prepare o pagamento do cartão ${card.name}.`,
            icon: CalendarClock
          });
        }
      }
    });

    setAlerts(newAlerts);
  };

  if (!isVisible || alerts.length === 0) return null;

  return (
    <div className="mb-6 space-y-3 animate-in fade-in slide-in-from-top-2 duration-500">
      <div className="flex justify-between items-end px-1">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            ✨ Alertas Inteligentes
        </h3>
        <button onClick={() => setIsVisible(false)} className="text-[10px] uppercase font-bold text-slate-400 hover:text-slate-600 transition-colors">Ocultar</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {alerts.map((alert) => {
          // Estilos alinhados com o Design System (Rose, Amber, Brand/Blue)
          const styles = {
            CRITICAL: "bg-rose-50 border-rose-100 text-rose-900 icon-rose-600",
            WARNING: "bg-amber-50 border-amber-100 text-amber-900 icon-amber-600",
            INFO: "bg-brand-50 border-brand-100 text-brand-900 icon-brand-600",
          }[alert.type];

          const Icon = alert.icon;
          // Extrai a cor do ícone da classe de string
          const iconColorClass = styles.split(" ").pop()?.replace("icon-", "text-");

          return (
            <div key={alert.id} className={`p-4 rounded-2xl border ${styles} flex items-start gap-3 shadow-sm hover:shadow-md transition-shadow`}>
              <div className={`p-2 rounded-full bg-white/80 shrink-0 shadow-sm`}>
                <Icon size={18} className={iconColorClass} />
              </div>
              <div>
                <h4 className="font-bold text-sm">{alert.title}</h4>
                <p className="text-xs opacity-90 mt-1 leading-relaxed font-medium">{alert.message}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}