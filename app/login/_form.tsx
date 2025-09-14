// app/login/_form.tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function LoginFormClient() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    try {
      const supabase = supabaseBrowser();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.replace("/admin/relatorio");
    } catch (err: any) {
      setMsg(err?.message || "Falha ao entrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-md p-6">
      <header className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/80 backdrop-blur shadow-sm mb-6">
        <div className="absolute inset-0 opacity-90">
          <div className="h-full w-full bg-gradient-to-r from-indigo-600/10 via-sky-400/10 to-emerald-500/10" />
        </div>
        <div className="relative p-6 flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-[var(--church-indigo)] text-white grid place-items-center shadow-md">🔒</div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Acesso Restrito</h1>
            <p className="text-sm text-slate-700">Entre para ver o relatório de aniversariantes.</p>
          </div>
        </div>
      </header>

      {msg && (
        <div className="mb-4 text-sm px-4 py-3 rounded-xl border bg-rose-50 text-rose-700 border-rose-200">
          {msg}
        </div>
      )}

      <form onSubmit={signIn} className="card p-6 space-y-4">
        <label className="space-y-1.5 block">
          <span className="text-sm font-medium text-slate-700">E-mail</span>
          <input
            type="email"
            placeholder="seuemail@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label className="space-y-1.5 block">
          <span className="text-sm font-medium text-slate-700">Senha</span>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-white transition"
          style={{ background: "var(--church-indigo)" }}
        >
          {loading ? (
            <>
              <span className="h-4 w-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
              Entrando…
            </>
          ) : (
            "Entrar"
          )}
        </button>
      </form>
    </main>
  );
}
