// lib/supabaseBrowser.ts
"use client";

import { createClient } from "@supabase/supabase-js";

export function supabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    throw new Error("Supabase browser envs ausentes (URL ou ANON KEY).");
  }

  // Client para rodar no navegador (App Router)
  return createClient(url, anon, {
    auth: {
      persistSession: true,
      // usa o localStorage do browser (só existe no cliente)
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}
