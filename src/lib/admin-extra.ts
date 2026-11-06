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

/** FinanceEntry stored in Supabase table `finance_entries`. */
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

/* ─────────────────────────────────────────────
   NANI PAYMENTS
   Paiements versés aux nounous, stockés dans `nani_payments`.
───────────────────────────────────────────── */

export type NaniPaymentStatut = "non_paye" | "partiel" | "paye";
export type NaniPaymentPeriode = "jour" | "semaine" | "mois";

export interface NaniPayment {
  id: string;
  naniId: string;

  /** 'jour' | 'semaine' | 'mois' */
  periodeType: NaniPaymentPeriode;
  /** Référence de la période : YYYY-MM pour mois, YYYY-MM-DD pour jour/semaine */
  periodeRef: string;

  /** Montant théorique à payer */
  montantDu: number;
  /** Montant réellement versé */
  montantVerse: number;

  /** Statut : 'non_paye' | 'partiel' | 'paye' */
  statut: NaniPaymentStatut;

  /** Remarque facultative */
  remarque: string;
  /** Date du versement YYYY-MM-DD (vide si non versé) */
  datePaiement: string;
}

export function dbToNaniPayment(r: Row): NaniPayment {
  const statut = str(r["statut"]);
  return {
    id: str(r["id"]),
    naniId: str(r["nani_id"]),
    periodeType: (str(r["periode_type"]) as NaniPaymentPeriode) || "mois",
    periodeRef: str(r["periode_ref"]),
    montantDu: Number(r["montant_du"] ?? 0),
    montantVerse: Number(r["montant_verse"] ?? 0),
    statut: (statut === "partiel" || statut === "paye" ? statut : "non_paye") as NaniPaymentStatut,
    remarque: str(r["remarque"]),
    datePaiement: str(r["date_paiement"]),
  };
}

export function naniPaymentToDb(p: NaniPayment) {
  return {
    id: p.id,
    nani_id: p.naniId,
    periode_type: p.periodeType,
    periode_ref: p.periodeRef,
    montant_du: p.montantDu,
    montant_verse: p.montantVerse,
    statut: p.statut,
    remarque: nul(p.remarque),
    date_paiement: nul(p.datePaiement),
  };
}
