"use client";

import { useState, useEffect } from "react";
import { X, Loader2, BarChart2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import CurrencyInput from 'react-currency-input-field';
import { toast } from "sonner";

interface AssetProps { isOpen: boolean; onClose: () => void; userId: string | null; assetToEdit?: any; }

export function NewAssetModal({ isOpen, onClose, userId, assetToEdit }: AssetProps) {
  const [ticker, setTicker] = useState("");
  const [quantity, setQuantity] = useState<number | undefined>(undefined);
  const [type, setType] = useState("STOCK");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && assetToEdit) {
      setTicker(assetToEdit.ticker || assetToEdit.name);
      setQuantity(assetToEdit.quantity);
      setType(assetToEdit.type);
    } else {
      setTicker(""); setQuantity(undefined); setType("STOCK");
    }
  }, [isOpen, assetToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !quantity) return;
    setIsLoading(true);

    const payload = { user_id: userId, ticker: ticker.toUpperCase(), name: ticker.toUpperCase(), quantity, type };
    
    let error;
    if (assetToEdit) {
       const { error: err } = await supabase.from("assets").update(payload).eq("id", assetToEdit.id);
       error = err;
    } else {
       const { error: err } = await supabase.from("assets").insert([payload]);
       error = err;
    }

    if (error) toast.error("Erro ao salvar ativo.");
    else {
      toast.success("Ativo salvo!");
      onClose();
    }
    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">{assetToEdit ? "Editar Ativo" : "Novo Investimento"}</h2>
          <button onClick={onClose}><X size={20} className="text-slate-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
             <label className="text-xs font-bold text-slate-500 uppercase ml-1">Código (Ticker)</label>
             <input type="text" required placeholder="Ex: PETR4, BTC, SELIC..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-500 outline-none font-bold uppercase" value={ticker} onChange={e => setTicker(e.target.value)} />
          </div>
          <div className="space-y-1">
             <label className="text-xs font-bold text-slate-500 uppercase ml-1">Quantidade</label>
             {/* Quantidade é número puro, não moeda */}
             <input type="number" step="0.000001" required placeholder="0.00" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-500 outline-none font-medium" value={quantity || ""} onChange={e => setQuantity(Number(e.target.value))} />
          </div>
          <div className="space-y-1">
             <label className="text-xs font-bold text-slate-500 uppercase ml-1">Tipo</label>
             <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-500 outline-none font-medium" value={type} onChange={e => setType(e.target.value)}>
               <option value="STOCK">Ação (B3/EUA)</option>
               <option value="FII">Fundo Imobiliário (FII)</option>
               <option value="FIXED">Renda Fixa</option>
               <option value="CRYPTO">Criptomoeda</option>
             </select>
          </div>
          <button type="submit" disabled={isLoading} className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 rounded-xl shadow-lg mt-2 flex justify-center items-center gap-2">
            {isLoading ? <Loader2 className="animate-spin" /> : "Salvar Ativo"}
          </button>
        </form>
      </div>
    </div>
  );
}