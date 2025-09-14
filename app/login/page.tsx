// app/api/birthdays/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";


// Verifica sessão do admin a partir dos cookies da requisição
function supabaseFromRequest(req: NextRequest) {
return createClient(
process.env.NEXT_PUBLIC_SUPABASE_URL!,
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
{ global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } }
);
}


export async function GET(req: NextRequest) {
try {
const url = new URL(req.url);
const month = Number(url.searchParams.get("month")) || new Date().getMonth() + 1; // 1..12


// exige usuário logado
const supabase = supabaseFromRequest(req);
const { data: userData } = await supabase.auth.getUser();
if (!userData?.user) {
return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
}


// consulta na view
const admin = createClient(
process.env.NEXT_PUBLIC_SUPABASE_URL!,
process.env.SUPABASE_SERVICE_ROLE_KEY!
);


const { data, error } = await admin
.from("v_birthdays")
.select("id,name,birthdate,birth_day,is_primary,relation,phone,address")
.eq("birth_month", month)
.order("birth_day", { ascending: true });


if (error) throw error;


return NextResponse.json({ items: data });
} catch (e: any) {
console.error(e);
return NextResponse.json({ error: e.message || "Erro" }, { status: 500 });
}
}