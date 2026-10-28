export type PayStatus = "paid" | "pending" | "late";

export interface Report {
  sectionCounts: Record<string, number>;
  attendanceDays: number;
  attendanceRate: number;
  payments: Record<PayStatus, { count: number; total: number }>;
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

export function buildReport(input: {
  children: { id: string; section: string }[];
  attendance: { childId: string; date: string; arrival: string | null }[];
  payments: { childId: string; month: string; amount: number; status: PayStatus }[];
  month: string;
}): Report {
  const { children, attendance, payments, month } = input;

  const sectionCounts: Record<string, number> = {};
  for (const c of children) sectionCounts[c.section] = (sectionCounts[c.section] ?? 0) + 1;

  const arrivals = attendance.filter((a) => a.date.startsWith(month) && a.arrival);
  const attendanceDays = new Set(arrivals.map((a) => a.date)).size;
  const denominator = children.length * attendanceDays;
  const attendanceRate = denominator === 0 ? 0 : arrivals.length / denominator;

  const totals: Report["payments"] = {
    paid: { count: 0, total: 0 },
    pending: { count: 0, total: 0 },
    late: { count: 0, total: 0 },
  };
  for (const p of payments) {
    if (p.month !== month) continue;
    totals[p.status].count += 1;
    totals[p.status].total += p.amount;
  }

  return { sectionCounts, attendanceDays, attendanceRate, payments: totals };
}

function csvField(value: string | number): string {
  const s = String(value);
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function paymentsToCsv(
  rows: { childName: string; month: string; amount: number; status: string }[],
): string {
  const lines = ["Enfant;Mois;Montant;Statut"];
  for (const r of rows) {
    lines.push([r.childName, r.month, r.amount, r.status].map(csvField).join(";"));
  }
  return lines.join("\n");
}
