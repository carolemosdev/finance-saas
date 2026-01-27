import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    // CORREÇÃO PARA NEXT.JS 16: Adicionado o 'await' aqui
    const cookieStore = await cookies();
    
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore 
    });
    
    // Troca o código temporário por uma sessão real
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Redireciona para o Dashboard
  return NextResponse.redirect(requestUrl.origin);
}