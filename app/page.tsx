import { redirect } from "next/navigation";
import { createClient } from "../lib/supabase-server"; // Cliente Server
import { DashboardView } from "../components/DashboardView";
import { getCurrentPrice } from "../lib/priceService";

// Server Component (Async)
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

  const assetsPromise = supabase
    .from("assets")
    .select("*")
    .eq("user_id", user.id);

  const goalsPromise = supabase
    .from("goals")
    .select("*")
    .eq("user_id", user.id);

  const cardsPromise = supabase
    .from("credit_cards")
    .select("*")
    .eq("user_id", user.id);

  const [
    { data: transactionsData },
    { data: assetsData },
    { data: goalsData },
    { data: cardsData }
  ] = await Promise.all([transactionsPromise, assetsPromise, goalsPromise, cardsPromise]);

  const transactions = transactionsData || [];
  const assets = assetsData || [];
  const goals = goalsData || [];
  const rawCards = cardsData || [];

  // 3. Processamento
  const cards = rawCards.map((card) => {
    const cardTrans = transactions.filter((t: any) => t.credit_card_id === card.id && t.type === 'EXPENSE');
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

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  let income = 0, expense = 0, total = 0;

  transactions.forEach((item: any) => {
    if (item.type === "INCOME") total += item.amount; else total -= item.amount;
    const tDate = new Date(item.date);
    if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) {
      if (item.type === "INCOME") income += item.amount; else expense += item.amount;
    }
  });

  const summary = { income, expense, total };
  const hasAnyTransaction = transactions.length > 0;
  const hasAnyInvestment = (assets.length > 0 || goals.length > 0);

  // 4. Passando props padronizadas para a View
  return (
    <DashboardView 
      transactions={transactions}
      cards={cards}
      assets={assets}
      goals={goals}
      userEmail={user.email || ""}
      userId={user.id}
      summary={summary}
      totalInvested={totalInvested}
      hasAnyTransaction={hasAnyTransaction}
      hasAnyInvestment={hasAnyInvestment}
    />
  );
}