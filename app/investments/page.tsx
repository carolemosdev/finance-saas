"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { getCurrentPrice } from "../../lib/priceService";
import { 
  LayoutDashboard, Wallet, TrendingUp, TrendingDown, PieChart, 
  Target, Plus, Briefcase, ShieldAlert, RefreshCw, Loader2, Trash2, Pencil, CreditCard, LogOut
} from "lucide-react";
import { PieChart as RePie, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { NewAssetModal } from "../../components/NewAssetModal";
import { MobileNav } from "../../components/MobileNav";

interface Asset { id: number; name: string; ticker: string; type: 'FIXED' | 'FII' | 'STOCK' | 'CRYPTO'; quantity: number; current_amount: number; price?: number; }

export default function InvestmentsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [assetToEdit, setAssetToEdit] = useState<Asset | undefined>(undefined);

  const ASSET_COLORS = { FIXED: "#10B981", FII: "#3B82F6", STOCK: "#F59E0B", CRYPTO: "#EF4444" };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }
      setUserId(user.id); setUserEmail(user.email ?? null); fetchAssets(user.id);
    };
    checkUser();
  }, [router]);

  const fetchAssets = async (uid: string) => {
    setIsLoading(true);
    const { data: assetsData } = await supabase.from("assets").select("*").eq("user_id", uid);
    if (assetsData) {
      const updatedAssets = await Promise.all(assetsData.map(async (asset) => {
        const livePrice = await getCurrentPrice(asset.ticker || asset.name, asset.type);
        return { ...asset, price: livePrice, current_amount: livePrice * asset.quantity };
      }));
      setAssets(updatedAssets as any);
    }
    setIsLoading(false);
  };

  const handleDeleteAsset = async (id: number) => { if (!confirm("Tem certeza?")) return; await supabase.from("assets").delete().eq("id", id); if(userId) fetchAssets(userId); };
  const handleEditAsset = (asset: Asset) => { setAssetToEdit(asset); setIsAssetModalOpen(true); };
  const closeModals = () => { setIsAssetModalOpen(false); setAssetToEdit(undefined); if (userId) fetchAssets(userId); };
  
  const calculateRiskProfile = () => {
    const total = assets.reduce((acc, curr) => acc + curr.current_amount, 0);
    if (total === 0) return { label: "Iniciante", color: "text-slate-500", desc: "Adicione ativos." };
    const riskValue = assets.filter(a => a.type === 'STOCK' || a.type === 'CRYPTO').reduce((acc, c) => acc + c.current_amount, 0);
    const riskPercentage = (riskValue / total) * 100;
    if (riskPercentage > 40) return { label: "Arrojado", color: "text-rose-600", desc: "Maior risco." };
    if (riskPercentage > 15) return { label: "Moderado", color: "text-amber-600", desc: "Equilíbrio." };
    return { label: "Conservador", color: "text-emerald-600", desc: "Segurança." };
  };

  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const totalInvested = assets.reduce((acc, c) => acc + c.current_amount, 0);
  const riskProfile = calculateRiskProfile();
  
  const chartData = [
    { name: 'Renda Fixa', value: assets.filter(a => a.type === 'FIXED').reduce((acc, c) => acc + c.current_amount, 0), color: ASSET_COLORS.FIXED },
    { name: 'FIIs', value: assets.filter(a => a.type === 'FII').reduce((acc, c) => acc + c.current_amount, 0), color: ASSET_COLORS.FII },
    { name: 'Ações', value: assets.filter(a => a.type === 'STOCK').reduce((acc, c) => acc + c.current_amount, 0), color: ASSET_COLORS.STOCK },
    { name: 'Cripto', value: assets.filter(a => a.type === 'CRYPTO').reduce((acc, c) => acc + c.current_amount, 0), color: ASSET_COLORS.CRYPTO },
  ].filter(d => d.value > 0);

  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/auth"); };
  
  const SidebarLink = ({ href, icon: Icon, label, active = false }: any) => (
    <a href={href} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group ${active ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
      <Icon size={20} className={active ? 'text-white' : 'text-slate-500 group-hover:text-white transition-colors'} /> {label}
    </a>
  );

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans flex-col md:flex-row">
      <MobileNav userEmail={userEmail} onLogout={handleLogout} />
      <aside className="w-72 bg-slate-900 hidden md:flex flex-col shadow-2xl z-10 relative">
        <div className="p-8">
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3 tracking-tight">
            <div className="bg-brand-600 p-2 rounded-lg shadow-lg shadow-brand-600/50"><Wallet className="w-7 h-7 text-white" /></div>FinSaaS
          </h1>
        </div>
        <nav className="flex-1 px-6 space-y-3 overflow-y-auto py-4 custom-scrollbar">
          <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Principal</p>
          <SidebarLink href="/" icon={LayoutDashboard} label="Dashboard" />
          <SidebarLink href="/incomes" icon={TrendingUp} label="Receitas" />
          <SidebarLink href="/expenses" icon={TrendingDown} label="Despesas" />
          <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mt-8 mb-2">Gestão</p>
          <SidebarLink href="/investments" icon={PieChart} label="Investimentos" active={true} />
          <SidebarLink href="/goals" icon={Target} label="Metas" />
          <SidebarLink href="/credit-cards" icon={CreditCard} label="Cartões" />
        </nav>
        <div className="p-6 bg-slate-950/50 m-4 rounded-2xl border border-slate-800 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-brand-900 rounded-full flex items-center justify-center text-brand-300 font-bold text-lg mb-3 shadow-md shadow-brand-900/50">{userEmail?.charAt(0).toUpperCase()}</div>
          <div className="w-full overflow-hidden mb-4"><p className="text-sm text-white font-medium truncate w-full" title={userEmail || ''}>{userEmail}</p><p className="text-xs text-slate-500 mt-0.5">Conta Gratuita</p></div>
          <button onClick={handleLogout} className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all w-full border border-slate-700 hover:border-slate-600 active:scale-95"><LogOut size={16} /> <span>Sair da conta</span></button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8 relative z-0">
        <header className="flex justify-between items-center mb-8">
          <div><h2 className="text-3xl font-extrabold text-slate-800">Minha Carteira</h2><p className="text-slate-500 flex items-center gap-2 mt-1">Valores em tempo real. {userId && <button onClick={() => fetchAssets(userId)} className="text-brand-600 hover:underline text-xs flex items-center gap-1 font-bold uppercase"><RefreshCw size={12}/> Atualizar</button>}</p></div>
        </header>

        {isLoading ? <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-brand-600" size={32}/></div> : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* PATRIMÔNIO */}
              <div className="bg-white p-6 rounded-2xl shadow-xl shadow-slate-200/60 border-0 flex justify-between items-center relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-12 -mt-12 w-32 h-32 bg-brand-50 rounded-full blur-3xl opacity-70"></div>
                <div className="relative z-10"><p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Patrimônio</p><h3 className="text-3xl font-extrabold text-slate-900 mt-2">{formatMoney(totalInvested)}</h3></div>
                <div className="bg-brand-100 p-3 rounded-2xl relative z-10"><Briefcase className="text-brand-600" size={32}/></div>
              </div>
              {/* PERFIL */}
              <div className="bg-white p-6 rounded-2xl shadow-xl shadow-slate-200/60 border-0 flex justify-between items-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 -mr-12 -mt-12 w-32 h-32 bg-slate-50 rounded-full blur-3xl opacity-70"></div>
                <div className="relative z-10"><p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Perfil</p><h3 className={`text-3xl font-extrabold mt-2 ${riskProfile.color}`}>{riskProfile.label}</h3><p className="text-xs text-slate-400 mt-1 font-medium">{riskProfile.desc}</p></div>
                <div className="bg-slate-100 p-3 rounded-2xl relative z-10"><ShieldAlert className="text-slate-600" size={32}/></div>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* GRÁFICO */}
              <div className="bg-white p-6 rounded-2xl shadow-xl shadow-slate-200/60 border-0 lg:col-span-1 h-auto min-h-[400px] flex flex-col">
                <h4 className="font-bold text-slate-700 mb-6">Alocação de Ativos</h4>
                <div className="flex flex-col gap-6 flex-1">
                  <div className="h-[200px] relative"><ResponsiveContainer width="100%" height="100%"><RePie><Pie data={chartData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">{chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}</Pie><Tooltip formatter={(v:any) => formatMoney(v)} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} /></RePie></ResponsiveContainer><div className="absolute inset-0 flex items-center justify-center pointer-events-none"><Briefcase size={24} className="text-slate-300" /></div></div>
                  <div className="flex flex-col gap-3">{chartData.map((item, index) => (<div key={index} className="flex items-center justify-between text-sm group"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }}></div><span className="text-slate-600 font-medium">{item.name}</span></div><span className="font-bold text-slate-800">{formatMoney(item.value)}</span></div>))}</div>
                </div>
              </div>
              {/* LISTA DE ATIVOS */}
              <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border-0 lg:col-span-2 flex flex-col">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center"><h4 className="font-bold text-lg text-slate-700">Seus Ativos</h4><button onClick={() => setIsAssetModalOpen(true)} className="text-sm bg-brand-600 text-white px-4 py-2 rounded-full hover:bg-brand-700 flex items-center gap-1 font-medium shadow-lg shadow-brand-600/30 transition-all"><Plus size={16} /> Adicionar</button></div>
                
                <div className="flex-1">
                  {/* Mobile Cards */}
                  <div className="md:hidden divide-y divide-slate-100">
                    {assets.map(asset => (
                      <div key={asset.id} className="p-4 flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                            <div><p className="font-bold text-slate-800">{asset.ticker}</p><span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold uppercase">{asset.type}</span></div>
                            <p className="font-extrabold text-slate-800">{formatMoney(asset.current_amount)}</p>
                        </div>
                        <div className="flex justify-between items-center text-xs text-slate-500 mt-1"><span>Qtd: {asset.quantity}</span><span>Preço: {formatMoney(asset.price || 0)}</span></div>
                        <div className="flex justify-end gap-2 mt-2">
                          <button onClick={() => handleEditAsset(asset)} className="bg-slate-50 p-2 rounded-lg text-slate-400 hover:text-brand-600"><Pencil size={14}/></button>
                          <button onClick={() => handleDeleteAsset(asset.id)} className="bg-slate-50 p-2 rounded-lg text-slate-400 hover:text-red-600"><Trash2 size={14}/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider font-semibold"><tr><th className="p-5">Ativo</th><th className="p-5">Qtd.</th><th className="p-5 text-right">Preço</th><th className="p-5 text-right">Total</th><th className="p-5"></th></tr></thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {assets.map(asset => (
                          <tr key={asset.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-5 font-bold text-slate-800">{asset.ticker} <span className="block text-xs text-slate-400 font-normal mt-0.5">{asset.type}</span></td>
                            <td className="p-5 text-slate-600 font-medium">{asset.quantity}</td>
                            <td className="p-5 text-right text-slate-500">{formatMoney(asset.price || 0)}</td>
                            <td className="p-5 text-right font-extrabold text-slate-800">{formatMoney(asset.current_amount)}</td>
                            <td className="p-5 text-right flex justify-end gap-2"><button onClick={() => handleEditAsset(asset)} className="bg-slate-100 text-slate-400 hover:text-brand-600 p-2 rounded-lg transition-colors"><Pencil size={16} /></button><button onClick={() => handleDeleteAsset(asset.id)} className="bg-slate-100 text-slate-400 hover:text-red-600 p-2 rounded-lg transition-colors"><Trash2 size={16} /></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <NewAssetModal isOpen={isAssetModalOpen} onClose={closeModals} userId={userId} assetToEdit={assetToEdit} />
    </div>
  );
}