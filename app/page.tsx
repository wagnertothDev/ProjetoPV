// app/page.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import FamilyFieldset, { FamilyItem } from "@/components/FamilyFieldset";

const STORAGE_KEY = "pv-cadastro-draft";

function formatPhone(input: string) {
  const d = input.replace(/\D/g, "").slice(0, 11);
  const p1 = d.slice(0, 2);
  const p2 = d.slice(2, 7);
  const p3 = d.slice(7, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${p1}) ${p2}`;
  return `(${p1}) ${p2}-${p3}`;
}

export default function HomePage() {
  const [name, setName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [family, setFamily] = useState<FamilyItem[]>([]);
  const [status, setStatus] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // restaura rascunho
  useEffect(() => {
    try {
      const draft = localStorage.getItem(STORAGE_KEY);
      if (draft) {
        const j = JSON.parse(draft);
        setName(j.name ?? "");
        setBirthdate(j.birthdate ?? "");
        setPhone(j.phone ?? "");
        setAddress(j.address ?? "");
        setFamily(Array.isArray(j.family) ? j.family : []);
      }
    } catch {}
  }, []);

  // autosave
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ name, birthdate, phone, address, family })
    );
  }, [name, birthdate, phone, address, family]);

  const resetForm = (preserveStatus = false) => {
    setName("");
    setBirthdate("");
    setPhone("");
    setAddress("");
    setFamily([]);
    if (!preserveStatus) setStatus("");
    localStorage.removeItem(STORAGE_KEY);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("");

    // validações rápidas
    if (name.trim().length < 3) return setStatus("Informe o nome completo.");
    if (!birthdate) return setStatus("Informe a data de nascimento.");
    if (phone.replace(/\D/g, "").length < 10)
      return setStatus("Telefone inválido.");
    if (address.trim().length < 5)
      return setStatus("Endereço muito curto.");

    setSubmitting(true);
    try {
      const res = await fetch("/api/member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primary: {
            name: name.trim(),
            birthdate,
            phone: phone.replace(/\D/g, ""),
            address: address.trim(),
          },
          family,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erro ao salvar");

      // sucesso → mensagem + limpar
      setStatus("Cadastro salvo com sucesso! Obrigado.");
      resetForm(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => setStatus(""), 5000);
    } catch (err: any) {
      setStatus("Falhou: " + (err?.message || "Erro desconhecido"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl p-4 md:p-6 space-y-6">
      {/* HEADER TEMÁTICO + AÇÃO ADMIN */}
      <header className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/80 backdrop-blur shadow-sm">
        <div className="absolute inset-0 opacity-90">
          <div className="h-full w-full bg-gradient-to-r from-indigo-600/10 via-sky-400/10 to-emerald-500/10" />
        </div>

        <div className="relative p-6 md:p-8">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 shrink-0 rounded-2xl bg-[var(--church-indigo)] text-white grid place-items-center shadow-md">
              ✝️
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                Cadastro de Membros — Igreja Palavra de Vida
              </h1>
              <p className="text-sm md:text-base text-slate-700 mt-1">
                “<em>Servi ao Senhor com alegria</em>” — atualize seus dados e
                de sua família com segurança.
              </p>
            </div>

            {/* Botão para Relatório (Admin) */}
            <div className="shrink-0">
              <Link
                href="/admin/relatorio"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50 transition"
                title="Acessar Relatório (Admin)"
                aria-label="Acessar Relatório de Aniversariantes (apenas administradores)"
              >
                <span role="img" aria-hidden>🔒</span>
                <span className="hidden sm:inline">Relatório (Admin)</span>
                <span className="sm:hidden">Relatório</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* STATUS */}
      {status && (
        <div
          role="status"
          aria-live="polite"
          className={`text-sm px-4 py-3 rounded-xl border ${
            status.startsWith("Cadastro salvo")
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : status.startsWith("Falhou")
              ? "bg-rose-50 text-rose-700 border-rose-200"
              : "bg-slate-50 text-slate-700 border-slate-200"
          }`}
        >
          {status}
        </div>
      )}

      {/* FORMULÁRIO */}
      <form onSubmit={submit} className="space-y-6">
        {/* DADOS PRINCIPAIS */}
        <section className="card p-6 md:p-8">
          <div className="mb-5 flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{
                background: "var(--church-emerald)",
                boxShadow: "0 0 0 8px rgba(16,185,129,.12)",
              }}
            />
            <h2 className="font-semibold text-slate-900">
              Dados do Membro Principal
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">
                Nome completo
              </span>
              <input
                placeholder="Ex.: João da Silva"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">
                Data de nascimento
              </span>
              <input
                type="date"
                value={birthdate}
                onChange={(e) => setBirthdate(e.target.value)}
                required
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">
                Telefone de contato
              </span>
              <input
                inputMode="tel"
                placeholder="(11) 99999-9999"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                maxLength={16}
                required
              />
              <small className="text-xs text-slate-500">
                Usado junto da data para localizar seu cadastro existente.
              </small>
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">
                Endereço completo
              </span>
              <input
                placeholder="Rua, número, bairro, cidade"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </label>
          </div>
        </section>

        {/* FAMILIARES (com título dentro do próprio componente) */}
        <section className="card p-6 md:p-8">
          <FamilyFieldset value={family} onChange={setFamily} />
        </section>

        {/* AÇÕES */}
        <div className="sticky bottom-4 z-10">
          <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200/70 bg-white/90 backdrop-blur shadow-lg p-3 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
            <div className="text-xs text-slate-600 px-1">
              Seu rascunho é salvo automaticamente neste dispositivo.
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => resetForm()}
                className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 transition"
              >
                Limpar formulário
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-white transition"
                style={{ background: "var(--church-indigo)" }}
              >
                {submitting ? (
                  <>
                    <span className="h-4 w-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                    Salvando…
                  </>
                ) : (
                  "Salvar cadastro"
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </main>
  );
}