"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { Wallet, Loader2, ArrowRight, Mail, Lock, CheckCircle2, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { GoogleLoginButton } from "../../components/GoogleLoginButton"; // Componente novo

export default function AuthPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const getPasswordStrength = (pass: string) => {
    if (pass.length === 0) return { score: 0, label: "", color: "bg-slate-200" };
    if (pass.length < 6) return { score: 1, label: "Muito curta (min 6)", color: "bg-red-500" };

    let score = 0;
    if (pass.length >= 6) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 1) return { score: 1, label: "Fraca", color: "bg-red-500" };
    if (score === 2) return { score: 2, label: "Média", color: "bg-yellow-500" };
    if (score >= 3) return { score: 3, label: "Forte", color: "bg-emerald-500" };
    return { score: 0, label: "", color: "bg-slate-200" };
  };

  const strength = getPasswordStrength(password);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!isLogin && password.length < 6) {
      toast.warning("A senha precisa ter pelo menos 6 caracteres.");
      setIsLoading(false);
      return;
    }

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error("E-mail ou senha incorretos.");
        setIsLoading(false);
      } else {
        toast.success("Login realizado com sucesso!");
        router.push("/");
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        toast.error(error.message);
        setIsLoading(false);
      } else {
        toast.success("Conta criada! Verifique seu e-mail.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* BACKGROUND EFFECTS */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-600/20 rounded-full blur-[128px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[128px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-slate-950/50 overflow-hidden relative z-10 transition-all duration-500">
        
        {/* CABEÇALHO */}
        <div className="bg-slate-50 p-8 pb-6 border-b border-slate-100 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-600 rounded-2xl shadow-lg shadow-brand-600/40 mb-4">
            {isLogin ? <Wallet className="text-white w-8 h-8" /> : <ShieldCheck className="text-white w-8 h-8" />}
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Flui</h1>
          <p className="text-slate-500 text-sm mt-2">
            {isLogin ? "Bem-vindo de volta! Acesse sua conta." : "Liberdade para sua senha."}
          </p>
        </div>

        {/* FORMULÁRIO */}
        <div className="p-8 pt-6">
          
          <GoogleLoginButton />
          
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase font-bold tracking-wider">
              <span className="bg-white px-3 text-slate-400">Ou use seu e-mail</span>
            </div>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            
            {/* E-mail */}
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

            {/* Senha */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Senha</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-brand-600 transition-colors" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Sua senha secreta"
                  className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-900 transition-all font-medium placeholder:text-slate-400"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
                </button>
              </div>

              {/* MEDIDOR DE FORÇA */}
              {!isLogin && password.length > 0 && (
                <div className="pt-2 px-1 animate-in fade-in slide-in-from-top-1">
                  <div className="flex gap-1 h-1.5 mb-1.5">
                    <div className={`flex-1 rounded-full transition-all duration-500 ${strength.score >= 1 ? strength.color : 'bg-slate-100'}`}></div>
                    <div className={`flex-1 rounded-full transition-all duration-500 ${strength.score >= 2 ? strength.color : 'bg-slate-100'}`}></div>
                    <div className={`flex-1 rounded-full transition-all duration-500 ${strength.score >= 3 ? strength.color : 'bg-slate-100'}`}></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className={`text-xs font-bold ${strength.score === 1 ? 'text-red-500' : strength.score === 2 ? 'text-yellow-600' : 'text-emerald-600'}`}>
                        {strength.label}
                    </p>
                    <p className="text-[10px] text-slate-400">Min. 6 caracteres</p>
                  </div>
                </div>
              )}
            </div>

            {/* Botão Principal */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group mt-2"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  {isLogin ? "Entrar na Plataforma" : "Criar Conta"}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Login/Cadastro */}
          <div className="mt-8 text-center">
            <p className="text-slate-500 text-sm">
              {isLogin ? "Ainda não tem uma conta?" : "Já possui cadastro?"}
            </p>
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setPassword(""); setShowPassword(false); }}
              className="mt-2 text-brand-600 font-bold hover:text-brand-800 transition-colors text-sm uppercase tracking-wide"
            >
              {isLogin ? "Criar conta agora" : "Fazer Login"}
            </button>
          </div>
        </div>

        {/* Feature List (Aparece no Cadastro) */}
        {!isLogin && (
          <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 animate-in slide-in-from-bottom-4 fade-in duration-500">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Sua senha, suas regras:</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <CheckCircle2 size={16} className="text-emerald-500" /> Símbolos (!@#) liberados
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <CheckCircle2 size={16} className="text-emerald-500" /> Senhas complexas aceitas
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="absolute bottom-6 text-slate-600 text-xs opacity-50">
        © 2026 Flui. Todos os direitos reservados.
      </div>
    </div>
  );
}