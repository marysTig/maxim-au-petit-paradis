/* App types + Supabase mappers for the Menus, Activités and Annonces (Espace Parent) modules. */

type Row = Record<string, unknown>;

const str = (v: unknown): string => (v as string | null | undefined) ?? "";
const nul = (v: string): string | null => (v === "" ? null : v);

export interface MenuDay {
  weekStart: string; // Monday, YYYY-MM-DD
  day: number; // 0 = lundi … 4 = vendredi
  breakfast: string;
  lunch: string;
  snack: string;
}

export interface Activity {
  id: string;
  day: number; // 0 = lundi … 4 = vendredi
  startTime: string;
  endTime: string;
  title: string;
  section: string;
  notes: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  date: string; // YYYY-MM-DD
  published: boolean;
}

export type FinanceKind = "recette" | "subvention" | "depense";

/** Financement entries are kept in localStorage, like Nanis and Sections. */
export interface FinanceEntry {
  id: string;
  kind: FinanceKind;
  label: string;
  amount: number;
  date: string; // YYYY-MM-DD
}

export function dbToMenu(r: Row): MenuDay {
  return {
    weekStart: str(r["week_start"]),
    day: Number(r["day"]),
    breakfast: str(r["breakfast"]),
    lunch: str(r["lunch"]),
    snack: str(r["snack"]),
  };
}
export function menuToDb(m: MenuDay) {
  return {
    id: `${m.weekStart}_${m.day}`,
    week_start: m.weekStart,
    day: m.day,
    breakfast: nul(m.breakfast),
    lunch: nul(m.lunch),
    snack: nul(m.snack),
  };
}

export function dbToActivity(r: Row): Activity {
  return {
    id: str(r["id"]),
    day: Number(r["day"]),
    startTime: str(r["start_time"]),
    endTime: str(r["end_time"]),
    title: str(r["title"]),
    section: str(r["section"]) || "Toutes",
    notes: str(r["notes"]),
  };
}
export function activityToDb(a: Activity) {
  return {
    id: a.id,
    day: a.day,
    start_time: nul(a.startTime),
    end_time: nul(a.endTime),
    title: a.title,
    section: a.section || "Toutes",
    notes: nul(a.notes),
  };
}

export function dbToAnnouncement(r: Row): Announcement {
  return {
    id: str(r["id"]),
    title: str(r["title"]),
    body: str(r["body"]),
    date: str(r["date"]),
    published: Boolean(r["published"]),
  };
}
export function announcementToDb(a: Announcement) {
  return {
    id: a.id,
    title: a.title,
    body: nul(a.body),
    date: a.date,
    published: a.published ?? false,
  };
}

/** One month's payment for a child. Stored in the existing `payments` table. */
export interface Payment {
  id: string;
  childId: string;
  month: string; // YYYY-MM
  amount: number;
  status: "paid" | "pending" | "late";
  paidAt: string; // YYYY-MM-DD, "" while unpaid
}

export function dbToPayment(r: Row): Payment {
  const status = str(r["status"]);
  return {
    id: str(r["id"]),
    childId: str(r["child_id"]),
    month: str(r["month"]),
    amount: Number(r["amount"] ?? 0),
    status: status === "paid" || status === "late" ? status : "pending",
    paidAt: str(r["paid_at"]),
  };
}
export function paymentToDb(p: Payment) {
  return {
    id: p.id,
    child_id: p.childId,
    month: p.month,
    amount: p.amount,
    status: p.status,
    paid_at: nul(p.paidAt),
  };
}
