"use client";

import { CheckCircle2, Circle, ArrowRight, X } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface OnboardingProps {
  hasTransactions: boolean;
  hasInvestments: boolean; // Ativos ou Metas
  onOpenTransactionModal: () => void;
}

// ATENÇÃO AQUI: Deve ser "export function", NÃO "export default function"
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
      action: () => router.push("/investments"),
      btnText: "Ir para Investimentos"
    }
  ];

  const completedCount = steps.filter(s => s.done).length;
  const progress = (completedCount / steps.length) * 100;

  // Se tudo estiver pronto ou usuário fechar, esconde
  if (!isVisible || (hasTransactions && hasInvestments)) return null;

  return (
    <div className="bg-indigo-900 text-white rounded-xl p-6 mb-8 relative overflow-hidden shadow-lg animate-in fade-in slide-in-from-top-4 duration-700">
      {/* Background Decorativo */}
      <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
      
      <div className="flex justify-between items-start relative z-10">
        <div>
          <h3 className="text-xl font-bold mb-1">Bem-vindo ao Flui! 🚀</h3>
          <p className="text-indigo-200 text-sm mb-4">Complete os passos abaixo para dominar suas finanças.</p>
        </div>
        <button onClick={() => setIsVisible(false)} className="text-indigo-300 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Barra de Progresso */}
      <div className="w-full bg-indigo-800 rounded-full h-2 mb-6">
        <div 
          className="bg-green-400 h-2 rounded-full transition-all duration-1000 ease-out" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Lista de Passos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {steps.map((step) => (
          <div 
            key={step.id} 
            className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
              step.done 
                ? "bg-indigo-800/50 border-transparent opacity-70" 
                : "bg-white/5 border-white/10 hover:bg-white/10"
            }`}
          >
            <div className="flex items-center gap-3">
              {step.done ? (
                <CheckCircle2 className="text-green-400" size={24} />
              ) : (
                <Circle className="text-indigo-300" size={24} />
              )}
              <span className={step.done ? "line-through text-indigo-300" : "font-medium"}>
                {step.label}
              </span>
            </div>
            
            {!step.done && (
              <button 
                onClick={step.action}
                className="text-xs bg-white text-indigo-900 px-3 py-1.5 rounded-md font-bold hover:bg-indigo-50 transition-colors flex items-center gap-1"
              >
                {step.btnText} <ArrowRight size={12} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}