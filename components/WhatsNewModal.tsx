"use client";

import { useEffect, useState } from "react";
import { 
  X, Sparkles, Moon, EyeOff, CreditCard, ArrowRightLeft 
} from "lucide-react";

interface WhatsNewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WhatsNewModal({ isOpen, onClose }: WhatsNewModalProps) {
  const [show, setShow] = useState(false);

  // Efeito para animação suave de entrada
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setShow(true), 50);
    } else {
      setShow(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${show ? 'bg-slate-900/60 backdrop-blur-sm' : 'bg-transparent pointer-events-none'}`}>
      
      <div className={`bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden transition-all duration-500 transform ${show ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-8'} border border-slate-100 dark:border-slate-800`}>
        
        {/* CABEÇALHO DO MODAL */}
        <div className="relative bg-gradient-to-br from-brand-600 to-indigo-800 p-8 text-white text-center overflow-hidden">
          {/* Brilho decorativo */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition-colors z-10">
            <X size={20} />
          </button>
          
          <div className="relative z-10 flex justify-center mb-4">
             <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm shadow-inner border border-white/20">
               <Sparkles size={32} className="text-amber-300" />
             </div>
          </div>
          <h2 className="text-3xl font-black tracking-tight mb-2 relative z-10 drop-shadow-sm">Novidades da Versão 1.2!</h2>
          <p className="text-brand-100 text-sm font-medium relative z-10">A sua gestão financeira acaba de ficar muito mais inteligente.</p>
        </div>

        {/* LISTA DE NOVIDADES */}
        <div className="p-6 md:p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          
          <div className="flex gap-4 items-start">
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 shrink-0">
               <Moon size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Modo Escuro (Dark Mode)</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Você pediu e ele chegou! Alterne para o tema escuro no menu superior e descanse a visão ao gerenciar suas finanças à noite.</p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400 shrink-0">
               <EyeOff size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Modo Privacidade</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Use o aplicativo em locais públicos com segurança. Clique no ícone de "olho" para esconder todos os seus saldos e valores.</p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400 shrink-0">
               <CreditCard size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Nova Gestão de Cartões</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Os cartões ganharam um novo visual! Acompanhe a barra de uso do limite e saiba exatamente quando a fatura fecha ou vence. Agora você também pode zerar sua fatura no app com um clique.</p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="p-3 bg-brand-50 dark:bg-brand-900/30 rounded-xl text-brand-600 dark:text-brand-400 shrink-0">
               <ArrowRightLeft size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Débito vs. Crédito</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Ao registrar uma despesa e selecionar um cartão, você pode escolher se o valor vai para a fatura (Crédito) ou se já foi pago na hora (Débito).</p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400 shrink-0">
               <Sparkles size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Flui AI Insights</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Seu novo assistente inteligente no Dashboard analisa suas movimentações e avisa se você gastou demais, onde economizar ou se tem dinheiro parado.</p>
            </div>
          </div>

        </div>

        {/* RODAPÉ DO MODAL */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <button 
            onClick={onClose} 
            className="w-full bg-slate-900 dark:bg-brand-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:bg-slate-800 dark:hover:bg-brand-700 transition-all active:scale-95 text-center"
          >
            Incrível, quero testar!
          </button>
        </div>
        
      </div>
    </div>
  );
}