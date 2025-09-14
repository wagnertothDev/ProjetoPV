// components/FamilyFieldset.tsx
"use client";
import { useEffect, useMemo, useState } from "react";

export type FamilyItem = { name: string; birthdate: string; relation: string };

type Props = {
  value?: FamilyItem[];
  onChange: (items: FamilyItem[]) => void;
};

const RELATIONS = ["Esposa(o)", "Filho(a)", "Outro"] as const;

function calcAge(isoDate: string): number | null {
  if (!isoDate) return null;
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age >= 0 && age < 130 ? age : null;
}

function emptyItem(prefill?: Partial<FamilyItem>): FamilyItem {
  return { name: "", birthdate: "", relation: "Filho(a)", ...prefill };
}

export default function FamilyFieldset({ value = [], onChange }: Props) {
  // estado interno
  const [items, setItems] = useState<FamilyItem[]>(value.length ? value : []);

  // sincroniza quando o prop `value` muda externamente
  useEffect(() => {
    const a = JSON.stringify(items);
    const b = JSON.stringify(value ?? []);
    if (a !== b) setItems(value ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(value)]);

  // propaga alterações
  const update = (next: FamilyItem[]) => {
    setItems(next);
    onChange(next);
  };

  const add = (prefill?: Partial<FamilyItem>) => update([...items, emptyItem(prefill)]);

  const remove = (i: number) => {
    const it = items[i];
    const hasData = !!(it?.name || it?.birthdate || (it?.relation && it.relation !== "Filho(a)"));
    if (hasData && !confirm("Remover este familiar? Essa ação não pode ser desfeita.")) return;
    const next = items.filter((_, idx) => idx !== i);
    update(next);
  };

  const edit = (i: number, key: keyof FamilyItem, val: string) => {
    const next = [...items];
    next[i] = { ...next[i], [key]: val };
    update(next);
  };

  // Mostra “Nenhum familiar” se todos vazios
  const hasAny = useMemo(
    () => items.some(it => it.name || it.birthdate || it.relation),
    [items]
  );

  return (
    <div className="space-y-4">
      {/* Cabeçalho e ações */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 shadow-[0_0_0_3px_rgba(99,102,241,0.2)]" />
          <h3 className="font-semibold text-slate-900">Familiares</h3>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => add({ relation: "Esposa(o)" })}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50 transition"
          >
            + Esposa(o)
          </button>
          <button
            type="button"
            onClick={() => add({ relation: "Filho(a)" })}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50 transition"
          >
            + Filho(a)
          </button>
          <button
            type="button"
            onClick={() => add()}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50 transition"
            aria-label="Adicionar familiar"
          >
            + Adicionar
          </button>
        </div>
      </div>

      {/* Lista */}
      {!hasAny ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-6 text-sm text-slate-500">
          Nenhum familiar adicionado.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((it, i) => {
            const age = calcAge(it.birthdate);

            return (
              <div
                key={i}
                className="group rounded-2xl border border-slate-200 bg-white shadow-sm p-3 md:p-4 transition hover:shadow-md"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
                  {/* Nome */}
                  <label className="space-y-1.5">
                    <span className="text-xs font-medium text-slate-600">Nome</span>
                    <input
                      className="w-full rounded-xl border border-slate-300/80 bg-slate-50/60 px-3 py-2 shadow-inner focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition"
                      placeholder="Ex.: Maria da Silva"
                      value={it.name}
                      onChange={(e) => edit(i, "name", e.target.value)}
                    />
                  </label>

                  {/* Data de nascimento + idade */}
                  <label className="space-y-1.5">
                    <span className="text-xs font-medium text-slate-600">Data de nascimento</span>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        className="w-full rounded-xl border border-slate-300/80 bg-slate-50/60 px-3 py-2 shadow-inner focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition"
                        value={it.birthdate}
                        onChange={(e) => edit(i, "birthdate", e.target.value)}
                      />
                      <div
                        className="min-w-[3.5rem] rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs grid place-items-center px-2"
                        aria-label={age !== null ? `Idade ${age} anos` : "Idade"}
                        title={age !== null ? `Idade: ${age}` : ""}
                      >
                        {age !== null ? `${age}a` : "—"}
                      </div>
                    </div>
                  </label>

                  {/* Relação */}
                  <label className="space-y-1.5">
                    <span className="text-xs font-medium text-slate-600">Relação</span>
                    <select
                      className="w-full rounded-xl border border-slate-300/80 bg-slate-50/60 px-3 py-2 shadow-inner focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition"
                      value={it.relation}
                      onChange={(e) => edit(i, "relation", e.target.value)}
                    >
                      {RELATIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </label>

                  {/* Remover */}
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => remove(i)}
                      className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 hover:bg-rose-100 active:scale-[0.98] transition"
                      aria-label={`Remover familiar ${it.name || i + 1}`}
                    >
                      Remover
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ajuda */}
      <p className="text-xs text-slate-500">
        Adicione esposa(o), filho(a), etc. — pode deixar vazio se não houver familiares para cadastrar agora.
      </p>
    </div>
  );
}
