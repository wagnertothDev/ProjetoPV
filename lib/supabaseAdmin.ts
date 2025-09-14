import { createClient } from "@supabase/supabase-js";

export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase admin envs ausentes (URL ou SERVICE_ROLE).");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}
