import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner"; 
import { ThemeProvider } from "../components/theme-provider"; // <--- 1. Import do Provider

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Flui - Controle Financeiro",
  description: "Gerencie suas finanças com inteligência.",
};

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Flui | Gestão Financeira Inteligente",
  description: "Assuma o controle do seu dinheiro. Planejamento, cartões de crédito e Inteligência Artificial trabalhando para o seu bolso.",
  keywords: ["finanças", "gestão financeira", "saas", "controle de gastos", "cartão de crédito", "ia"],
  authors: [{ name: "Flui Team" }],
  openGraph: {
    title: "Flui | Gestão Financeira Inteligente",
    description: "Assuma o controle do seu dinheiro. Planejamento, cartões de crédito e Inteligência Artificial trabalhando para o seu bolso.",
    url: "https://finance-saas-swart.vercel.app",
    siteName: "Flui",
    images: [
      {
        url: "https://finance-saas-swart.vercel.app/og-image.png", // A imagem que vai aparecer no WhatsApp!
        width: 1200,
        height: 630,
        alt: "Dashboard do Flui SaaS",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Flui | Gestão Financeira Inteligente",
    description: "O seu novo assistente financeiro pessoal.",
    images: ["https://finance-saas-swart.vercel.app/og-image.png"],
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // 2. suppressHydrationWarning adicionado (Obrigatório para o next-themes)
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        
        {/* 3. ThemeProvider abraçando todo o sistema */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          
          {/* 4. Toaster atualizado para theme="system" para ficar escuro junto com a tela */}
          <Toaster richColors position="top-right" theme="system" closeButton /> 
        </ThemeProvider>

      </body>
    </html>
  );
}