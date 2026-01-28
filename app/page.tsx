import { redirect } from "next/navigation";
import { createClient } from "../lib/supabase-server"; 
import { DashboardView } from "../components/DashboardView";
import { getCurrentPrice } from "../lib/priceService";

export default async function Home() {
  const supabase = await createClient();

  // 1. Auth no Servidor
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth");
  }

  // 2. Fetch Paralelo
  const transactionsPromise = supabase
    .from("transactions")
    .select(`*, categories (name)`)
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  const categoriesPromise = supabase
    .from("categories")
    .select("*")
    .eq("user_id", user.id);

  const assetsPromise = supabase.from("assets").select("*").eq("user_id", user.id);
  const goalsPromise = supabase.from("goals").select("*").eq("user_id", user.id);
  const cardsPromise = supabase.from("credit_cards").select("*").eq("user_id", user.id);

  const [
    { data: transactionsData },
    { data: categoriesData },
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
  const categories = categoriesData || [];
  const assets = assetsData || [];
  const goals = goalsData || [];
  const rawCards = cardsData || [];

  // 3. Processamento
  const cards = rawCards.map((card) => {
    const cardTrans = transactions.filter((t: any) => 
      t.credit_card_id === card.id && 
      t.type === 'EXPENSE' && 
      !t.is_paid 
    );
    const invoice = cardTrans.reduce((acc, curr: any) => acc + curr.amount, 0);
    return { ...card, current_invoice: invoice };
  });

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

  // 4. Passando props para a View
  // REMOVIDO: hasAnyTransaction e hasAnyInvestment (a View calcula isso internamente agora)
  return (
    <DashboardView 
      transactions={transactions}
      categories={categories}
      cards={cards}
      assets={assets}
      goals={goals}
      userEmail={user.email || ""}
      userId={user.id}
      totalInvested={totalInvested}
    />
  );
}