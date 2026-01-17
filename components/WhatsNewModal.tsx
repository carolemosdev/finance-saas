"use client";

import { useState, useEffect } from "react";
import { Zap, CreditCard, Sparkles, TrendingUp, X } from "lucide-react";

export function WhatsNewModal() {
  const [isOpen, setIsOpen] = useState(false);

  // Mudei a chave para 'flui_v1_friendly' para o modal aparecer novamente
  // já que mudamos os textos.
  const CURRENT_VERSION_KEY = "flui_v1_friendly";

  useEffect(() => {
    const hasSeenUpdate = localStorage.getItem(CURRENT_VERSION_KEY);
    if (!hasSeenUpdate) {
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
            {/* TEXTO ATUALIZADO: MAIS PRÓXIMO */}
            <h2 className="text-2xl font-extrabold tracking-tight">O Flui ficou ainda melhor pra você!</h2>
            <p className="text-brand-100 font-medium mt-1">Preparamos novidades para simplificar sua rotina.</p>
          </div>
        </div>

        <div className="p-8 space-y-6 bg-white">
          {/* Feature 1 */}
          <div className="flex gap-4 group">
            <div className="bg-purple-50 p-3 rounded-2xl h-fit group-hover:bg-purple-100 transition-colors">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Seus Investimentos em Tempo Real</h3>
              <p className="text-slate-500 text-sm leading-relaxed mt-1">
                Conectamos o Flui direto na B3. Agora você vê seu patrimônio crescendo com os valores atualizados na hora.
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="flex gap-4 group">
            <div className="bg-emerald-50 p-3 rounded-2xl h-fit group-hover:bg-emerald-100 transition-colors">
              <Zap className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Cadastro Inteligente</h3>
              <p className="text-slate-500 text-sm leading-relaxed mt-1">
                Esqueça o trabalho manual. Comece a digitar o nome da ação e a gente preenche o resto pra você.
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="flex gap-4 group">
            <div className="bg-blue-50 p-3 rounded-2xl h-fit group-hover:bg-blue-100 transition-colors">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Adeus, Fatura em Aberto</h3>
              <p className="text-slate-500 text-sm leading-relaxed mt-1">
                Feche o mês com um clique. O novo botão "Pagar Fatura" organiza seu saldo e zera o cartão num piscar de olhos.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100">
          <button 
            onClick={handleClose}
            className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg shadow-brand-600/20 transition-all active:scale-[0.98] w-full flex items-center justify-center gap-2 text-lg"
          >
            {/* TEXTO DO BOTÃO ATUALIZADO */}
            <span>Adorei, quero ver!</span> 💙
          </button>
        </div>

      </div>
    </div>
  );
}