"use client";

import { useState } from "react";
import { Check, Loader2, CreditCard } from "lucide-react";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface PayInvoiceButtonProps {
  cardId: number;
  invoiceAmount: number;
  userId: string;
}

export function PayInvoiceButton({ cardId, invoiceAmount, userId }: PayInvoiceButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handlePay = async () => {
    if (invoiceAmount <= 0) return;
    
    // Confirmação simples
    const confirm = window.confirm(`Deseja pagar a fatura de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(invoiceAmount)}? O valor será debitado do seu saldo.`);
    if (!confirm) return;

    setIsLoading(true);

    try {
      // Chama a nossa função SQL Blindada
      const { data, error } = await supabase.rpc('pay_credit_card_invoice', {
        p_card_id: cardId,
        p_user_id: userId,
        p_date: new Date().toISOString()
      });

      if (error) throw error;

      if (data && data.success) {
        toast.success("Fatura paga com sucesso!");
        router.refresh(); // Atualiza a tela para zerar a fatura
      } else {
        toast.info(data?.message || "Não foi possível pagar.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao processar pagamento.");
    } finally {
      setIsLoading(false);
    }
  };

  if (invoiceAmount <= 0) {
    return (
      <button disabled className="text-xs font-bold text-slate-400 flex items-center gap-1 bg-slate-100 px-3 py-2 rounded-lg cursor-not-allowed opacity-70">
        <Check size={14} /> Fatura Paga
      </button>
    );
  }

  return (
    <button 
      onClick={handlePay} 
      disabled={isLoading}
      className="text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all active:scale-95"
    >
      {isLoading ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
      Pagar Fatura
    </button>
  );
}