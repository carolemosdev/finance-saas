"use client";

import { useState, useEffect } from "react";
import { X, Loader2, DollarSign, Hash } from "lucide-react";
import { supabase } from "../lib/supabase";
import CurrencyInput from 'react-currency-input-field';
import { toast } from "sonner";

// --- INTERFACE ATUALIZADA ---
interface NewAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  assetToEdit?: any;
  onSuccess: () => void; // <--- OBRIGATÓRIO: Para atualizar a lista após salvar
}

export function NewAssetModal({ isOpen, onClose, userId, assetToEdit, onSuccess }: NewAssetModalProps) {
  const [name, setName] = useState("");
  const [ticker, setTicker] = useState("");
  const [type, setType] = useState<"FIXED" | "STOCK" | "FII" | "CRYPTO">("FIXED");
  const [amount, setAmount] = useState<number | undefined>(undefined); // Valor Total
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState(false);

  // Carregar dados se for edição
  useEffect(() => {
    if (isOpen) {
      if (assetToEdit) {
        setName(assetToEdit.name || "");
        setTicker(assetToEdit.ticker || "");
        setType(assetToEdit.type || "FIXED");
        setAmount(assetToEdit.current_amount);
        setQuantity(assetToEdit.quantity || 1);
      } else {
        // Resetar form
        setName("");
        setTicker("");
        setType("FIXED");
        setAmount(undefined);
        setQuantity(1);
      }
    }
  }, [isOpen, assetToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !amount) {
      toast.error("Preencha o valor do investimento!");
      return;
    }
    setLoading(true);

    const payload = {
      user_id: userId,
      name: name || ticker, // Se não tiver nome, usa o ticker
      ticker: ticker.toUpperCase(),
      type,
      current_amount: amount,
      quantity
    };

    let error;

    if (assetToEdit) {
      const { error: err } = await supabase.from('assets').update(payload).eq('id', assetToEdit.id);
      error = err;
    } else {
      const { error: err } = await supabase.from('assets').insert(payload);
      error = err;
    }

    if (error) {
      toast.error("Erro ao salvar ativo");
    } else {
      toast.success(assetToEdit ? "Ativo atualizado!" : "Ativo adicionado!");
      onSuccess(); // <--- ATUALIZA A TELA DE FUNDO
      onClose();
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 overflow-hidden">
        
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800">
            {assetToEdit ? "Editar Ativo" : "Novo Investimento"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Tipo de Ativo */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Tipo de Ativo</label>
            <div className="grid grid-cols-2 gap-2">
               <button type="button" onClick={() => setType('FIXED')} className={`p-2 rounded-xl text-sm font-bold border ${type === 'FIXED' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>Renda Fixa</button>
               <button type="button" onClick={() => setType('STOCK')} className={`p-2 rounded-xl text-sm font-bold border ${type === 'STOCK' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>Ações</button>
               <button type="button" onClick={() => setType('FII')} className={`p-2 rounded-xl text-sm font-bold border ${type === 'FII' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>FIIs</button>
               <button type="button" onClick={() => setType('CRYPTO')} className={`p-2 rounded-xl text-sm font-bold border ${type === 'CRYPTO' ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>Cripto</button>
            </div>
          </div>

          {/* Nome e Ticker */}
          <div className="grid grid-cols-2 gap-4">
            <div>
               <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Ticker / Código</label>
               <div className="relative">
                 <Hash className="absolute left-3 top-3 text-slate-400" size={16} />
                 <input 
                   placeholder={type === 'CRYPTO' ? "BTC" : "PETR4"} 
                   value={ticker} 
                   onChange={e => setTicker(e.target.value.toUpperCase())} 
                   className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-brand-500 uppercase" 
                 />
               </div>
            </div>
            <div>
               <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Nome (Opcional)</label>
               <input 
                 placeholder="Ex: Petrobras" 
                 value={name} 
                 onChange={e => setName(e.target.value)} 
                 className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 outline-none focus:border-brand-500" 
               />
            </div>
          </div>

          {/* Quantidade e Valor Total */}
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Quantidade</label>
                <input 
                  type="number" 
                  step="0.0000001"
                  value={quantity} 
                  onChange={e => setQuantity(Number(e.target.value))} 
                  className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold outline-none focus:border-brand-500" 
                />
             </div>
             <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Valor Total Investido</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3.5 text-slate-400" size={16} />
                  <CurrencyInput
                    placeholder="0,00"
                    decimalsLimit={2}
                    intlConfig={{ locale: 'pt-BR', currency: 'BRL' }}
                    onValueChange={(value) => setAmount(value ? Number(value.replace(",", ".")) : undefined)}
                    className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 text-slate-900 font-bold"
                    value={amount}
                  />
                </div>
             </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3.5 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 py-3.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
              {loading ? <Loader2 className="animate-spin" /> : "Salvar"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}