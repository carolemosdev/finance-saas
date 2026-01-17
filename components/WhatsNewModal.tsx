"use client";

import { useState, useEffect } from "react";
import { Zap, CreditCard, Sparkles, TrendingUp, X } from "lucide-react";

export function WhatsNewModal() {
  const [isOpen, setIsOpen] = useState(false);

  // Mude isso quando lançar novidades futuras (ex: 'finsaas_update_v2')
  const CURRENT_VERSION_KEY = "finsaas_update_v1_investments";

  useEffect(() => {
    // Verifica se o usuário já viu essa atualização específica
    const hasSeenUpdate = localStorage.getItem(CURRENT_VERSION_KEY);
    if (!hasSeenUpdate) {
      // Pequeno delay para não explodir na cara do usuário assim que carrega
      const timer = setTimeout(() => setIsOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    // Marca no navegador do usuário que ele já viu
    localStorage.setItem(CURRENT_VERSION_KEY, "true");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-500">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-300">
        
        <button 
          onClick={handleClose} 
          className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors z-20 bg-black/20 hover:bg-black/30 p-1 rounded-full"
        >
          <X size={20} />
        </button>

        {/* Cabeçalho com Gradiente */}
        <div className="bg-gradient-to-br from-brand-600 to-purple-700 p-8 text-white text-center relative overflow-hidden">
          {/* Efeitos de fundo */}
          <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-32 h-32 bg-purple-500/30 rounded-full blur-2xl"></div>
          
          <div className="relative z-10">
            <div className="bg-white/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md shadow-lg border border-white/20">
               <Sparkles className="w-8 h-8 text-yellow-300 drop-shadow-md" />
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight">O FinSaaS está de cara nova!</h2>
            <p className="text-brand-100 font-medium mt-1">Acabamos de lançar 3 grandes novidades.</p>
          </div>
        </div>

        <div className="p-8 space-y-6 bg-white">
          {/* Feature 1 */}
          <div className="flex gap-4 group">
            <div className="bg-purple-50 p-3 rounded-2xl h-fit group-hover:bg-purple-100 transition-colors">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Investimentos em Tempo Real</h3>
              <p className="text-slate-500 text-sm leading-relaxed mt-1">
                Conectamos com a B3! Seus FIIs e Ações agora mostram a cotação real atualizada automaticamente.
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="flex gap-4 group">
            <div className="bg-emerald-50 p-3 rounded-2xl h-fit group-hover:bg-emerald-100 transition-colors">
              <Zap className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Busca Inteligente</h3>
              <p className="text-slate-500 text-sm leading-relaxed mt-1">
                Ao adicionar um ativo, o sistema sugere o código (ticker) e preenche o preço para você.
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="flex gap-4 group">
            <div className="bg-blue-50 p-3 rounded-2xl h-fit group-hover:bg-blue-100 transition-colors">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Pagamento de Faturas</h3>
              <p className="text-slate-500 text-sm leading-relaxed mt-1">
                Novo botão "Pagar Fatura" nos seus cartões. Ele zera o limite e debita do seu saldo num clique.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100">
          <button 
            onClick={handleClose}
            className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg shadow-brand-600/20 transition-all active:scale-[0.98] w-full flex items-center justify-center gap-2 text-lg"
          >
            <span>Incrível, quero ver!</span> 🚀
          </button>
        </div>

      </div>
    </div>
  );
}