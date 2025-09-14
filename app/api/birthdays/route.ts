// app/api/birthdays/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Garante que a rota não seja pré-renderizada no build
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Cria um client autenticado a partir do header Authorization da requisição (para checar login)
function supabaseFromRequest(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error("Ambiente: faltam NEXT_PUBLIC_SUPABASE_URL/ANON_KEY");
  }

  // Em runtimes Node, os headers são normalizados em minúsculas
  const authHeader = req.headers.get("authorization") ?? "";
  return createClient(url, anon, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
}

// Client admin (service role) — uso apenas no server (bypassa RLS)
function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) {
    throw new Error("Ambiente: faltam NEXT_PUBLIC_SUPABASE_URL/SERVICE_ROLE_KEY");
  }
  return createClient(url, service, { auth: { persistSession: false } });
}

export async function GET(req: NextRequest) {
  try {
    // Parse seguro do mês (1..12)
    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get("month");
    const month = (() => {
      const n = Number(monthParam);
      return Number.isFinite(n) && n >= 1 && n <= 12 ? n : new Date().getMonth() + 1;
    })();

    // exige usuário logado (via header Authorization do supabase-js no cliente)
    const supabase = supabaseFromRequest(req);
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr) throw userErr;
    if (!userData?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // consulta na view v_birthdays usando service role (server-only)
    const admin = supabaseAdmin();
    const { data, error } = await admin
      .from("v_birthdays")
      .select("id,name,birthdate,birth_day,is_primary,relation,phone,address")
      .eq("birth_month", month)
      .order("birth_day", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ items: data ?? [] });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message || "Erro" }, { status: 500 });
  }
}
