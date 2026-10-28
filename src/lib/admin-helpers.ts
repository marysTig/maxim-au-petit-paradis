import type { FinanceEntry, FinanceKind } from "./admin-extra";

export type DayStatus = "present" | "absent";

export interface Report {
  childCount: number;
  sectionCounts: Record<string, number>;
  naniPresentDays: number;
  naniAbsentDays: number;
  finance: Record<FinanceKind, number>;
  balance: number;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Local-time YYYY-MM-DD (never UTC, unlike toISOString). */
export function localDateStr(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parseLocal(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y as number, (m as number) - 1, d as number);
}

export function addDays(dateStr: string, n: number): string {
  const d = parseLocal(dateStr);
  d.setDate(d.getDate() + n);
  return localDateStr(d);
}

/** Monday of the week containing d, as local YYYY-MM-DD. */
export function weekStartOf(d: Date): string {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const offset = (copy.getDay() + 6) % 7; // Monday = 0
  copy.setDate(copy.getDate() - offset);
  return localDateStr(copy);
}

/**
 * Monthly report. `presences` uses the Nanis storage shape:
 * "naniId::YYYY-MM" -> { "YYYY-MM-DD": "present" | "absent" }.
 */
export function buildReport(input: {
  children: { section: string }[];
  presences: Record<string, Record<string, DayStatus>>;
  finance: Pick<FinanceEntry, "kind" | "amount" | "date">[];
  month: string;
}): Report {
  const { children, presences, finance, month } = input;

  const sectionCounts: Record<string, number> = {};
  for (const c of children) sectionCounts[c.section] = (sectionCounts[c.section] ?? 0) + 1;

  let naniPresentDays = 0;
  let naniAbsentDays = 0;
  for (const [key, days] of Object.entries(presences)) {
    if (!key.endsWith(`::${month}`)) continue;
    for (const status of Object.values(days)) {
      if (status === "present") naniPresentDays += 1;
      else if (status === "absent") naniAbsentDays += 1;
    }
  }

  const totals: Record<FinanceKind, number> = { recette: 0, subvention: 0, depense: 0 };
  for (const e of finance) {
    if (!e.date.startsWith(month)) continue;
    totals[e.kind] += e.amount;
  }

  return {
    childCount: children.length,
    sectionCounts,
    naniPresentDays,
    naniAbsentDays,
    finance: totals,
    balance: totals.recette + totals.subvention - totals.depense,
  };
}

function csvField(value: string | number): string {
  const s = String(value);
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const KIND_LABEL: Record<FinanceKind, string> = {
  recette: "Recette",
  subvention: "Subvention",
  depense: "Dépense",
};

export function financeToCsv(rows: Pick<FinanceEntry, "date" | "kind" | "label" | "amount">[]): string {
  const lines = ["Date;Type;Libellé;Montant"];
  for (const r of rows) {
    lines.push([r.date, KIND_LABEL[r.kind], r.label, r.amount].map(csvField).join(";"));
  }
  return lines.join("\n");
}
