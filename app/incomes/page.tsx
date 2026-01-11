"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { 
  LayoutDashboard, Wallet, TrendingUp, TrendingDown, PieChart, 
  Loader2, Trash2, Pencil, CreditCard, LogOut
} from "lucide-react"; 
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { NewTransactionModal } from "../../components/NewTransactionModal"; 

interface Transaction {
  id: number;
  description: string;
  amount: number;
  date: string;
  type: "INCOME" | "EXPENSE";
  category_id: number;
  categories: { name: string } | null;
  credit_card_id?: number | null;
}

export default function IncomesPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Estados para Edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | undefined>(undefined);

  const fetchData = async (uid: string) => {
    const { data } = await supabase
      .from("transactions")
      .select(`*, categories (name)`)
      .eq("user_id", uid)
      .eq("type", "INCOME")
      .order("date", { ascending: false });

    if (data) {
      // @ts-ignore
      setTransactions(data);
      // @ts-ignore
      processChartData(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }
      setUserId(user.id);
      setUserEmail(user.email);
      fetchData(user.id);
    };
    checkUser();
  }, [router]);

  const handleDelete = async (id: number) => {
    if(!confirm("Tem certeza que deseja excluir esta receita?")) return;
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) alert("Erro ao excluir.");
    else if (userId) fetchData(userId);
  };

  const handleEdit = (transaction: Transaction) => {
    setTransactionToEdit(transaction);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTransactionToEdit(undefined);
    if (userId) fetchData(userId);
  };

  const processChartData = (data: Transaction[]) => {
    const grouped = data.reduce((acc: any, curr) => {
      const cat = curr.categories?.name || "Outros";
      acc[cat] = (acc[cat] || 0) + curr.amount;
      return acc;
    }, {});
    const chartArray = Object.keys(grouped).map(key => ({ name: key, value: grouped[key] })).sort((a, b) => b.value - a.value);
    setChartData(chartArray);
  };

  const formatMoney = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

  // Helper para links da sidebar
  const SidebarLink = ({ href, icon: Icon, label, active = false }: any) => (
    <a href={href} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group ${active ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
      <Icon size={20} className={active ? 'text-white' : 'text-slate-500 group-hover:text-white transition-colors'} /> {label}
    </a>
  );

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      
      {/* SIDEBAR DARK PREMIUM */}
      <aside className="w-72 bg-slate-900 hidden md:flex flex-col shadow-2xl z-10 relative">
        <div className="p-8">
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3 tracking-tight">
            <div className="bg-brand-600 p-2 rounded-lg shadow-lg shadow-brand-600/50">
              <Wallet className="w-7 h-7 text-white" /> 
            </div>
            FinSaaS
          </h1>
        </div>
        <nav className="flex-1 px-6 space-y-3 overflow-y-auto py-4 custom-scrollbar">
          <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Principal</p>
          <SidebarLink href="/" icon={LayoutDashboard} label="Dashboard" />
          <SidebarLink href="/incomes" icon={TrendingUp} label="Receitas" active={true} />
          <SidebarLink href="/expenses" icon={TrendingDown} label="Despesas" />
          <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mt-8 mb-2">Gestão</p>
          <SidebarLink href="/investments" icon={PieChart} label="Investimentos" />
          <SidebarLink href="/credit-cards" icon={CreditCard} label="Cartões" />
        </nav>
        <div className="p-6 bg-slate-950/50 m-4 rounded-2xl border border-slate-800 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-brand-900 rounded-full flex items-center justify-center text-brand-300 font-bold text-lg mb-3 shadow-md shadow-brand-900/50">
              {userEmail?.charAt(0).toUpperCase()}
          </div>
          <div className="w-full overflow-hidden mb-4">
             <p className="text-sm text-white font-medium truncate w-full" title={userEmail || ''}>{userEmail}</p>
             <p className="text-xs text-slate-500 mt-0.5">Conta Gratuita</p>
          </div>
          <button onClick={handleLogout} className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all w-full border border-slate-700 hover:border-slate-600 active:scale-95">
            <LogOut size={16} /> <span>Sair da conta</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8 relative z-0">
        <h2 className="text-3xl font-extrabold text-slate-800 mb-8">Minhas Receitas</h2>

        {isLoading ? (
          <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-brand-600" size={32} /></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* GRÁFICO FLUTUANTE */}
            <div className="bg-white p-6 rounded-2xl shadow-xl shadow-slate-200/60 border-0 lg:col-span-1 h-[400px]">
              <h3 className="font-bold text-lg mb-6 text-slate-700">Fontes de Renda</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 10 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={90} tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                    <Tooltip 
                      formatter={(value: number) => formatMoney(value)} 
                      cursor={{fill: '#f1f5f9', radius: 4}} 
                      contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                    />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={32}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill="#10b981" /> // Emerald-500
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* TABELA PREMIUM */}
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border-0 overflow-hidden lg:col-span-2 flex flex-col">
              <div className="p-6 border-b border-slate-100">
                 <h3 className="font-bold text-lg text-slate-700">Histórico de Entradas</h3>
              </div>
              <div className="overflow-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="p-5">Descrição</th>
                      <th className="p-5">Categoria</th>
                      <th className="p-5 text-right">Valor</th>
                      <th className="p-5 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-5 font-bold text-slate-800">{t.description}</td>
                        <td className="p-5">
                          <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider">{t.categories?.name}</span>
                        </td>
                        <td className="p-5 text-right font-extrabold text-emerald-600">
                          {formatMoney(t.amount)}
                        </td>
                        <td className="p-5 text-right flex justify-end gap-2">
                          <button onClick={() => handleEdit(t)} className="bg-slate-100 hover:bg-brand-100 text-slate-400 hover:text-brand-600 p-2 rounded-lg transition-colors">
                            <Pencil size={16} />
                          </button>
                          <button onClick={() => handleDelete(t.id)} className="bg-slate-100 hover:bg-red-100 text-slate-400 hover:text-red-600 p-2 rounded-lg transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {transactions.length === 0 && <tr><td colSpan={4} className="p-12 text-center text-slate-400">Nenhuma receita registrada.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}
      </main>

      <NewTransactionModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        userId={userId}
        transactionToEdit={transactionToEdit} 
      />
    </div>
  );
}