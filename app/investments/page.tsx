"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { getCurrentPrice } from "../../lib/priceService";
import { 
  Plus, Loader2, Calendar, ChevronDown, RefreshCw, Trash2, Pencil
} from "lucide-react";
import { NewAssetModal } from "../../components/NewAssetModal";
import { MobileNav } from "../../components/MobileNav";
import { Sidebar } from "../../components/Sidebar"; // <--- Sidebar Padrão
import { toast } from "sonner";

// --- TIPAGEM ---
interface Asset { 
  id: number; 
  name: string; 
  ticker: string; 
  type: 'FIXED' | 'FII' | 'STOCK' | 'CRYPTO'; 
  quantity: number; 
  current_amount: number; 
  price?: number; 
}

export default function InvestmentsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estados de Dados
  const [assets, setAssets] = useState<Asset[]>([]);
  const [plannedExpenses, setPlannedExpenses] = useState(0); 
  
  // Estados de Controle
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [assetToEdit, setAssetToEdit] = useState<Asset | undefined>(undefined);

  // --- 1. CARREGAMENTO DE DADOS ---
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }
      setUserId(user.id); 
      setUserEmail(user.email ?? null); 
      
      // Carrega tudo em paralelo
      await Promise.all([
        fetchAssets(user.id),
        fetchPlannedExpenses(user.id)
      ]);
    };
    checkUser();
  }, [router]);

  // Busca Ativos
  const fetchAssets = async (uid: string) => {
    setIsLoading(true);
    const { data: assetsData } = await supabase.from("assets").select("*").eq("user_id", uid);
    if (assetsData) {
      const updatedAssets = await Promise.all(assetsData.map(async (asset) => {
        let livePrice = asset.current_amount / (asset.quantity || 1); 
        try {
            const price = await getCurrentPrice(asset.ticker || asset.name, asset.type);
            if (price) livePrice = price;
        } catch (e) {
            console.error("Erro ao buscar preço", e);
        }
        return { ...asset, price: livePrice, current_amount: livePrice * asset.quantity };
      }));
      setAssets(updatedAssets as any);
    }
    setIsLoading(false);
  };

  // Busca Gastos Planejados
  const fetchPlannedExpenses = async (uid: string) => {
    const { data } = await supabase
      .from('categories')
      .select('budget')
      .eq('user_id', uid)
      .eq('type', 'EXPENSE');
    
    if (data) {
      const total = data.reduce((acc, cat) => acc + (Number(cat.budget) || 0), 0);
      setPlannedExpenses(total);
    }
  };

  const handleDeleteAsset = async (id: number) => { 
      if (!confirm("Tem certeza que deseja excluir este ativo?")) return; 
      await supabase.from("assets").delete().eq("id", id); 
      if(userId) fetchAssets(userId); 
      toast.success("Ativo removido.");
  };

  const handleEditAsset = (asset: Asset) => { setAssetToEdit(asset); setIsAssetModalOpen(true); };
  const closeModals = () => { setIsAssetModalOpen(false); setAssetToEdit(undefined); if (userId) fetchAssets(userId); };
  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/auth"); };
  
  // Formatadores
  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // --- CÁLCULOS DINÂMICOS ---
  const monthColumns = useMemo(() => {
    const cols = [];
    for (let i = 0; i < 3; i++) {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      const label = d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      cols.push(label.charAt(0).toUpperCase() + label.slice(1));
    }
    return cols;
  }, [currentDate]);

  const totalInvested = assets.reduce((acc, c) => acc + c.current_amount, 0);
  const financialIndependenceGoal = 1000000; 
  const independenceRatio = (totalInvested / financialIndependenceGoal) * 100;

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans flex-col md:flex-row">
      <MobileNav userEmail={userEmail} onLogout={handleLogout} />
      
      {/* SIDEBAR PADRÃO */}
      <Sidebar userEmail={userEmail} onLogout={handleLogout} />

      <main className="flex-1 overflow-y-auto relative z-0 p-4 md:p-6 bg-slate-100/50">
        
        {/* === HEADER & CONTROLES === */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-6">
            <div className="flex flex-col xl:flex-row gap-6 justify-between items-start xl:items-end">
                
                {/* Lado Esquerdo: Filtros e Título */}
                <div className="space-y-4 w-full xl:w-auto flex-1">
                    <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                        Meus Investimentos
                        {userId && <button onClick={() => fetchAssets(userId)} className="p-1.5 bg-slate-100 hover:bg-teal-100 text-slate-500 hover:text-teal-700 rounded-full transition-colors" title="Atualizar Preços"><RefreshCw size={14} className={isLoading ? "animate-spin" : ""}/></button>}
                    </h2>
                    
                    {/* DADO CONCRETO DO PLANEJAMENTO */}
                    <p className="text-xs font-bold text-slate-500 uppercase bg-rose-50 border border-rose-100 text-rose-600 px-3 py-1.5 rounded w-fit">
                        Gastos planejados do mês atual: {formatMoney(plannedExpenses)}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-2">
                        {/* SELETOR DE DATA FUNCIONAL */}
                        <div className="relative group">
                            <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-md px-3 py-1.5 text-sm font-bold text-slate-700 shadow-sm hover:border-teal-500 transition-colors cursor-pointer">
                                <Calendar size={14} className="text-slate-400 group-hover:text-teal-500" /> 
                                <input 
                                  type="month" 
                                  className="absolute inset-0 opacity-0 cursor-pointer"
                                  onChange={(e) => {
                                    if(e.target.value) {
                                        const [y, m] = e.target.value.split('-');
                                        setCurrentDate(new Date(parseInt(y), parseInt(m)-1, 1));
                                    }
                                  }}
                                />
                                <span>{monthColumns[0]}</span>
                                <ChevronDown size={14} className="opacity-50 ml-2"/>
                            </div>
                        </div>
                        
                        <span className="text-slate-300 mx-1">—</span>
                        
                        {/* Data Final (Apenas Visual) */}
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-sm font-medium text-slate-500 cursor-not-allowed">
                             <Calendar size={14} className="text-slate-400" /> 
                             <span>{monthColumns[2]}</span>
                        </div>
                        
                        <div className="w-px h-6 bg-slate-300 mx-3 hidden sm:block"></div>

                        {/* Botão Novo */}
                        <button onClick={() => setIsAssetModalOpen(true)} className="flex items-center gap-1 bg-slate-800 text-white px-3 py-1.5 rounded-md text-sm font-bold shadow hover:bg-slate-900 transition-all">
                            <Plus size={16}/> <span className="hidden sm:inline">Novo Ativo</span>
                        </button>
                    </div>
                </div>

                {/* Lado Direito: Resumo */}
                <div className="w-full xl:w-auto overflow-x-auto pb-1">
                    <div className="grid grid-rows-4 gap-y-px bg-slate-200 border border-slate-200 rounded-lg overflow-hidden text-sm min-w-[600px] shadow-sm">
                        
                        {/* Linha 1: Rendimento */}
                        <div className="grid grid-cols-5 items-stretch bg-white">
                            <div className="bg-teal-600 text-white font-bold px-3 py-1.5 col-span-2 text-right text-[10px] uppercase tracking-wide flex items-center justify-end">Rendimento Mensal</div>
                            {monthColumns.map((m, i) => (
                                <div key={i} className={`px-3 py-1.5 font-bold text-center flex items-center justify-center ${i === 0 ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400'}`}>
                                    {i === 0 ? '+ 1.2%' : '---'}
                                </div>
                            ))}
                        </div>
                        
                        {/* Linha 2: Grau Indep */}
                        <div className="grid grid-cols-5 items-stretch bg-white">
                            <div className="bg-teal-600/90 text-white font-bold px-3 py-1.5 col-span-2 text-right text-[10px] uppercase tracking-wide flex items-center justify-end">Grau de Indep. Financeira</div>
                            {monthColumns.map((m, i) => (
                                <div key={i} className={`px-3 py-1.5 font-bold text-center flex items-center justify-center ${i === 0 ? 'text-teal-700' : 'text-slate-400'}`}>
                                    {i === 0 ? `${independenceRatio.toFixed(2)}%` : '---'}
                                </div>
                            ))}
                        </div>

                        {/* Linha 3: Saldo */}
                        <div className="grid grid-cols-5 items-stretch bg-white">
                            <div className="bg-teal-600/80 text-white font-bold px-3 py-1.5 col-span-2 text-right text-[10px] uppercase tracking-wide flex items-center justify-end">Saldo Dos Investimentos</div>
                            {monthColumns.map((m, i) => (
                                <div key={i} className={`px-3 py-1.5 font-bold text-center flex items-center justify-center bg-slate-50 ${i === 0 ? 'text-slate-900' : 'text-slate-400'}`}>
                                    {i === 0 ? formatMoney(totalInvested) : '---'}
                                </div>
                            ))}
                        </div>

                        {/* Linha 4: Valor Aplicado */}
                        <div className="grid grid-cols-5 items-stretch bg-white">
                             <div className="bg-teal-600/70 text-white font-bold px-3 py-1.5 col-span-2 text-right text-[10px] uppercase tracking-wide flex items-center justify-end">Valor Total Aplicado</div>
                             {monthColumns.map((m, i) => (
                                <div key={i} className={`px-3 py-1.5 font-bold text-center flex items-center justify-center ${i === 0 ? 'text-slate-900' : 'text-slate-400'}`}>
                                    {i === 0 ? formatMoney(totalInvested * 0.9) : '---'}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* === TABELA DE ATIVOS === */}
        <div className="bg-white rounded-t-xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead>
                        <tr className="bg-teal-700 text-white text-[10px] font-extrabold uppercase tracking-wider">
                            <th className="p-3 w-10 text-center">#</th>
                            <th className="p-3">Inst. Fin. - Partição</th>
                            <th className="p-3">Emissor</th>
                            <th className="p-3">Produto</th>
                            <th className="p-3">Vencimento</th>
                            {/* COLUNAS DINÂMICAS */}
                            {monthColumns.map((month, i) => (
                                <th key={i} className={`p-3 text-center min-w-[120px] border-l border-teal-600 ${i === 0 ? 'bg-teal-800/60' : ''}`}>{month}</th>
                            ))}
                            <th className="p-3 text-center w-20">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="text-xs">
                        {isLoading ? (
                             <tr><td colSpan={6 + monthColumns.length} className="p-12 text-center"><Loader2 className="animate-spin inline text-teal-600 w-8 h-8"/></td></tr>
                        ) : assets.length === 0 ? (
                             <tr><td colSpan={6 + monthColumns.length} className="p-12 text-center text-slate-400 font-medium">Nenhum ativo encontrado. Adicione um novo!</td></tr>
                        ) : assets.map((asset, index) => {
                            const isEven = index % 2 === 0;
                            const rowBg = isEven ? 'bg-white' : 'bg-slate-50/50';
                            const emissor = asset.type === 'FIXED' ? 'Tesouro/Banco' : asset.type === 'CRYPTO' ? 'Blockchain' : 'B3';
                            const produto = asset.ticker || asset.name;
                            
                            return (
                                <tr key={asset.id} className={`${rowBg} hover:bg-teal-50 transition-colors border-b border-slate-100 group`}>
                                    <td className="p-3 text-center">
                                        <div className={`w-2 h-2 rounded-full mx-auto ${asset.type === 'FIXED' ? 'bg-teal-500' : asset.type === 'STOCK' ? 'bg-amber-500' : 'bg-rose-500'}`}></div>
                                    </td>
                                    <td className="p-3 text-slate-600 font-semibold">Corretora Principal</td>
                                    <td className="p-3 text-slate-500 font-medium">{emissor}</td>
                                    <td className="p-3 font-bold text-slate-700">{produto}</td>
                                    <td className="p-3 text-slate-400 font-mono">{asset.type === 'FIXED' ? '15/08/2030' : '-'}</td>

                                    {/* COLUNAS DE VALORES DINÂMICAS */}
                                    {monthColumns.map((m, i) => (
                                        <td key={i} className={`p-1.5 border-l border-slate-100 ${i === 0 ? 'bg-teal-50/20' : ''}`}>
                                            <div className="flex flex-col">
                                                <div className="flex justify-between text-[9px] text-slate-400 mb-0.5">
                                                    <span>Aplicado</span>
                                                    <span>-</span>
                                                </div>
                                                <div className="flex justify-between text-[11px] font-bold text-slate-700">
                                                    <span>Saldo</span>
                                                    {/* Mostra valor real apenas no mês atual da seleção (coluna 0) */}
                                                    <span>{i === 0 ? formatMoney(asset.current_amount) : '---'}</span>
                                                </div>
                                            </div>
                                        </td>
                                    ))}

                                    <td className="p-3 text-center">
                                        <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEditAsset(asset)} className="p-1.5 hover:bg-slate-200 rounded text-slate-500"><Pencil size={14}/></button>
                                            <button onClick={() => handleDeleteAsset(asset.id)} className="p-1.5 hover:bg-red-100 rounded text-red-500"><Trash2 size={14}/></button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
             </div>
        </div>

      </main>
      
      {/* MODAL */}
      <NewAssetModal 
        isOpen={isAssetModalOpen} 
        onClose={closeModals} 
        userId={userId} 
        assetToEdit={assetToEdit} 
        onSuccess={() => userId && fetchAssets(userId)}
      />
    </div>
  );
}