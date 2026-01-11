"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { Wallet, Loader2, ArrowRight, Mail, Lock, CheckCircle2 } from "lucide-react";

export default function AuthPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true); // Alternar entre Login e Cadastro
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    if (isLogin) {
      // --- LOGIN ---
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setErrorMsg("E-mail ou senha incorretos.");
        setIsLoading(false);
      } else {
        router.push("/"); // Sucesso
      }
    } else {
      // --- CADASTRO ---
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        setErrorMsg("Erro ao criar conta. Tente outra senha.");
        setIsLoading(false);
      } else {
        // Login automático após cadastro (opcional, dependendo da config do Supabase)
        router.push("/");
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* BACKGROUND EFFECTS (LUZES DE FUNDO) */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-600/20 rounded-full blur-[128px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[128px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-slate-950/50 overflow-hidden relative z-10 transition-all duration-500">
        
        {/* CABEÇALHO DO CARD */}
        <div className="bg-slate-50 p-8 pb-6 border-b border-slate-100 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-600 rounded-2xl shadow-lg shadow-brand-600/40 mb-4">
            <Wallet className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">FinSaaS</h1>
          <p className="text-slate-500 text-sm mt-2">
            {isLogin ? "Bem-vindo de volta! Acesse sua conta." : "Comece a controlar suas finanças hoje."}
          </p>
        </div>

        {/* FORMULÁRIO */}
        <div className="p-8 pt-6">
          <form onSubmit={handleAuth} className="space-y-5">
            
            {/* Campo E-mail */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">E-mail</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-brand-600 transition-colors" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="seu@email.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-900 transition-all font-medium placeholder:text-slate-400"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Senha</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-brand-600 transition-colors" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-900 transition-all font-medium placeholder:text-slate-400"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {/* Mensagem de Erro */}
            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>
                {errorMsg}
              </div>
            )}

            {/* Botão Principal */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  {isLogin ? "Entrar na Plataforma" : "Criar Conta Grátis"}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Rodapé do Card (Toggle) */}
          <div className="mt-8 text-center">
            <p className="text-slate-500 text-sm">
              {isLogin ? "Ainda não tem uma conta?" : "Já possui cadastro?"}
            </p>
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setErrorMsg(""); }}
              className="mt-2 text-brand-600 font-bold hover:text-brand-800 transition-colors text-sm uppercase tracking-wide"
            >
              {isLogin ? "Criar conta agora" : "Fazer Login"}
            </button>
          </div>
        </div>

        {/* Feature List (Só aparece no cadastro para "vender" o app) */}
        {!isLogin && (
          <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 animate-in slide-in-from-bottom-4 fade-in duration-500">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Tudo o que você precisa:</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <CheckCircle2 size={16} className="text-emerald-500" /> Controle de Receitas e Despesas
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <CheckCircle2 size={16} className="text-emerald-500" /> Gestão de Investimentos
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <CheckCircle2 size={16} className="text-emerald-500" /> Gráficos e Insights Inteligentes
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Copyright discreto */}
      <div className="absolute bottom-6 text-slate-600 text-xs opacity-50">
        © 2024 FinSaaS. Todos os direitos reservados.
      </div>
    </div>
  );
}