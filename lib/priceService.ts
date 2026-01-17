
// ⚠️ COLE SEU TOKEN DA BRAPI DENTRO DAS ASPAS ABAIXO:
const BRAPI_TOKEN = "ffyZdhhijEMa5h9omMXqMi"; 

// Mapeamento simples de IDs do CoinGecko (para criptos famosas)
const CRYPTO_MAP: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'SOL': 'solana',
  'USDT': 'tether',
  'ADA': 'cardano',
  'DOGE': 'dogecoin',
  'MATIC': 'matic-network'
};

export async function getCurrentPrice(ticker: string, type: string): Promise<number> {
  // Limpeza básica do ticker (remove espaços e deixa maiúsculo)
  const symbol = ticker.toUpperCase().trim();

  // --- 1. Lógica para RENDA FIXA ---
  // Retornamos 0 para indicar que o front-end deve usar o valor cadastrado no banco,
  // já que renda fixa não tem "cotação de bolsa" variável minuto a minuto.
  if (type === 'FIXED') {
    return 0; 
  }

  // --- 2. Lógica para CRIPTOMOEDAS (CoinGecko) ---
  if (type === 'CRYPTO') {
    const coinId = CRYPTO_MAP[symbol] || symbol.toLowerCase();
    try {
      const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=brl`);
      
      if (!response.ok) throw new Error("Erro CoinGecko");
      
      const data = await response.json();
      return data[coinId]?.brl || 0;
    } catch (error) {
      console.error(`Erro crypto [${symbol}]:`, error);
      // Se falhar o CoinGecko, tenta a Brapi como fallback para Cripto também
      return fetchBrapiPrice(symbol);
    }
  }

  // --- 3. Lógica para AÇÕES e FIIs (Brapi.dev) ---
  if (type === 'STOCK' || type === 'FII') {
    return await fetchBrapiPrice(symbol);
  }

  return 0;
}

// Função auxiliar para chamar a Brapi
async function fetchBrapiPrice(ticker: string): Promise<number> {
  try {
    // A Brapi exige o token na URL
    const response = await fetch(
      `https://brapi.dev/api/quote/${ticker}?token=${BRAPI_TOKEN}`,
      { next: { revalidate: 60 } } // Cache de 60 segundos para não estourar limite grátis
    );

    if (!response.ok) return 0;

    const data = await response.json();
    
    // A Brapi retorna um array 'results'. Pegamos o 'regularMarketPrice'
    if (data.results && data.results.length > 0) {
      return data.results[0].regularMarketPrice;
    }
    
    return 0;
  } catch (error) {
    console.error(`Erro Brapi [${ticker}]:`, error);
    return 0;
  }
}