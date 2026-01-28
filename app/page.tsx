import { redirect } from "next/navigation";
import { createClient } from "../lib/supabase-server"; 
import { DashboardView } from "../components/DashboardView";
import { getCurrentPrice } from "../lib/priceService";

export default async function Home() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth");
  }

  // --- 1. Fetch Paralelo (Adicionei categoriesPromise) ---
  const transactionsPromise = supabase
    .from("transactions")
    .select(`*, categories (name)`)
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  // Precisamos das categorias para ver o Orçamento (Budget)
  const categoriesPromise = supabase
    .from("categories")
    .select("*")
    .eq("user_id", user.id);

  const assetsPromise = supabase.from("assets").select("*").eq("user_id", user.id);
  const goalsPromise = supabase.from("goals").select("*").eq("user_id", user.id);
  const cardsPromise = supabase.from("credit_cards").select("*").eq("user_id", user.id);

  const [
    { data: transactionsData },
    { data: categoriesData }, // Novo
    { data: assetsData },
    { data: goalsData },
    { data: cardsData }
  ] = await Promise.all([
    transactionsPromise, 
    categoriesPromise, 
    assetsPromise, 
    goalsPromise, 
    cardsPromise
  ]);

  const transactions = transactionsData || [];
  const categories = categoriesData || []; // Novo
  const assets = assetsData || [];
  const goals = goalsData || [];
  const rawCards = cardsData || [];

  // --- 2. Processamento de Cartões ---
  const cards = rawCards.map((card) => {
    const cardTrans = transactions.filter((t: any) => 
      t.credit_card_id === card.id && 
      t.type === 'EXPENSE' && 
      !t.is_paid 
    );
    const invoice = cardTrans.reduce((acc, curr: any) => acc + curr.amount, 0);
    return { ...card, current_invoice: invoice };
  });

  // --- 3. Processamento de Investimentos ---
  let totalInvested = 0;
  if (assets.length > 0) {
    await Promise.all(assets.map(async (asset) => {
      try {
        const price = await getCurrentPrice(asset.ticker || asset.name, asset.type);
        totalInvested += price * asset.quantity;
      } catch (e) {
        totalInvested += asset.current_amount || 0;
      }
    }));
  }

  // --- 4. Renderização ---
  // Removemos o cálculo de resumo fixo daqui, pois a View vai calcular dinamicamente baseada no filtro de Mês
  return (
    <DashboardView 
      initialTransactions={transactions}
      categories={categories} // Passando categorias
      cards={cards}
      assets={assets}
      goals={goals}
      userEmail={user.email || ""}
      userId={user.id}
      totalInvested={totalInvested}
    />
  );
}