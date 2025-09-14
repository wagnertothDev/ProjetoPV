// app/api/member/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin"; // deve exportar uma FUNÇÃO que cria o client

// Garante que o Next não tente “pré-renderizar/coletar dados” dessa rota no build
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type FamilyItem = { name: string; birthdate: string; relation?: string };

export async function POST(req: NextRequest) {
  try {
    const { primary, family } = await req.json();

    // Normaliza campos do membro principal
    const pName = String(primary?.name ?? "").trim();
    const pBirth = String(primary?.birthdate ?? "").trim(); // yyyy-mm-dd
    const pPhone = String(primary?.phone ?? "").trim();
    const pAddress = String(primary?.address ?? "").trim();

    if (!pName || !pBirth || !pPhone || !pAddress) {
      return NextResponse.json(
        { error: "Campos obrigatórios faltando." },
        { status: 400 }
      );
    }

    const fam: FamilyItem[] = Array.isArray(family) ? family : [];

    // ⚠️ cria o client AQUI (lazy), usando vars de ambiente já disponíveis no server
    const db = supabaseAdmin();

    // 1) Tenta localizar membro primário pelo (telefone + data nasc)
    const { data: existing, error: selErr } = await db
      .from("members")
      .select("id")
      .eq("is_primary", true)
      .eq("phone", pPhone)
      .eq("birthdate", pBirth)
      .maybeSingle();

    if (selErr) throw selErr;

    let primaryId: string | null = existing?.id ?? null;

    if (primaryId) {
      // UPDATE do membro principal (mantém phone e birthdate como chaves)
      const { error: upErr } = await db
        .from("members")
        .update({ name: pName, address: pAddress })
        .eq("id", primaryId);
      if (upErr) throw upErr;

      // Remove familiares antigos (estratégia simples de substituição)
      const { error: delErr } = await db
        .from("members")
        .delete()
        .eq("parent_id", primaryId);
      if (delErr) throw delErr;
    } else {
      // INSERT do membro principal
      const { data: inserted, error: insErr } = await db
        .from("members")
        .insert({
          is_primary: true,
          name: pName,
          birthdate: pBirth,
          phone: pPhone,
          address: pAddress,
        })
        .select("id")
        .single();
      if (insErr) throw insErr;
      primaryId = inserted.id;
    }

    // (Re)insere familiares
    if (primaryId && fam.length > 0) {
      const rows = fam
        .filter((f) => f?.name && f?.birthdate)
        .map((f) => ({
          is_primary: false,
          parent_id: primaryId,
          name: String(f.name).trim(),
          birthdate: String(f.birthdate).trim(),
          relation: String(f.relation ?? "Outro").trim(),
        }));

      if (rows.length > 0) {
        const { error: famErr } = await db.from("members").insert(rows);
        if (famErr) throw famErr;
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: e?.message || "Erro inesperado" },
      { status: 500 }
    );
  }
}
