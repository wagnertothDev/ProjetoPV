// lib/supabaseBrowser.ts
"use client";
import { createBrowserClient } from "@supabase/ssr"; // ou '@supabase/auth-helpers-nextjs' se você usa
// Se não usa o pacote acima, pode usar: import { createClient } from "@supabase/supabase-js";

export function supabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Supabase browser envs ausentes (URL ou ANON KEY).");
  }
  // return createClient(url, key);
  return createBrowserClient(url, key);
}
