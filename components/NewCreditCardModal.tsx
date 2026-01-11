"use client";

import { useState, useEffect } from "react";
import { X, Loader2, CreditCard, Calendar } from "lucide-react";
import { supabase } from "../lib/supabase";
import CurrencyInput from 'react-currency-input-field';
import { toast } from "sonner";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  onSuccess: () => void;
  cardToEdit?: any;
}

export function NewCreditCardModal({ isOpen, onClose, userId, onSuccess, cardToEdit }: ModalProps) {
  const [name, setName] = useState("");
  const [limit, setLimit] = useState<number | undefined>(undefined);
  const [closingDay, setClosingDay] = useState(1);
  const [dueDay, setDueDay] = useState(10);
  const [brand, setBrand] = useState("MASTERCARD");
  const [color, setColor] = useState("#3b82f6");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && cardToEdit) {
      setName(cardToEdit.name);
      setLimit(cardToEdit.limit_amount);
      setClosingDay(cardToEdit.closing_day);
      setDueDay(cardToEdit.due_day);
      setBrand(cardToEdit.brand);
      setColor(cardToEdit.color || "#3b82f6");
    } else {
      setName(""); setLimit(undefined); setClosingDay(1); setDueDay(10); setBrand("MASTERCARD"); setColor("#3b82f6");
    }
  }, [isOpen, cardToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !limit) return;
    setIsLoading(true);

    const payload = { user_id: userId, name, limit_amount: limit, closing_day: closingDay, due_day: dueDay, brand, color };
    
    let error;
    if (cardToEdit) {
      const { error: err } = await supabase.from("credit_cards").update(payload).eq("id", cardToEdit.id);
      error = err;
    } else {
      const { error: err } = await supabase.from("credit_cards").insert([payload]);
      error = err;
    }

    if (error) {
      toast.error("Erro ao salvar cartão.");
    } else {
      toast.success("Cartão salvo com sucesso!");
      onSuccess();
      onClose();
    }
    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">{cardToEdit ? "Editar Cartão" : "Novo Cartão"}</h2>
          <button onClick={onClose}><X size={20} className="text-slate-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div className="space-y-1">
             <label className="text-xs font-bold text-slate-500 uppercase ml-1">Apelido do Cartão</label>
             <input type="text" required placeholder="Ex: Nubank, Inter..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-500 outline-none font-medium" value={name} onChange={e => setName(e.target.value)} />
          </div>

          <div className="space-y-1">
             <label className="text-xs font-bold text-slate-500 uppercase ml-1">Limite do Cartão</label>
             <CurrencyInput
                  placeholder="R$ 0,00"
                  decimalsLimit={2}
                  decimalScale={2}
                  intlConfig={{ locale: 'pt-BR', currency: 'BRL' }}
                  onValueChange={(value) => setLimit(value ? Number(value.replace(",", ".")) : undefined)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-500 outline-none font-bold text-lg"
                  defaultValue={limit}
             />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
               <label className="text-xs font-bold text-slate-500 uppercase ml-1">Dia Fechamento</label>
               <input type="number" min="1" max="31" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-500 outline-none font-medium" value={closingDay} onChange={e => setClosingDay(Number(e.target.value))} />
            </div>
            <div className="space-y-1">
               <label className="text-xs font-bold text-slate-500 uppercase ml-1">Dia Vencimento</label>
               <input type="number" min="1" max="31" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-500 outline-none font-medium" value={dueDay} onChange={e => setDueDay(Number(e.target.value))} />
            </div>
          </div>

          <div className="space-y-1">
             <label className="text-xs font-bold text-slate-500 uppercase ml-1">Cor do Cartão</label>
             <div className="flex gap-3 overflow-x-auto pb-2">
                {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#000000', '#ec4899'].map(c => (
                  <button key={c} type="button" onClick={() => setColor(c)} className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? 'border-slate-800 scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                ))}
             </div>
          </div>

          <button type="submit" disabled={isLoading} className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 rounded-xl shadow-lg mt-2 flex justify-center items-center gap-2">
            {isLoading ? <Loader2 className="animate-spin" /> : "Salvar Cartão"}
          </button>
        </form>
      </div>
    </div>
  );
}