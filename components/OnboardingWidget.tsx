"use client";

import { CheckCircle2, Circle, ArrowRight, X, PartyPopper } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface OnboardingProps {
  hasTransactions: boolean;
  hasInvestments: boolean; // Ativos ou Metas
  onOpenTransactionModal: () => void;
}

export function OnboardingWidget({ hasTransactions, hasInvestments, onOpenTransactionModal }: OnboardingProps) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);

  // Calcula o progresso
  const steps = [
    { 
      id: 1, 
      label: "Registre sua primeira transação", 
      done: hasTransactions, 
      action: onOpenTransactionModal,
      btnText: "Adicionar"
    },
    { 
      id: 2, 
      label: "Defina um investimento ou meta", 
      done: hasInvestments, 
      action: () => router.push("/goals"), // Direcionar para metas é geralmente mais fácil para iniciantes
      btnText: "Criar Meta"
    }
  ];

  const completedCount = steps.filter(s => s.done).length;
  const progress = (completedCount / steps.length) * 100;
  const isAllDone = completedCount === steps.length;

  // Se o usuário fechar, esconde. Se completou tudo, mostra uma mensagem de parabéns antes de sumir (opcional, aqui mantive sumindo ou fechando)
  if (!isVisible) return null;

  return (
    <div className={`relative overflow-hidden rounded-2xl p-6 mb-8 shadow-xl transition-all duration-700 animate-in fade-in slide-in-from-top-4 ${isAllDone ? 'bg-emerald-600' : 'bg-brand-600'} text-white`}>
      
      {/* Background Decorativo */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 bg-black/10 rounded-full blur-2xl pointer-events-none"></div>
      
      <div className="flex justify-between items-start relative z-10">
        <div>
          <h3 className="text-xl font-extrabold mb-1 flex items-center gap-2">
            {isAllDone ? "Tudo pronto! 🎉" : "Bem-vindo ao Flui! 🚀"}
          </h3>
          <p className="text-white/80 text-sm mb-5 font-medium">
            {isAllDone 
              ? "Você já deu os primeiros passos. Agora é manter o foco!" 
              : "Complete os passos abaixo para dominar suas finanças."}
          </p>
        </div>
        <button 
          onClick={() => setIsVisible(false)} 
          className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          title="Fechar"
        >
          <X size={18} />
        </button>
      </div>

      {/* Barra de Progresso */}
      {!isAllDone && (
        <div className="w-full bg-black/20 rounded-full h-1.5 mb-6 overflow-hidden">
          <div 
            className="bg-emerald-400 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(52,211,153,0.5)]" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}

      {/* Lista de Passos */}
      {isAllDone ? (
         <div className="flex items-center gap-4 bg-white/10 p-4 rounded-xl border border-white/10">
            <div className="bg-emerald-500 p-3 rounded-full text-white shadow-lg">
                <PartyPopper size={24} />
            </div>
            <div>
                <p className="font-bold text-lg">Parabéns!</p>
                <p className="text-sm text-emerald-100">Seu dashboard está configurado e pronto para usar.</p>
            </div>
         </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {steps.map((step) => (
            <div 
              key={step.id} 
              className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border transition-all ${
                step.done 
                  ? "bg-brand-800/40 border-transparent opacity-60" 
                  : "bg-white/10 border-white/10 hover:bg-white/15 shadow-sm"
              }`}
            >
              <div className="flex items-center gap-3 mb-3 sm:mb-0">
                {step.done ? (
                  <CheckCircle2 className="text-emerald-400 shrink-0" size={24} />
                ) : (
                  <Circle className="text-white/40 shrink-0" size={24} />
                )}
                <span className={`font-bold text-sm ${step.done ? "line-through text-white/50" : "text-white"}`}>
                  {step.label}
                </span>
              </div>
              
              {!step.done && (
                <button 
                  onClick={step.action}
                  className="w-full sm:w-auto text-xs bg-white text-brand-900 px-4 py-2 rounded-lg font-bold hover:bg-brand-50 transition-all active:scale-95 flex items-center justify-center gap-1 shadow-md"
                >
                  {step.btnText} <ArrowRight size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}