// Mapeamento simples de IDs do CoinGecko
const CRYPTO_MAP: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'SOL': 'solana',
  'USDT': 'tether'
};

export async function getCurrentPrice(ticker: string, type: string): Promise<number> {
  const symbol = ticker.toUpperCase().trim();

  // --- 1. Lógica para CRIPTOMOEDAS (Dados Reais via CoinGecko) ---
  if (type === 'CRYPTO') {
    const coinId = CRYPTO_MAP[symbol] || symbol.toLowerCase();
    try {
      const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=brl`);
      const data = await response.json();
      return data[coinId]?.brl || 0;
    } catch (error) {
      console.error("Erro ao buscar cripto:", error);
      return 0;
    }
  }

  // --- 2. Lógica para AÇÕES/FIIs (Simulação Realista para o MVP) ---
  // Nota: Para dados reais da B3, você precisaria de uma chave da API 'Brapi.dev'
  // Aqui, vamos simular preços baseados em valores aproximados de mercado
  if (type === 'STOCK' || type === 'FII' || type === 'FIXED') {
    // Retorna um valor base + uma pequena variação aleatória para parecer "vivo"
    const mockPrices: Record<string, number> = {
      'PETR4': 38.50,
      'VALE3': 60.20,
      'ITUB4': 33.10,
      'HGLG11': 165.00,
      'MXRF11': 10.50,
      'TESOURO': 1.00, // Tesouro geralmente cadastramos o valor total como quantidade 1
      'CDB': 1.00
    };
    
    const basePrice = mockPrices[symbol] || 100.00; // Se não conhecer, chuta 100
    const variation = (Math.random() * 0.5) - 0.25; // Variação de centavos
    return basePrice + variation;
  }

  return 0;
}