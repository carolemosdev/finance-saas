"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Save } from "lucide-react";
import { supabase } from "../lib/supabase";

interface Category { id: number; name: string; }
interface CreditCard { id: number; name: string; }

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  transactionToEdit?: any; 
}

export function NewTransactionModal({ isOpen, onClose, userId, transactionToEdit }: NewTransactionModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState("");
  
  // Controle de Crédito
  const [paymentMethod, setPaymentMethod] = useState<"DEBIT" | "CREDIT">("DEBIT");
  const [selectedCardId, setSelectedCardId] = useState("");
  const [installments, setInstallments] = useState("1");

  // --- CARREGAMENTO DE DADOS (CORRIGIDO) ---
  useEffect(() => {
    if (isOpen && userId) {
      fetchCategories();
      fetchCreditCards();
      
      // Define data padrão hoje se não estiver editando
      if (!transactionToEdit) {
        setDate(new Date().toISOString().split('T')[0]);
      }
    }
  }, [isOpen, userId]); // <--- Agora recarrega se o userId mudar

  // Preenchimento para Edição
  useEffect(() => {
    if (isOpen && transactionToEdit) {
      setDescription(transactionToEdit.description);
      setAmount(String(transactionToEdit.amount));
      setType(transactionToEdit.type);
      setCategoryId(transactionToEdit.category_id || "");
      setDate(transactionToEdit.date ? transactionToEdit.date.split('T')[0] : new Date().toISOString().split('T')[0]);
      
      if (transactionToEdit.credit_card_id) {
        setPaymentMethod("CREDIT");
        setSelectedCardId(String(transactionToEdit.credit_card_id));
        setInstallments(String(transactionToEdit.installment_total || 1));
      } else {
        setPaymentMethod("DEBIT");
        setSelectedCardId("");
        setInstallments("1");
      }
    } else if (isOpen && !transactionToEdit) {
      // Limpa formulário
      setDescription(""); setAmount(""); setCategoryId(""); 
      setPaymentMethod("DEBIT"); setSelectedCardId(""); setInstallments("1");
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [isOpen, transactionToEdit]);

  async function fetchCategories() {
    const { data } = await supabase.from("categories").select("*").eq('user_id', userId || '');
    if (data) setCategories(data);
  }

  async function fetchCreditCards() {
    // Busca apenas cartões ATIVOS deste usuário
    const { data, error } = await supabase
      .from("credit_cards")
      .select("id, name")
      .eq('user_id', userId || '')
      .eq('is_active', true);

    if (error) {
      console.error("Erro ao buscar cartões:", error);
    }

    if (data) {
      setCreditCards(data);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setIsLoading(true);

    const totalValue = parseFloat(amount.replace(",", "."));
    const numInstallments = parseInt(installments);

    if (!description || !amount || !categoryId || !date) {
      alert("Preencha todos os campos obrigatórios!");
      setIsLoading(false);
      return;
    }

    if (type === 'EXPENSE' && paymentMethod === 'CREDIT' && !selectedCardId) {
      alert("Selecione qual cartão de crédito foi usado.");
      setIsLoading(false);
      return;
    }

    try {
      if (transactionToEdit) {
         // Lógica de Edição Simples (não reprocessa parcelas)
         const payload = {
            description,
            amount: totalValue,
            type,
            category_id: Number(categoryId),
            date: new Date(date).toISOString(),
            credit_card_id: (type === 'EXPENSE' && paymentMethod === 'CREDIT') ? Number(selectedCardId) : null,
         };
         await supabase.from("transactions").update(payload).eq('id', transactionToEdit.id);

      } else {
        // Lógica de Criação
        if (type === 'EXPENSE' && paymentMethod === 'CREDIT' && numInstallments > 1) {
           // PARCELAMENTO
           const installmentValue = totalValue / numInstallments;
           const transactionsToInsert = [];
           const baseDate = new Date(date);

           for (let i = 0; i < numInstallments; i++) {
              const installmentDate = new Date(baseDate);
              installmentDate.setMonth(baseDate.getMonth() + i);

              transactionsToInsert.push({
                 user_id: userId,
                 description: `${description} (${i + 1}/${numInstallments})`,
                 amount: installmentValue,
                 type: "EXPENSE",
                 category_id: Number(categoryId),
                 date: installmentDate.toISOString(),
                 credit_card_id: Number(selectedCardId),
                 installment_number: i + 1,
                 installment_total: numInstallments
              });
           }
           const { error } = await supabase.from("transactions").insert(transactionsToInsert);
           if (error) throw error;

        } else {
           // À VISTA (Débito ou Crédito 1x)
           const payload = {
             user_id: userId,
             description,
             amount: totalValue,
             type,
             category_id: Number(categoryId),
             date: new Date(date).toISOString(),
             credit_card_id: (type === 'EXPENSE' && paymentMethod === 'CREDIT') ? Number(selectedCardId) : null,
             installment_number: 1,
             installment_total: 1
           };
           const { error } = await supabase.from("transactions").insert(payload);
           if (error) throw error;
        }
      }
      onClose();
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar transação.");
    } finally {
      setIsLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-lg text-gray-800">{transactionToEdit ? "Editar Transação" : "Nova Transação"}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500"><X size={20} /></button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div className="flex gap-4 mb-4">
            <button type="button" onClick={() => { setType("INCOME"); setPaymentMethod("DEBIT"); }} className={`flex-1 py-2 rounded-lg font-medium border ${type === "INCOME" ? "bg-green-50 border-green-500 text-green-700" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}>Entrada</button>
            <button type="button" onClick={() => setType("EXPENSE")} className={`flex-1 py-2 rounded-lg font-medium border ${type === "EXPENSE" ? "bg-red-50 border-red-500 text-red-700" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}>Saída</button>
          </div>

          {/* Opções de Pagamento (Só para Despesa) */}
          {type === 'EXPENSE' && (
             <div className="flex gap-4 mb-2 p-3 bg-gray-50 rounded-lg">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="method" checked={paymentMethod === 'DEBIT'} onChange={() => setPaymentMethod('DEBIT')} />
                  <span className="text-sm font-medium">Débito / Pix</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="method" checked={paymentMethod === 'CREDIT'} onChange={() => setPaymentMethod('CREDIT')} />
                  <span className="text-sm font-medium">Cartão de Crédito</span>
                </label>
             </div>
          )}

          {/* Seletor de Cartão */}
          {type === 'EXPENSE' && paymentMethod === 'CREDIT' && (
             <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Qual Cartão?</label>
                   <select 
                      className="w-full border border-gray-300 rounded-lg p-2 bg-white" 
                      value={selectedCardId} 
                      onChange={(e) => setSelectedCardId(e.target.value)}
                   >
                     <option value="">Selecione...</option>
                     {creditCards.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                   </select>
                   {/* AVISO SE A LISTA ESTIVER VAZIA */}
                   {creditCards.length === 0 && (
                     <p className="text-xs text-red-500 mt-1 font-medium">
                       ⚠ Nenhum cartão ativo encontrado. Cadastre um na aba "Cartões".
                     </p>
                   )}
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Parcelas</label>
                   <select className="w-full border border-gray-300 rounded-lg p-2 bg-white" value={installments} onChange={(e) => setInstallments(e.target.value)} disabled={!!transactionToEdit}>
                     <option value="1">1x (À vista)</option>
                     {[...Array(11)].map((_, i) => (
                        <option key={i+2} value={i+2}>{i+2}x</option>
                     ))}
                   </select>
                </div>
             </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <input type="text" placeholder="Ex: Mercado, Uber..." className="w-full border border-gray-300 rounded-lg p-2" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor Total (R$)</label>
              <input type="number" step="0.01" className="w-full border border-gray-300 rounded-lg p-2" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <select className="w-full border border-gray-300 rounded-lg p-2 bg-white" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">Selecione...</option>
                {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
             <input type="date" className="w-full border border-gray-300 rounded-lg p-2 text-gray-600" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 mt-4">
            {isLoading ? <Loader2 className="animate-spin" /> : <><Save size={18}/> Salvar Transação</>}
          </button>
        </form>
      </div>
    </div>
  );
}