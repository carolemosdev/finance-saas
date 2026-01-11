"use client";

import { useState, useEffect } from "react";
import { X, Loader2, CreditCard, Save, Palette } from "lucide-react";
import { supabase } from "../lib/supabase";

interface NewCreditCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  onSuccess?: () => void;
  cardToEdit?: any; // Prop para edição
}

export function NewCreditCardModal({ isOpen, onClose, userId, onSuccess, cardToEdit }: NewCreditCardModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  // Dados do Cartão
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("Mastercard");
  const [limit, setLimit] = useState("");
  const [closingDay, setClosingDay] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [color, setColor] = useState("#2563EB"); 

  const colors = [
    { bg: "#000000", name: "Preto (Black)" },
    { bg: "#820AD1", name: "Roxo (Nubank)" },
    { bg: "#EF4444", name: "Vermelho (Santander)" },
    { bg: "#F59E0B", name: "Laranja (Inter)" },
    { bg: "#2563EB", name: "Azul (Itaú/Caixa)" },
    { bg: "#10B981", name: "Verde (C6/Stone)" },
  ];

  // EFEITO: Preencher campos se for edição
  useEffect(() => {
    if (isOpen && cardToEdit) {
      setName(cardToEdit.name);
      setBrand(cardToEdit.brand);
      setLimit(String(cardToEdit.limit_amount));
      setClosingDay(String(cardToEdit.closing_day));
      setDueDay(String(cardToEdit.due_day));
      setColor(cardToEdit.color || "#2563EB");
    } else if (isOpen && !cardToEdit) {
      // Limpar formulário se for novo
      setName(""); setLimit(""); setClosingDay(""); setDueDay(""); setColor("#2563EB"); setBrand("Mastercard");
    }
  }, [isOpen, cardToEdit]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setIsLoading(true);

    const limitValue = parseFloat(limit.replace(",", "."));

    if (!name || !limitValue || !closingDay || !dueDay) {
      alert("Preencha todos os campos obrigatórios.");
      setIsLoading(false);
      return;
    }

    const payload = {
      name,
      brand,
      limit_amount: limitValue,
      closing_day: parseInt(closingDay),
      due_day: parseInt(dueDay),
      color,
      user_id: userId
    };

    let error;

    if (cardToEdit) {
      // --- UPDATE (EDITAR) ---
      const { error: updateError } = await supabase
        .from("credit_cards")
        .update(payload)
        .eq("id", cardToEdit.id);
      error = updateError;
    } else {
      // --- INSERT (CRIAR) ---
      const { error: insertError } = await supabase
        .from("credit_cards")
        .insert(payload);
      error = insertError;
    }

    if (error) {
      console.error(error);
      alert("Erro ao salvar cartão.");
    } else {
      if (onSuccess) onSuccess(); // Atualiza a lista na página de fundo
      onClose();
    }
    setIsLoading(false);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
            <CreditCard className="text-blue-600" size={20} /> 
            {cardToEdit ? "Editar Cartão" : "Novo Cartão"}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500"><X size={20} /></button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Apelido do Cartão</label>
            <input 
              type="text" 
              placeholder="Ex: Nubank, XP Visa..." 
              className="w-full border p-2 rounded-lg"
              value={name} 
              onChange={e => setName(e.target.value)} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bandeira</label>
              <select className="w-full border p-2 rounded-lg bg-white" value={brand} onChange={e => setBrand(e.target.value)}>
                <option value="Mastercard">Mastercard</option>
                <option value="Visa">Visa</option>
                <option value="Elo">Elo</option>
                <option value="Amex">Amex</option>
                <option value="Hipercard">Hipercard</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Limite (R$)</label>
              <input type="number" step="0.01" className="w-full border p-2 rounded-lg" value={limit} onChange={e => setLimit(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dia Fechamento</label>
              <input type="number" placeholder="Ex: 05" className="w-full border p-2 rounded-lg" value={closingDay} onChange={e => setClosingDay(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dia Vencimento</label>
              <input type="number" placeholder="Ex: 12" className="w-full border p-2 rounded-lg" value={dueDay} onChange={e => setDueDay(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Palette size={16}/> Escolha a Cor
            </label>
            <div className="flex gap-3 flex-wrap">
              {colors.map((c) => (
                <button
                  key={c.bg}
                  type="button"
                  onClick={() => setColor(c.bg)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${color === c.bg ? 'border-gray-800 ring-2 ring-gray-200' : 'border-transparent'}`}
                  style={{ backgroundColor: c.bg }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex justify-center gap-2 mt-4">
            {isLoading ? <Loader2 className="animate-spin" /> : <><Save size={18}/> Salvar Cartão</>}
          </button>
        </form>
      </div>
    </div>
  );
}