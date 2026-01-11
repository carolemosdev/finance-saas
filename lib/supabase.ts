import { createBrowserClient } from '@supabase/ssr'

// Cria um cliente que roda no navegador mas sincroniza cookies com o servidor
export const createClient = () => 
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

// Exportamos uma instância padrão para usar nos componentes "use client"
export const supabase = createClient()