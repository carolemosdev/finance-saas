"use client";

import { useState, useEffect } from "react";
import { CreditCard, Sparkles, TrendingUp, X, Eye } from "lucide-react";

export function WhatsNewModal() {
  const [isOpen, setIsOpen] = useState(false);

  // Chave atualizada para forçar a exibição da novidade
  const CURRENT_VERSION_KEY = "flui_v2_privacy_mode";

  useEffect(() => {
    const hasSeenUpdate = localStorage.getItem(CURRENT_VERSION_KEY);
    if (!hasSeenUpdate) {
      // Pequeno delay para uma entrada mais suave
      const timer = setTimeout(() => setIsOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem(CURRENT_VERSION_KEY, "true");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-500">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-300">
        
        <button 
          onClick={handleClose} 
          className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors z-20 bg-black/20 hover:bg-black/30 p-1.5 rounded-full"
        >
          <X size={20} />
        </button>

        {/* Cabeçalho */}
        <div className="bg-gradient-to-br from-brand-600 to-indigo-700 p-8 text-white text-center relative overflow-hidden">
          {/* Efeitos de Fundo */}
          <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-32 h-32 bg-indigo-500/30 rounded-full blur-2xl"></div>
          
          <div className="relative z-10">
            <div className="bg-white/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md shadow-lg border border-white/20">
               <Sparkles className="w-8 h-8 text-amber-300 drop-shadow-md" />
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight">Novidades no Flui!</h2>
            <p className="text-brand-100 font-medium mt-1">Atualizamos o sistema para te dar mais liberdade.</p>
          </div>
        </div>

        <div className="p-8 space-y-6 bg-white">
          
          {/* NOVIDADE: MODO PRIVACIDADE */}
          <div className="flex gap-4 group">
            <div className="bg-slate-100 p-3 rounded-2xl h-fit group-hover:bg-slate-200 transition-colors shrink-0">
              <Eye className="w-6 h-6 text-slate-700" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Modo Privacidade</h3>
              <p className="text-slate-500 text-sm leading-relaxed mt-1 font-medium">
                Está em público? Clique no "olhinho" ao lado do seu nome para ocultar seus saldos instantaneamente.
              </p>
            </div>
          </div>

          {/* Investimentos */}
          <div className="flex gap-4 group">
            <div className="bg-emerald-50 p-3 rounded-2xl h-fit group-hover:bg-emerald-100 transition-colors shrink-0">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Investimentos em Tempo Real</h3>
              <p className="text-slate-500 text-sm leading-relaxed mt-1 font-medium">
                Seus ativos agora são sincronizados automaticamente com a cotação real da B3.
              </p>
            </div>
          </div>

          {/* Cartões */}
          <div className="flex gap-4 group">
            <div className="bg-blue-50 p-3 rounded-2xl h-fit group-hover:bg-blue-100 transition-colors shrink-0">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Pagar Fatura</h3>
              <p className="text-slate-500 text-sm leading-relaxed mt-1 font-medium">
                Feche o mês com facilidade. O novo botão zera o limite do cartão e organiza seu fluxo de caixa.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100">
          <button 
            onClick={handleClose}
            className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg shadow-brand-600/20 transition-all active:scale-[0.98] w-full flex items-center justify-center gap-2 text-lg"
          >
            <span>Entendi, vamos lá!</span> 🚀
          </button>
        </div>

      </div>
    </div>
  );
}