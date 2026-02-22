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