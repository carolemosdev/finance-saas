"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Calendar, FileText, Tag, CreditCard } from "lucide-react";
import { supabase } from "../lib/supabase";
import CurrencyInput from 'react-currency-input-field';
import { toast } from "sonner";

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  transactionToEdit?: any;
  onSuccess: () => void;
}

// O ERRO ESTAVA AQUI: O nome da função exportada deve ser NewTransactionModal
export function NewTransactionModal({ isOpen, onClose, userId, transactionToEdit, onSuccess }: NewTransactionModalProps) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<string | undefined>(""); // String para permitir edição
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [categoryId, setCategoryId] = useState("");
  const [newCategoryName, setNewCategoryName] = useState(""); 
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [creditCardId, setCreditCardId] = useState<string | "">(""); 
  
  const [categories, setCategories] = useState<any[]>([]);
  const [creditCards, setCreditCards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  // Carrega dados ao abrir ou mudar usuário
  useEffect(() => {
    if (isOpen && userId) {
      loadCategories();
      loadCreditCards();
      
      if (transactionToEdit) {
        setDescription(transactionToEdit.description);
        // Converte number -> string para o input
        setAmount(String(transactionToEdit.amount));
        setType(transactionToEdit.type);
        setCategoryId(transactionToEdit.category_id || "");
        setDate(transactionToEdit.date.split("T")[0]);
        setCreditCardId(transactionToEdit.credit_card_id || "");
      } else {
        resetForm();
      }
    }
  }, [isOpen, userId, transactionToEdit]);

  const resetForm = () => {
    setDescription("");
    setAmount("");
    setType("EXPENSE");
    setCategoryId("");
    setNewCategoryName("");
    setDate(new Date().toISOString().split("T")[0]);
    setCreditCardId("");
    setIsCreatingCategory(false);
  };

  const loadCategories = async () => {
    const { data } = await supabase.from("categories").select("*").eq("user_id", userId!);
    if (data) setCategories(data);
  };

  const loadCreditCards = async () => {
    const { data } = await supabase.from("credit_cards").select("*").eq("user_id", userId!);
    if (data) setCreditCards(data);
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    setIsLoading(true);
    const { data } = await supabase.from("categories").insert([{ 
        name: newCategoryName, 
        user_id: userId,
        type: type 
    }]).select();

    if (data) {
      setCategories([...categories, data[0]]);
      setCategoryId(data[0].id);
      setIsCreatingCategory(false);
      setNewCategoryName("");
      toast.success("Categoria criada!");
    } else {
      toast.error("Erro ao criar categoria.");
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description || !userId) {
      toast.warning("Preencha valor e descrição.");
      return;
    }
    
    setIsLoading(true);

    // Converte string -> number (float) ao salvar
    const finalAmount = parseFloat(amount.replace(',', '.'));

    const payload = {
      user_id: userId,
      description,
      amount: finalAmount,
      type,
      category_id: categoryId || null,
      date,
      credit_card_id: creditCardId || null,
    };

    let error;

    if (transactionToEdit) {
       const { error: err } = await supabase.from("transactions").update(payload).eq("id", transactionToEdit.id);
       error = err;
    } else {
       const { error: err } = await supabase.from("transactions").insert([payload]);
       error = err;
    }

    if (error) {
      console.error(error);
      toast.error("Erro ao salvar transação.");
    } else {
      toast.success(transactionToEdit ? "Transação atualizada!" : "Transação salva!");
      onSuccess(); 
      onClose();
    }
    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800">
            {transactionToEdit ? "Editar Transação" : "Nova Transação"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setType("INCOME")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                type === "INCOME" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Entrada
            </button>
            <button
              type="button"
              onClick={() => setType("EXPENSE")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                type === "EXPENSE" ? "bg-white text-rose-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Saída
            </button>
          </div>

          <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Valor</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className={`font-bold ${type === 'INCOME' ? 'text-emerald-500' : 'text-rose-500'}`}>R$</span>
                </div>
                <CurrencyInput
                  id="amount"
                  name="amount"
                  placeholder="0,00"
                  decimalsLimit={2}
                  decimalScale={2}
                  intlConfig={{ locale: 'pt-BR', currency: 'BRL' }}
                  value={amount}
                  onValueChange={(value) => setAmount(value)}
                  className={`w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all font-bold text-lg ${type === 'INCOME' ? 'focus:ring-emerald-500/20 text-emerald-700' : 'focus:ring-rose-500/20 text-rose-700'}`}
                />
              </div>
          </div>

          <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Descrição</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FileText size={18} className="text-slate-400"/></div>
                <input 
                  type="text" 
                  required 
                  placeholder="Ex: Salário, Aluguel..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-900 font-medium placeholder:text-slate-400"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>
          </div>

          <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Categoria</label>
                 <button type="button" onClick={() => setIsCreatingCategory(!isCreatingCategory)} className="text-[10px] text-brand-600 font-bold hover:underline">
                    {isCreatingCategory ? "Cancelar" : "+ Nova Categoria"}
                 </button>
              </div>
              
              {isCreatingCategory ? (
                 <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Nome da categoria..." 
                      className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-500 outline-none text-sm"
                      value={newCategoryName}
                      onChange={e => setNewCategoryName(e.target.value)}
                    />
                    <button type="button" onClick={handleCreateCategory} disabled={isLoading} className="bg-brand-600 text-white px-4 rounded-xl font-bold text-sm hover:bg-brand-700">OK</button>
                 </div>
              ) : (
                <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Tag size={18} className="text-slate-400"/></div>
                   <select 
                     className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-900 font-medium appearance-none"
                     value={categoryId}
                     onChange={e => setCategoryId(e.target.value)}
                   >
                     <option value="">Sem Categoria</option>
                     {categories
                        .filter(c => !c.type || c.type === type) 
                        .map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                     }
                   </select>
                </div>
              )}
          </div>

          <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Data</label>
                 <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Calendar size={18} className="text-slate-400"/></div>
                    <input type="date" required className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-500 outline-none font-medium text-slate-700" value={date} onChange={e => setDate(e.target.value)} />
                 </div>
              </div>
              
              <div className="space-y-1.5">
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Cartão (Opcional)</label>
                 <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><CreditCard size={18} className="text-slate-400"/></div>
                    <select 
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-500 outline-none font-medium text-slate-700 appearance-none disabled:opacity-50"
                      value={creditCardId}
                      onChange={e => setCreditCardId(e.target.value)}
                      disabled={type === 'INCOME'}
                    >
                      <option value="">Nenhum</option>
                      {creditCards.map(cc => <option key={cc.id} value={cc.id}>{cc.name}</option>)}
                    </select>
                 </div>
              </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 mt-4 ${type === 'INCOME' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'}`}
          >
            {isLoading ? <Loader2 className="animate-spin" /> : (transactionToEdit ? "Salvar Alterações" : "Adicionar Transação")}
          </button>
        </form>
      </div>
    </div>
  );
}