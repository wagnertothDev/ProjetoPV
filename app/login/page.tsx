// app/login/page.tsx
"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { useRouter, useSearchParams } from "next/navigation";

const ADMIN_ALLOW = (process.env.NEXT_PUBLIC_ADMIN_ALLOWLIST || "")
  .split(",")
  .map(s => s.trim().toLowerCase())
  .filter(Boolean);

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState((params.get("email") ?? "").trim());
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const toHumanError = (message: string, status?: number) => {
    const m = (message || "").toLowerCase();
    if (m.includes("email not confirmed") || m.includes("not confirmed")) {
      return "Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada ou peça para o admin marcar como Confirmed.";
    }
    if (m.includes("invalid login credentials") || status === 400) {
      return "Usuário ou senha inválidos.";
    }
    return message || "Falha ao entrar";
  };

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    try {
      const supabase = supabaseBrowser();
      const cleanEmail = email.trim().toLowerCase();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      if (error) throw error;

      // allowlist (garantia extra)
      const authedEmail = data.user?.email?.toLowerCase() || "";
      if (!ADMIN_ALLOW.includes(authedEmail)) {
        await supabase.auth.signOut();
        throw new Error("Seu e-mail não tem permissão de acesso ao relatório.");
      }

      router.replace("/admin/relatorio");
    } catch (err: any) {
      setMsg(toHumanError(err?.message, err?.status));
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    setMsg("");
    setResetSent(false);
    try {
      const supabase = supabaseBrowser();
      // IMPORTANTE: ajuste a URL abaixo para sua URL pública (Vercel) quando publicar
      const redirectTo =
        (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000") + "/login";
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo });
      if (error) throw error;
      setResetSent(true);
      setMsg("Se o e-mail existir, enviamos um link para redefinir a senha.");
    } catch (err: any) {
      setMsg(err?.message || "Não foi possível iniciar a redefinição de senha.");
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
        <div className={`mb-4 text-sm px-4 py-3 rounded-xl border ${
          msg.includes("sucesso") || msg.includes("enviamos") ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
        }`}>
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
            autoComplete="username"
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
            autoComplete="current-password"
            required
          />
        </label>

        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-white transition"
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

          <button
            type="button"
            onClick={resetPassword}
            className="text-sm text-slate-700 underline underline-offset-2 hover:text-slate-900"
          >
            Esqueci minha senha
          </button>
        </div>

        {resetSent && (
          <p className="text-xs text-slate-600">
            Se o e-mail existir, um link de redefinição foi enviado.
          </p>
        )}
      </form>
    </main>
  );
}
