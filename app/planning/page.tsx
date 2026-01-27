"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { 
  ArrowLeft, Upload, Save, ChevronLeft, ChevronRight, 
  AlertCircle, CheckCircle2, FileSpreadsheet, FileText 
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function PlanningPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date());
  
  // Dados combinados (Categoria + Meta + Gasto Real)
  const [budgetItems, setBudgetItems] = useState<any[]>([]);
  
  // Estado para o Modal de Importação
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const formatMoney = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // 1. Carrega categorias, orçamentos e gastos reais
  const loadData = async () => {
    setLoading(true);
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    const currentMonth = date.getMonth() + 1; // 1-12
    const currentYear = date.getFullYear();

    // A. Busca todas as categorias de despesa
    const { data: categories } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'EXPENSE');

    if (!categories) return;

    // B. Busca o orçamento definido para este mês
    const { data: budgets } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', user.id)
      .eq('month', currentMonth)
      .eq('year', currentYear);

    // C. Busca os gastos REAIS deste mês (agrupados manualmente no frontend por simplicidade)
    const startOfMonth = new Date(currentYear, currentMonth - 1, 1).toISOString();
    const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59).toISOString();

    const { data: transactions } = await supabase
      .from('transactions')
      .select('amount, category_id')
      .eq('user_id', user.id)
      .eq('type', 'EXPENSE')
      .gte('date', startOfMonth)
      .lte('date', endOfMonth);

    // D. Combina tudo
    const combined = categories.map(cat => {
      const budget = budgets?.find(b => b.category_id === cat.id);
      const realized = transactions
        ?.filter(t => t.category_id === cat.id)
        .reduce((sum, t) => sum + t.amount, 0) || 0;

      return {
        category_id: cat.id,
        category_name: cat.name,
        category_color: cat.color || '#64748b',
        planned: budget?.amount || 0,
        realized: realized,
        budget_id: budget?.id // Se existir
      };
    });

    setBudgetItems(combined);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [date]);

  // 2. Salvar o Orçamento (Upsert: Cria ou Atualiza)
  const handleUpdateBudget = async (categoryId: string, newValue: string) => {
    const amount = parseFloat(newValue) || 0;
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    const { error } = await supabase.from('budgets').upsert({
      user_id: user.id,
      category_id: categoryId,
      month: date.getMonth() + 1,
      year: date.getFullYear(),
      amount: amount
    }, { onConflict: 'user_id, category_id, month, year' });

    if (error) {
      toast.error("Erro ao salvar meta");
    } else {
      // Atualiza estado local sem recarregar tudo
      setBudgetItems(prev => prev.map(item => 
        item.category_id === categoryId ? { ...item, planned: amount } : item
      ));
    }
  };

  // Navegação de Mês
  const changeMonth = (offset: number) => {
    const newDate = new Date(date);
    newDate.setMonth(date.getMonth() + offset);
    setDate(newDate);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <ArrowLeft className="text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800">Planejamento & Controle</h1>
            <p className="text-slate-500 text-sm">Defina metas e acompanhe seus gastos.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl shadow-sm border border-slate-200">
          <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 rounded-lg"><ChevronLeft size={20}/></button>
          <span className="font-bold text-slate-700 w-32 text-center capitalize">
            {date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 rounded-lg"><ChevronRight size={20}/></button>
        </div>

        <button 
          onClick={() => setIsImportModalOpen(true)}
          className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2.5 rounded-xl font-bold hover:bg-slate-50 hover:border-brand-500 hover:text-brand-600 transition-all shadow-sm"
        >
          <Upload size={18} />
          <span className="hidden md:inline">Importar Extrato</span>
        </button>
      </div>

      {/* Grid de Planejamento */}
      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-5 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <div className="col-span-4 md:col-span-3">Categoria</div>
          <div className="col-span-4 md:col-span-2 text-right">Meta (R$)</div>
          <div className="col-span-4 md:col-span-2 text-right">Gasto (R$)</div>
          <div className="hidden md:block md:col-span-5 pl-4">Progresso</div>
        </div>

        <div className="divide-y divide-slate-100">
          {budgetItems.map((item) => {
            const percentage = item.planned > 0 ? (item.realized / item.planned) * 100 : 0;
            const isOverBudget = percentage > 100;
            
            return (
              <div key={item.category_id} className="grid grid-cols-12 gap-4 p-5 items-center hover:bg-slate-50/50 transition-colors group">
                
                {/* 1. Nome da Categoria */}
                <div className="col-span-4 md:col-span-3 flex items-center gap-3">
                  <div className="w-3 h-10 rounded-full" style={{ backgroundColor: item.category_color }}></div>
                  <span className="font-bold text-slate-700 text-sm md:text-base">{item.category_name}</span>
                </div>

                {/* 2. Input da Meta (Editável) */}
                <div className="col-span-4 md:col-span-2">
                  <input 
                    type="number" 
                    defaultValue={item.planned}
                    onBlur={(e) => handleUpdateBudget(item.category_id, e.target.value)}
                    className="w-full text-right bg-slate-100 border-transparent focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 rounded-lg py-2 px-3 text-sm font-bold text-slate-700 transition-all"
                    placeholder="0,00"
                  />
                </div>

                {/* 3. Realizado (Apenas Leitura) */}
                <div className="col-span-4 md:col-span-2 text-right">
                  <span className={`font-bold text-sm ${isOverBudget ? 'text-red-600' : 'text-slate-600'}`}>
                    {formatMoney(item.realized)}
                  </span>
                </div>

                {/* 4. Barra de Progresso Visual */}
                <div className="col-span-12 md:col-span-5 pl-4 pt-2 md:pt-0">
                  <div className="flex justify-between text-xs font-bold text-slate-400 mb-1">
                    <span>{percentage.toFixed(0)}%</span>
                    {isOverBudget && <span className="text-red-500 flex items-center gap-1"><AlertCircle size={12}/> Estourou</span>}
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden relative">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ${
                        isOverBudget ? 'bg-red-500' : percentage > 80 ? 'bg-amber-400' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    ></div>
                    {/* Linha pontilhada no 100% se estourou */}
                    {isOverBudget && (
                       <div className="absolute top-0 bottom-0 right-0 w-0.5 bg-red-600 z-10"></div>
                    )}
                  </div>
                </div>

              </div>
            );
          })}

          {budgetItems.length === 0 && !loading && (
             <div className="p-10 text-center text-slate-400">
                Nenhuma categoria de despesa encontrada. Cadastre categorias primeiro.
             </div>
          )}
        </div>
      </div>

      {/* --- MODAL DE IMPORTAÇÃO (VISUAL) --- */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-6 animate-in zoom-in-95">
             <div className="flex justify-between items-center mb-6">
               <h2 className="text-xl font-bold text-slate-800">Importar Lançamentos</h2>
               <button onClick={() => setIsImportModalOpen(false)} className="p-1 hover:bg-slate-100 rounded-full"><AlertCircle className="rotate-45" /></button>
             </div>
             
             <div className="space-y-4">
               <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer group">
                  <div className="bg-brand-50 p-4 rounded-full mb-3 group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8 text-brand-600" />
                  </div>
                  <p className="font-bold text-slate-700">Clique para escolher o arquivo</p>
                  <p className="text-sm text-slate-400 mt-1">Suportamos OFX, PDF (Nubank/Inter) ou Excel</p>
               </div>

               <div className="grid grid-cols-3 gap-3">
                 <button className="flex flex-col items-center gap-2 p-3 border border-slate-200 rounded-xl hover:border-brand-500 hover:bg-brand-50 transition-all">
                    <FileText className="text-slate-500" /> <span className="text-xs font-bold text-slate-600">OFX Bancário</span>
                 </button>
                 <button className="flex flex-col items-center gap-2 p-3 border border-slate-200 rounded-xl hover:border-brand-500 hover:bg-brand-50 transition-all">
                    <FileSpreadsheet className="text-emerald-600" /> <span className="text-xs font-bold text-slate-600">Excel / CSV</span>
                 </button>
                 <button className="flex flex-col items-center gap-2 p-3 border border-slate-200 rounded-xl hover:border-brand-500 hover:bg-brand-50 transition-all">
                    <FileText className="text-red-500" /> <span className="text-xs font-bold text-slate-600">PDF Fatura</span>
                 </button>
               </div>
             </div>

             <div className="mt-6 flex justify-end">
               <button onClick={() => setIsImportModalOpen(false)} className="text-slate-500 font-bold px-4 py-2 hover:bg-slate-100 rounded-lg">Cancelar</button>
             </div>
          </div>
        </div>
      )}

    </div>
  );
}