"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import CurrencyInput from 'react-currency-input-field';
import { toast } from "sonner";

interface AssetProps { isOpen: boolean; onClose: () => void; userId: string | null; assetToEdit?: any; }

export function NewAssetModal({ isOpen, onClose, userId, assetToEdit }: AssetProps) {
  const [ticker, setTicker] = useState("");
  const [quantity, setQuantity] = useState<string | number>(""); 
  const [price, setPrice] = useState<number | undefined>(undefined);
  const [type, setType] = useState("STOCK"); // Padrão
  const [isLoading, setIsLoading] = useState(false);

  // LISTA VIP: Esses ativos vão aparecer como sugestão para o usuário
  const COMMON_ASSETS = [
    "MXRF11", "HGLG11", "VGHF11", "KLBN4", "KNCR11", "KNIP11", 
    "BTLG11", "CPTS11", "TRXF11", "XPML11", "TGAR11", "IRDM11",
    "PETR4", "VALE3", "ITUB4", "BBAS3", "WEGE3"
  ];

  // Detecta o tipo automaticamente quando o usuário escolhe um da lista
  useEffect(() => {
    const cleanTicker = ticker.toUpperCase().trim();
    if (cleanTicker.endsWith("11")) {
      setType("FII");
    } else if (cleanTicker.length === 5 && (cleanTicker.endsWith("3") || cleanTicker.endsWith("4"))) {
      setType("STOCK");
    }
  }, [ticker]);

  useEffect(() => {
    if (isOpen && assetToEdit) {
      setTicker(assetToEdit.ticker || assetToEdit.name);
      setQuantity(assetToEdit.quantity);
      
      const calcPrice = assetToEdit.current_amount && assetToEdit.quantity 
        ? assetToEdit.current_amount / assetToEdit.quantity 
        : 0;
      setPrice(calcPrice);
      setType(assetToEdit.type);
    } else {
      setTicker(""); 
      setQuantity(""); 
      setPrice(undefined); 
      setType("STOCK");
    }
  }, [isOpen, assetToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId || quantity === "" || price === undefined) {
        toast.warning("Preencha quantidade e preço.");
        return;
    }
    setIsLoading(true);

    const qtdNumber = Number(quantity);
    const currentAmount = qtdNumber * price;

    const payload = { 
        user_id: userId, 
        ticker: ticker.toUpperCase().trim(), 
        name: ticker.toUpperCase().trim(), // O nome será igual ao ticker inicialmente
        quantity: qtdNumber, 
        type,
        current_amount: currentAmount
    };
    
    let error;
    if (assetToEdit) {
       const { error: err } = await supabase.from("assets").update(payload).eq("id", assetToEdit.id);
       error = err;
    } else {
       const { error: err } = await supabase.from("assets").insert([payload]);
       error = err;
    }

    if (error) {
        console.error(error);
        toast.error("Erro ao salvar ativo.");
    } else {
      toast.success("Ativo salvo com sucesso!");
      onClose();
    }
    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">{assetToEdit ? "Editar Ativo" : "Novo Investimento"}</h2>
          <button onClick={onClose}><X size={20} className="text-slate-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div className="space-y-1">
             <label className="text-xs font-bold text-slate-500 uppercase ml-1">Código (Ticker)</label>
             
             {/* CAMPO DE TEXTO COM SUGESTÕES (DATALIST) */}
             <input 
                type="text" 
                list="tickers-list" 
                required 
                placeholder="Ex: MXRF11..." 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-500 outline-none font-bold uppercase placeholder:font-normal" 
                value={ticker} 
                onChange={e => setTicker(e.target.value)} 
             />
             {/* Aqui está a lista "fantasma" que o navegador usa para sugerir */}
             <datalist id="tickers-list">
                {COMMON_ASSETS.map(t => <option key={t} value={t} />)}
             </datalist>

          </div>

          <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-500 uppercase ml-1">Quantidade</label>
                 <input 
                    type="number" 
                    step="0.000001" 
                    required 
                    placeholder="0.00" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-500 outline-none font-medium" 
                    value={quantity} 
                    onChange={e => setQuantity(e.target.value)} 
                 />
              </div>

              <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-500 uppercase ml-1">Preço Pago</label>
                 <CurrencyInput
                    placeholder="R$ 0,00"
                    decimalsLimit={2}
                    decimalScale={2}
                    intlConfig={{ locale: 'pt-BR', currency: 'BRL' }}
                    onValueChange={(value) => {
                        if (!value) {
                            setPrice(undefined);
                        } else {
                            setPrice(Number(value.replace(",", ".")));
                        }
                    }}
                    value={price}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-500 outline-none font-medium"
                 />
              </div>
          </div>

          <div className="space-y-1">
             <label className="text-xs font-bold text-slate-500 uppercase ml-1">Tipo</label>
             <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-500 outline-none font-medium" value={type} onChange={e => setType(e.target.value)}>
               <option value="STOCK">Ação (B3/EUA)</option>
               <option value="FII">Fundo Imobiliário (FII)</option>
               <option value="FIXED">Renda Fixa</option>
               <option value="CRYPTO">Criptomoeda</option>
             </select>
          </div>

          {quantity !== "" && price !== undefined && (
            <div className="text-right text-sm text-slate-500 font-medium">
              Total: <span className="text-brand-600 font-bold">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(quantity) * price)}
              </span>
            </div>
          )}

          <button type="submit" disabled={isLoading} className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 rounded-xl shadow-lg mt-2 flex justify-center items-center gap-2">
            {isLoading ? <Loader2 className="animate-spin" /> : "Salvar Ativo"}
          </button>
        </form>
      </div>
    </div>
  );
}