// app/admin/relatorio/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import { isAdmin } from '@/lib/isAdmin';
import { Download, Search, Calendar, Printer, LogOut } from 'lucide-react';

// ... (type Item e MONTHS iguais aos seus)

type Item = {
  id: string;
  name: string;
  birthdate: string;
  birth_day: number;
  is_primary: boolean;
  relation?: string | null;
  phone?: string | null;
  address?: string | null;
};

const MONTHS = [
  '01 • Janeiro', '02 • Fevereiro', '03 • Março', '04 • Abril',
  '05 • Maio', '06 • Junho', '07 • Julho', '08 • Agosto',
  '09 • Setembro', '10 • Outubro', '11 • Novembro', '12 • Dezembro',
];

export default function RelatorioPage() {
  const router = useRouter();
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [items, setItems] = useState<Item[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Guarda de rota (login + allowlist)
  useEffect(() => {
    let mounted = true;
    (async () => {
      const supabase = supabaseBrowser();
      const { data } = await supabase.auth.getUser();
      const email = data.user?.email ?? null;
      if (!mounted) return;

      if (!email || !isAdmin(email)) {
        // manda para login; já preenche o e-mail se houver
        const q = email ? `?email=${encodeURIComponent(email)}` : "";
        router.replace(`/login${q}`);
        return;
      }
      setUserEmail(email);
    })();
    return () => { mounted = false; };
  }, [router]);

  // Carrega dados após passar na guarda
  useEffect(() => {
    if (!userEmail) return; // só busca quando o usuário está autorizado
    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setMsg('');
        const supabase = supabaseBrowser();
        const { data: session } = await supabase.auth.getSession();
        const token = session.session?.access_token;
        const res = await fetch(`/api/birthdays?month=${month}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: ac.signal,
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'Erro ao carregar');
        setItems(json.items || []);
      } catch (e: any) {
        if (e?.name === 'AbortError') return;
        setMsg(e.message || 'Falha ao carregar');
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [month, userEmail]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => it.name.toLowerCase().includes(q));
  }, [items, query]);

  const exportCsv = () => {
    const header = ['Dia', 'Nome', 'Relação', 'Telefone', 'Endereço'];
    const rows = filtered.map((it) => [
      String(it.birth_day).padStart(2, '0'),
      it.name,
      it.is_primary ? 'Membro' : (it.relation || ''),
      it.phone || '-',
      it.address || '-',
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => '"' + (c ?? '').toString().replaceAll('"', '""') + '"').join(';'))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aniversariantes-${String(month).padStart(2, '0')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printPage = () => window.print();

  const signOut = async () => {
    const supabase = supabaseBrowser();
    await supabase.auth.signOut();
    router.replace("/login");
  };

  // Enquanto decide (sem userEmail) mostra skeleton do header
  if (!userEmail) {
    return (
      <main className="mx-auto max-w-6xl p-4 md:p-6 space-y-6">
        <div className="h-32 rounded-3xl bg-slate-100 animate-pulse" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl p-4 md:p-6 space-y-6 print:p-0">
      {/* HEADER */}
      <header className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/80 backdrop-blur shadow-sm print:border-0 print:rounded-none print:shadow-none">
        <div className="absolute inset-0 opacity-90 print:hidden">
          <div className="h-full w-full bg-gradient-to-r from-indigo-600/10 via-sky-400/10 to-emerald-500/10" />
        </div>
        <div className="relative p-6 md:p-8 flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 shrink-0 rounded-2xl bg-[var(--church-indigo)] text-white grid place-items-center shadow-md">
              <Calendar size={20} />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                Relatório de Aniversariantes
              </h1>
              <p className="text-sm md:text-base text-slate-700 mt-1">
                Selecione o mês, filtre por nome e exporte ou imprima a lista.
              </p>
            </div>

            {/* Usuário + Sair */}
            <div className="print:hidden flex items-center gap-2">
              <span className="text-sm text-slate-600 hidden sm:inline">{userEmail}</span>
              <button
                onClick={signOut}
                title="Sair"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 transition"
              >
                <LogOut size={16}/> Sair
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-3">
              <label className="inline-flex items-center gap-2">
                <span className="text-sm text-slate-700">Mês</span>
                <select
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2"
                  value={month}
                  onChange={(e)=>setMonth(Number(e.target.value))}
                  aria-label="Selecionar mês"
                >
                  {MONTHS.map((label, idx) => {
                    const m = idx + 1;
                    return (
                      <option key={m} value={m}>{label}</option>
                    );
                  })}
                </select>
              </label>

              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-slate-500" size={16}/>
                <input
                  className="rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2 w-72"
                  placeholder="Buscar por nome"
                  value={query}
                  onChange={e=>setQuery(e.target.value)}
                  aria-label="Buscar por nome"
                />
              </div>
            </div>

            {/* Ações */}
            <div className="flex gap-2 print:hidden">
              <button
                onClick={exportCsv}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 transition"
              >
                <Download size={16}/> Exportar CSV
              </button>
              <button
                onClick={printPage}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-white transition"
                style={{ background: "var(--church-indigo)" }}
              >
                <Printer size={16}/> Imprimir
              </button>
            </div>
          </div>
        </div>
      </header>

      {msg && (
        <div className="text-sm px-4 py-3 rounded-xl border bg-rose-50 text-rose-700 border-rose-200">
          {msg}
        </div>
      )}

      {loading && (
        <div className="space-y-2 print:hidden">
          {Array.from({length:6}).map((_,i)=>(
            <div key={i} className="h-11 animate-pulse bg-slate-100 rounded-xl" />
          ))}
        </div>
      )}

      {!loading && (
        <section className="card overflow-auto print:shadow-none print:border-0 print:rounded-none">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-600">
              Nenhum aniversariante para este mês / filtro.
            </div>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-slate-700">
                  <th className="text-left p-3">Dia</th>
                  <th className="text-left p-3">Nome</th>
                  <th className="text-left p-3">Relação</th>
                  <th className="text-left p-3">Telefone</th>
                  <th className="text-left p-3">Endereço</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((it)=> (
                  <tr key={it.id} className="border-t border-slate-200/80 hover:bg-slate-50">
                    <td className="p-3 font-medium text-slate-900">{String(it.birth_day).padStart(2,'0')}</td>
                    <td className="p-3">{it.name}</td>
                    <td className="p-3">{it.is_primary ? 'Membro' : (it.relation || '')}</td>
                    <td className="p-3">{it.phone || '-'}</td>
                    <td className="p-3">{it.address || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}
    </main>
  );
}
