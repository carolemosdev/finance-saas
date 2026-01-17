import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner"; // <--- Import da biblioteca de Toasts

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
    <html lang="pt-BR">
      <body className={inter.className}>
        {children}
        {/* Componente de notificações global */}
        <Toaster richColors position="top-right" theme="light" closeButton /> 
      </body>
    </html>
  );
}