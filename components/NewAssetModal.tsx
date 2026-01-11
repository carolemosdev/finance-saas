"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Save } from "lucide-react";
import { supabase } from "../lib/supabase";

interface NewAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  assetToEdit?: any; // <--- Prop nova para edição
}

export function NewAssetModal({ isOpen, onClose, userId, assetToEdit }: NewAssetModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const [ticker, setTicker] = useState("");
  const [quantity, setQuantity] = useState("");
  const [type, setType] = useState("STOCK");

  // EFEITO: Preencher campos se for edição
  useEffect(() => {
    if (isOpen && assetToEdit) {
      setTicker(assetToEdit.ticker || assetToEdit.name); // Ticker ou Nome
      setQuantity(String(assetToEdit.quantity));
      setType(assetToEdit.type);
    } else if (isOpen && !assetToEdit) {
      // Limpar se for criação
      setTicker("");
      setQuantity("");
      setType("STOCK");
    }
  }, [isOpen, assetToEdit]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setIsLoading(true);

    const qtd = parseFloat(quantity.replace(",", "."));

    if (!ticker || !qtd) {
      alert("Preencha o código e a quantidade.");
      setIsLoading(false);
      return;
    }

    const payload = {
      name: ticker.toUpperCase(),
      ticker: ticker.toUpperCase(),
      type,
      quantity: qtd,
      // current_amount: 0 -> Não precisamos atualizar isso, é calculado na tela
      user_id: userId
    };

    let error;

    if (assetToEdit) {
      // --- UPDATE ---
      const { error: updateError } = await supabase
        .from("assets")
        .update(payload)
        .eq("id", assetToEdit.id);
      error = updateError;
    } else {
      // --- INSERT ---
      const { error: insertError } = await supabase
        .from("assets")
        .insert({ ...payload, current_amount: 0 });
      error = insertError;
    }

    if (error) {
      console.error(error);
      alert("Erro ao salvar ativo!");
    } else {
      onClose();
    }
    setIsLoading(false);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-lg text-gray-800">
            {assetToEdit ? "Editar Ativo" : "Novo Ativo"}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500"><X size={20} /></button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select className="w-full border p-2 rounded-lg bg-white" value={type} onChange={e => setType(e.target.value)}>
                <option value="STOCK">Ação (B3)</option>
                <option value="FII">Fundo Imobiliário</option>
                <option value="CRYPTO">Criptomoeda</option>
                <option value="FIXED">Renda Fixa</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código (Ticker)</label>
              <input 
                type="text" 
                placeholder={type === 'CRYPTO' ? 'Ex: BTC' : 'Ex: PETR4'} 
                className="w-full border p-2 rounded-lg uppercase" 
                value={ticker} 
                onChange={e => setTicker(e.target.value)} 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
            <input 
              type="number" 
              step="0.00000001" 
              className="w-full border p-2 rounded-lg" 
              value={quantity} 
              onChange={e => setQuantity(e.target.value)} 
            />
            <p className="text-xs text-gray-500 mt-1">Ex: 100 ações ou 0.005 Bitcoin</p>
          </div>

          <button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex justify-center gap-2">
            {isLoading ? <Loader2 className="animate-spin" /> : <><Save size={18}/> Salvar</>}
          </button>
        </form>
      </div>
    </div>
  );
}