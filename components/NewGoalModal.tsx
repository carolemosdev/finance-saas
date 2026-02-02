"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Target } from "lucide-react";
import { supabase } from "../lib/supabase";
import CurrencyInput from 'react-currency-input-field';
import { toast } from "sonner";

interface GoalProps { 
  isOpen: boolean; 
  onClose: () => void; 
  userId: string | null; 
  goalToEdit?: any; 
}

export function NewGoalModal({ isOpen, onClose, userId, goalToEdit }: GoalProps) {
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState<number | undefined>(undefined);
  const [currentAmount, setCurrentAmount] = useState<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && goalToEdit) {
      setName(goalToEdit.name);
      setTargetAmount(goalToEdit.target_amount);
      setCurrentAmount(goalToEdit.current_amount);
    } else {
      setName(""); 
      setTargetAmount(undefined); 
      setCurrentAmount(undefined);
    }
  }, [isOpen, goalToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !targetAmount) {
        toast.warning("Defina um valor alvo para a meta.");
        return;
    }
    setIsLoading(true);

    const payload = { 
        user_id: userId, 
        name, 
        target_amount: targetAmount, 
        current_amount: currentAmount || 0 
    };
    
    let error;

    if (goalToEdit) {
       const { error: err } = await supabase.from("goals").update(payload).eq("id", goalToEdit.id);
       error = err;
    } else {
       const { error: err } = await supabase.from("goals").insert([payload]);
       error = err;
    }

    if (error) {
        toast.error("Erro ao salvar meta.");
    } else {
      toast.success(goalToEdit ? "Meta atualizada!" : "Meta criada com sucesso!");
      onClose(); // Na página de planejamento, onClose aciona o recarregamento (fetch)
    }
    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Cabeçalho */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2 text-slate-800">
             <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100">
                <Target size={20} className="text-brand-600" />
             </div>
             <h2 className="text-xl font-bold">{goalToEdit ? "Editar Meta" : "Nova Meta"}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 text-slate-400 transition-colors">
             <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Nome da Meta</label>
              <input 
                type="text" 
                required 
                placeholder="Ex: Viagem, Carro Novo..." 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none font-medium text-slate-700 transition-all placeholder:text-slate-400" 
                value={name} 
                onChange={e => setName(e.target.value)} 
              />
          </div>
          
          <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Valor Alvo (Objetivo)</label>
              <CurrencyInput
                  placeholder="R$ 0,00"
                  decimalsLimit={2}
                  decimalScale={2}
                  intlConfig={{ locale: 'pt-BR', currency: 'BRL' }}
                  onValueChange={(value) => setTargetAmount(value ? Number(value.replace(",", ".")) : undefined)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none font-bold text-lg text-slate-800 transition-all"
                  value={targetAmount} // Alterado defaultValue para value para controle correto
              />
          </div>

          <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Já Guardado (Opcional)</label>
              <CurrencyInput
                  placeholder="R$ 0,00"
                  decimalsLimit={2}
                  decimalScale={2}
                  intlConfig={{ locale: 'pt-BR', currency: 'BRL' }}
                  onValueChange={(value) => setCurrentAmount(value ? Number(value.replace(",", ".")) : undefined)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none font-medium text-slate-700 transition-all"
                  value={currentAmount}
              />
          </div>

          <button 
            type="submit" 
            disabled={isLoading} 
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-brand-600/30 mt-4 flex justify-center items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : (goalToEdit ? "Salvar Alterações" : "Criar Meta")}
          </button>
        </form>
      </div>
    </div>
  );
}