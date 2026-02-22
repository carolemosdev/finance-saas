"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { getCurrentPrice } from "../../lib/priceService"; 
import { useTheme } from "next-themes"; // <-- IMPORT TEMA
import { 
  Plus, Loader2, Calendar, ChevronDown, RefreshCw, Trash2, Pencil,
  TrendingUp, TrendingDown, Eye, EyeOff, Sun, Moon // <-- IMPORT ÍCONES
} from "lucide-react";
import { NewAssetModal } from "../../components/NewAssetModal";
import { MobileNav } from "../../components/MobileNav";
import { Sidebar } from "../../components/Sidebar"; 
import { toast } from "sonner";

// --- TIPAGEM ATUALIZADA ---
interface Asset { 
  id: number; 
  name: string; 
  ticker: string; 
  type: 'FIXED' | 'FII' | 'STOCK' | 'CRYPTO'; 
  quantity: number; 
  invested_amount: number; 
  current_total: number;   
  price?: number;          
}

export default function InvestmentsPage() {
  const router = useRouter();

  // --- ESTADOS DE PRIVACIDADE E TEMA ---
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);

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
    setMounted(true);
    // Recupera a preferência do usuário
    const savedPrivacy = localStorage.getItem("flui_privacy_mode");
    if (savedPrivacy === "true") setIsPrivacyMode(true);

    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }
      setUserId(user.id); 
      setUserEmail(user.email ?? null); 
      
      await Promise.all([
        fetchAssets(user.id),
        fetchPlannedExpenses(user.id)
      ]);
    };
    checkUser();
  }, [router]);

  const togglePrivacy = () => {
    const newValue = !isPrivacyMode;
    setIsPrivacyMode(newValue);
    localStorage.setItem("flui_privacy_mode", String(newValue));
  };

  // --- LÓGICA DE ATUALIZAÇÃO (BRAPI) ---
  const fetchAssets = async (uid: string) => {
    setIsLoading(true);
    const { data: assetsData } = await supabase.from("assets").select("*").eq("user_id", uid);
    
    if (assetsData) {
      const updatedAssets = await Promise.all(assetsData.map(async (asset) => {
        const costBasis = Number(asset.current_amount); 
        let currentUnitPrice = costBasis / (asset.quantity || 1); 
        
        try {
            if (asset.type !== 'FIXED') {
                const livePrice = await getCurrentPrice(asset.ticker || asset.name, asset.type);
                if (livePrice) currentUnitPrice = livePrice;
            }
        } catch (e) {
            console.error(`Erro Brapi para ${asset.ticker}:`, e);
        }

        const marketValue = currentUnitPrice * asset.quantity;

        return { 
            ...asset, 
            price: currentUnitPrice, 
            invested_amount: costBasis, 
            current_total: marketValue 
        };
      }));
      
      setAssets(updatedAssets as any);
    }
    setIsLoading(false);
  };

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

  const handleEditAsset = (asset: Asset) => { 
      const assetForModal = { ...asset, current_amount: asset.invested_amount };
      setAssetToEdit(assetForModal as any); 
      setIsAssetModalOpen(true); 
  };
  
  const closeModals = () => { setIsAssetModalOpen(false); setAssetToEdit(undefined); if (userId) fetchAssets(userId); };
  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/auth"); };
  
  // --- FORMATADOR ATUALIZADO (Respeita Privacidade) ---
  const formatMoney = (val: number) => {
    if (isPrivacyMode) return "R$ •••••";
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // --- CÁLCULOS TOTAIS REAIS ---
  const monthColumns = useMemo(() => {
    const cols = [];
    for (let i = 0; i < 3; i++) {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      const label = d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      cols.push(label.charAt(0).toUpperCase() + label.slice(1));
    }
    return cols;
  }, [currentDate]);

  const totalApplied = assets.reduce((acc, c) => acc + c.invested_amount, 0); 
  const totalBalance = assets.reduce((acc, c) => acc + c.current_total, 0);   
  
  const totalProfitValue = totalBalance - totalApplied;
  const totalYieldPercent = totalApplied > 0 ? (totalProfitValue / totalApplied) * 100 : 0;

  const financialIndependenceGoal = 1000000; 
  const independenceRatio = (totalBalance / financialIndependenceGoal) * 100;

  if (!mounted) return null; // Evita flicker de tema

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans flex-col md:flex-row dark:bg-slate-950 dark:text-slate-100">
      <MobileNav userEmail={userEmail} onLogout={handleLogout} />
      <Sidebar userEmail={userEmail} onLogout={handleLogout} />

      <main className="flex-1 overflow-y-auto relative z-0 p-4 md:p-6 bg-slate-100/50 dark:bg-slate-950">
        
        {/* === HEADER & CONTROLES === */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-6 dark:bg-slate-900 dark:border-slate-800">
            <div className="flex flex-col xl:flex-row gap-6 justify-between items-start xl:items-end">
                
                <div className="space-y-4 w-full xl:w-auto flex-1">
                    <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2 dark:text-slate-100">
                        Meus Investimentos
                        {userId && <button onClick={() => fetchAssets(userId)} className="p-1.5 bg-slate-100 hover:bg-teal-100 text-slate-500 hover:text-teal-700 rounded-full transition-colors dark:bg-slate-800 dark:text-slate-400 dark:hover:text-teal-400" title="Atualizar Preços Brapi"><RefreshCw size={14} className={isLoading ? "animate-spin" : ""}/></button>}
                    </h2>
                    
                    <p className="text-xs font-bold text-slate-500 uppercase bg-rose-50 border border-rose-100 text-rose-600 px-3 py-1.5 rounded w-fit dark:bg-rose-950/30 dark:border-rose-900/50 dark:text-rose-400">
                        Gastos planejados do mês atual: {formatMoney(plannedExpenses)}
                    </p>

                    {/* Filtros de Data e Botões de Ação */}
                    <div className="flex flex-wrap items-center gap-2 pt-2">
                        <div className="relative group">
                            <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-md px-3 py-1.5 text-sm font-bold text-slate-700 shadow-sm hover:border-teal-500 transition-colors cursor-pointer dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:border-teal-500">
                                <Calendar size={14} className="text-slate-400 group-hover:text-teal-500 dark:text-slate-500" /> 
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
                        <span className="text-slate-300 mx-1 dark:text-slate-700">—</span>
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-sm font-medium text-slate-500 cursor-not-allowed dark:bg-slate-900 dark:border-slate-800 dark:text-slate-600">
                             <Calendar size={14} className="text-slate-400 dark:text-slate-700" /> 
                             <span>{monthColumns[2]}</span>
                        </div>
                        
                        <div className="w-px h-6 bg-slate-300 mx-3 hidden sm:block dark:bg-slate-700"></div>
                        
                        {/* --- BOTÕES DE AÇÃO (HEADER) --- */}
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={togglePrivacy} 
                                className="p-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-all shadow-sm active:scale-95 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                                title={isPrivacyMode ? "Mostrar Valores" : "Ocultar Valores"}
                            >
                                {isPrivacyMode ? <EyeOff size={16}/> : <Eye size={16}/>}
                            </button>

                            <button 
                                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')} 
                                className="p-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-all shadow-sm active:scale-95 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                                title={resolvedTheme === 'dark' ? "Modo Claro" : "Modo Escuro"}
                            >
                                {resolvedTheme === 'dark' ? <Sun size={16}/> : <Moon size={16}/>}
                            </button>

                            <button onClick={() => setIsAssetModalOpen(true)} className="flex items-center gap-1 bg-slate-800 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow hover:bg-slate-900 transition-all dark:bg-brand-600 dark:hover:bg-brand-700">
                                <Plus size={16}/> <span className="hidden sm:inline">Novo Ativo</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* === CARD DE RESUMO === */}
                <div className="w-full xl:w-auto overflow-x-auto pb-1">
                    <div className="grid grid-rows-4 gap-y-px bg-slate-200 border border-slate-200 rounded-lg overflow-hidden text-sm min-w-[600px] shadow-sm dark:bg-slate-800 dark:border-slate-800">
                        
                        <div className="grid grid-cols-5 items-stretch bg-white dark:bg-slate-900">
                            <div className="bg-teal-600 text-white font-bold px-3 py-1.5 col-span-2 text-right text-[10px] uppercase tracking-wide flex items-center justify-end dark:bg-teal-700">Rendimento Total</div>
                            {monthColumns.map((m, i) => (
                                <div key={i} className={`px-3 py-1.5 font-bold text-center flex items-center justify-center ${i === 0 ? (totalProfitValue >= 0 ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400' : 'text-rose-600 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-400') : 'text-slate-400 dark:text-slate-600'}`}>
                                    {i === 0 ? (
                                        <span className="flex items-center gap-1">
                                            {totalProfitValue >= 0 ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
                                            {isPrivacyMode ? "•••" : totalYieldPercent.toFixed(2)}%
                                        </span>
                                    ) : '---'}
                                </div>
                            ))}
                        </div>
                        
                        <div className="grid grid-cols-5 items-stretch bg-white dark:bg-slate-900">
                            <div className="bg-teal-600/90 text-white font-bold px-3 py-1.5 col-span-2 text-right text-[10px] uppercase tracking-wide flex items-center justify-end dark:bg-teal-800">Grau de Indep. Financeira</div>
                            {monthColumns.map((m, i) => (
                                <div key={i} className={`px-3 py-1.5 font-bold text-center flex items-center justify-center ${i === 0 ? 'text-teal-700 dark:text-teal-400' : 'text-slate-400 dark:text-slate-600'}`}>
                                    {i === 0 ? (isPrivacyMode ? "•••" : `${independenceRatio.toFixed(2)}%`) : '---'}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-5 items-stretch bg-white dark:bg-slate-900">
                            <div className="bg-teal-600/80 text-white font-bold px-3 py-1.5 col-span-2 text-right text-[10px] uppercase tracking-wide flex items-center justify-end dark:bg-teal-900">Saldo Atual (Mercado)</div>
                            {monthColumns.map((m, i) => (
                                <div key={i} className={`px-3 py-1.5 font-bold text-center flex items-center justify-center bg-slate-50 dark:bg-slate-900 ${i === 0 ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-600'}`}>
                                    {i === 0 ? formatMoney(totalBalance) : '---'}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-5 items-stretch bg-white dark:bg-slate-900">
                             <div className="bg-teal-600/70 text-white font-bold px-3 py-1.5 col-span-2 text-right text-[10px] uppercase tracking-wide flex items-center justify-end dark:bg-teal-950">Total Investido (Custo)</div>
                             {monthColumns.map((m, i) => (
                                <div key={i} className={`px-3 py-1.5 font-bold text-center flex items-center justify-center ${i === 0 ? 'text-slate-600 dark:text-slate-400' : 'text-slate-400 dark:text-slate-600'}`}>
                                    {i === 0 ? formatMoney(totalApplied) : '---'}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* === TABELA DE ATIVOS === */}
        <div className="bg-white rounded-t-xl shadow-sm border border-slate-200 overflow-hidden dark:bg-slate-900 dark:border-slate-800">
             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead>
                        <tr className="bg-teal-700 text-white text-[10px] font-extrabold uppercase tracking-wider dark:bg-teal-900">
                            <th className="p-3 w-10 text-center">#</th>
                            <th className="p-3">Ativo / Código</th>
                            <th className="p-3">Tipo</th>
                            <th className="p-3 text-right">Qtd</th>
                            <th className="p-3 text-right">Preço Médio</th>
                            <th className="p-3 text-right">Preço Atual</th>
                            <th className="p-3 text-center min-w-[120px] border-l border-teal-600 bg-teal-800/60 dark:border-teal-800 dark:bg-teal-950/50">Saldo Atual</th>
                            <th className="p-3 text-center w-20">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="text-xs">
                        {isLoading ? (
                             <tr><td colSpan={8} className="p-12 text-center"><Loader2 className="animate-spin inline text-teal-600 w-8 h-8 dark:text-teal-400"/></td></tr>
                        ) : assets.length === 0 ? (
                             <tr><td colSpan={8} className="p-12 text-center text-slate-400 font-medium dark:text-slate-600">Nenhum ativo encontrado. Adicione um novo!</td></tr>
                        ) : assets.map((asset, index) => {
                            const isEven = index % 2 === 0;
                            const rowBg = isEven ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-900/50';
                            
                            const yieldVal = asset.current_total - asset.invested_amount;
                            const yieldPct = asset.invested_amount > 0 ? (yieldVal / asset.invested_amount) * 100 : 0;
                            const isPositive = yieldVal >= 0;

                            return (
                                <tr key={asset.id} className={`${rowBg} hover:bg-teal-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-100 dark:border-slate-800 group`}>
                                    <td className="p-3 text-center">
                                        <div className={`w-2 h-2 rounded-full mx-auto ${asset.type === 'FIXED' ? 'bg-teal-500' : asset.type === 'STOCK' ? 'bg-amber-500' : 'bg-rose-500'}`}></div>
                                    </td>
                                    <td className="p-3 font-bold text-slate-700 dark:text-slate-200">
                                        {asset.ticker} 
                                        <span className="block text-[10px] text-slate-400 font-normal dark:text-slate-500">{asset.name}</span>
                                    </td>
                                    <td className="p-3 text-slate-500 font-medium dark:text-slate-400">{asset.type}</td>
                                    <td className="p-3 text-right text-slate-600 dark:text-slate-300">{asset.quantity}</td>
                                    <td className="p-3 text-right text-slate-500 dark:text-slate-400">{formatMoney(asset.invested_amount / (asset.quantity || 1))}</td>
                                    <td className="p-3 text-right font-bold text-slate-700 dark:text-slate-200">{formatMoney(asset.price || 0)}</td>

                                    <td className="p-2 border-l border-slate-100 bg-teal-50/20 dark:border-slate-800 dark:bg-teal-950/20">
                                        <div className="flex flex-col items-end">
                                            <span className="font-bold text-slate-800 dark:text-white">{formatMoney(asset.current_total)}</span>
                                            <span className={`text-[10px] font-bold flex items-center gap-0.5 ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                                                {isPositive ? '+' : ''}{isPrivacyMode ? "•••" : yieldPct.toFixed(2)}%
                                            </span>
                                        </div>
                                    </td>

                                    <td className="p-3 text-center">
                                        <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEditAsset(asset)} className="p-1.5 hover:bg-slate-200 rounded text-slate-500 dark:hover:bg-slate-700 dark:text-slate-400"><Pencil size={14}/></button>
                                            <button onClick={() => handleDeleteAsset(asset.id)} className="p-1.5 hover:bg-red-100 rounded text-red-500 dark:hover:bg-red-900/30 dark:text-red-400"><Trash2 size={14}/></button>
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