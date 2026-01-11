"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Target, Save } from "lucide-react";
import { supabase } from "../lib/supabase";

interface NewGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  goalToEdit?: any; // <--- Prop nova
}

export function NewGoalModal({ isOpen, onClose, userId, goalToEdit }: NewGoalModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [deadline, setDeadline] = useState("");

  // EFEITO: Preencher campos se for edição
  useEffect(() => {
    if (isOpen && goalToEdit) {
      setName(goalToEdit.name);
      setTargetAmount(String(goalToEdit.target_amount));
      setCurrentAmount(String(goalToEdit.current_amount));
      setDeadline(goalToEdit.deadline || "");
    } else if (isOpen && !goalToEdit) {
      setName("");
      setTargetAmount("");
      setCurrentAmount("");
      setDeadline("");
    }
  }, [isOpen, goalToEdit]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setIsLoading(true);

    const target = parseFloat(targetAmount.replace(",", "."));
    const current = currentAmount ? parseFloat(currentAmount.replace(",", ".")) : 0;

    if (!name || !targetAmount) {
      alert("Preencha o nome e o valor da meta.");
      setIsLoading(false);
      return;
    }

    const payload = {
      name,
      target_amount: target,
      current_amount: current,
      deadline: deadline || null,
      user_id: userId
    };

    let error;

    if (goalToEdit) {
      // UPDATE
      const { error: updateError } = await supabase
        .from("goals")
        .update(payload)
        .eq("id", goalToEdit.id);
      error = updateError;
    } else {
      // INSERT
      const { error: insertError } = await supabase
        .from("goals")
        .insert(payload);
      error = insertError;
    }

    if (error) {
      console.error(error);
      alert("Erro ao salvar meta!");
    } else {
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
            <Target className="text-purple-600" size={20} />
            {goalToEdit ? "Editar Meta" : "Nova Meta"}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Meta</label>
            <input type="text" className="w-full border border-gray-300 rounded-lg p-2" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alvo (R$)</label>
              <input type="number" step="0.01" className="w-full border border-gray-300 rounded-lg p-2" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Já tenho</label>
              <input type="number" step="0.01" className="w-full border border-gray-300 rounded-lg p-2" value={currentAmount} onChange={(e) => setCurrentAmount(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Limite</label>
            <input type="date" className="w-full border border-gray-300 rounded-lg p-2 text-gray-600" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>

          <button type="submit" disabled={isLoading} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg flex justify-center gap-2 mt-4">
            {isLoading ? <Loader2 className="animate-spin" /> : <><Save size={18}/> Salvar</>}
          </button>
        </form>
      </div>
    </div>
  );
}