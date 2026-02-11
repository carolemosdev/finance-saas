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
  
  // MUDANÇA: String para controlar o input
  const [limit, setLimit] = useState<string>("");
  
  const [closingDay, setClosingDay] = useState(1);
  const [dueDay, setDueDay] = useState(10);
  const [brand, setBrand] = useState("MASTERCARD");
  const [color, setColor] = useState("#3b82f6");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && cardToEdit) {
      setName(cardToEdit.name);
      // Converter para string ao carregar
      setLimit(String(cardToEdit.limit_amount));
      setClosingDay(cardToEdit.closing_day);
      setDueDay(cardToEdit.due_day);
      setBrand(cardToEdit.brand);
      setColor(cardToEdit.color || "#3b82f6");
    } else {
      setName(""); setLimit(""); setClosingDay(1); setDueDay(10); setBrand("MASTERCARD"); setColor("#3b82f6");
    }
  }, [isOpen, cardToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !limit) {
        toast.warning("Preencha o limite do cartão.");
        return;
    }
    setIsLoading(true);

    // MUDANÇA: Converter para número ao salvar
    const finalLimit = parseFloat(limit.replace(',', '.') || '0');

    const payload = { 
        user_id: userId, 
        name, 
        limit_amount: finalLimit, 
        closing_day: closingDay, 
        due_day: dueDay, 
        brand, 
        color 
    };
    
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
      toast.success(cardToEdit ? "Cartão atualizado!" : "Cartão criado com sucesso!");
      onSuccess();
      onClose();
    }
    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2 text-slate-800">
             <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100">
                <CreditCard size={20} className="text-brand-600" />
             </div>
             <h2 className="text-xl font-bold">{cardToEdit ? "Editar Cartão" : "Novo Cartão"}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 text-slate-400 transition-colors">
             <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Apelido do Cartão</label>
              <input 
                type="text" 
                required 
                placeholder="Ex: Nubank, Inter..." 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none font-medium text-slate-700 transition-all placeholder:text-slate-400" 
                value={name} 
                onChange={e => setName(e.target.value)} 
              />
          </div>

          <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Limite do Cartão</label>
              <CurrencyInput
                  placeholder="R$ 0,00"
                  decimalsLimit={2}
                  intlConfig={{ locale: 'pt-BR', currency: 'BRL' }}
                  // Value é string
                  value={limit}
                  onValueChange={(value) => setLimit(value || "")}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none font-bold text-lg text-slate-800 transition-all"
              />
          </div>

          {/* ... Resto do form (Datas, Cores) mantido igual ... */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-1"><Calendar size={12}/> Fechamento</label>
               <input type="number" min="1" max="31" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-500 outline-none font-medium text-center text-slate-700" value={closingDay} onChange={e => setClosingDay(Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-1"><Calendar size={12}/> Vencimento</label>
               <input type="number" min="1" max="31" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-500 outline-none font-medium text-center text-slate-700" value={dueDay} onChange={e => setDueDay(Number(e.target.value))} />
            </div>
          </div>

          <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Cor do Cartão</label>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#0f172a', '#ec4899'].map(c => (
                  <button key={c} type="button" onClick={() => setColor(c)} className={`w-9 h-9 rounded-full border-[3px] transition-all hover:scale-110 ${color === c ? 'border-slate-300 scale-110 shadow-md' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                ))}
              </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading} 
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-brand-600/30 mt-4 flex justify-center items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : (cardToEdit ? "Salvar Alterações" : "Criar Cartão")}
          </button>
        </form>
      </div>
    </div>
  );
}