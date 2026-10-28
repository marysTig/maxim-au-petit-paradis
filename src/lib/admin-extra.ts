/* App types + Supabase mappers for the Personnel, Menus and Activités modules. */

type Row = Record<string, unknown>;

const str = (v: unknown): string => (v as string | null | undefined) ?? "";
const nul = (v: string): string | null => (v === "" ? null : v);

export interface Staff {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  section: string;
  hireDate: string;
  notes: string;
}

export interface StaffAttendance {
  staffId: string;
  date: string; // YYYY-MM-DD
  arrival: string | null;
  departure: string | null;
}

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

export function dbToStaff(r: Row): Staff {
  return {
    id: str(r["id"]),
    name: str(r["name"]),
    role: str(r["role"]),
    phone: str(r["phone"]),
    email: str(r["email"]),
    section: str(r["section"]) || "Toutes",
    hireDate: str(r["hire_date"]),
    notes: str(r["notes"]),
  };
}
export function staffToDb(s: Staff) {
  return {
    id: s.id,
    name: s.name,
    role: nul(s.role),
    phone: nul(s.phone),
    email: nul(s.email),
    section: s.section || "Toutes",
    hire_date: nul(s.hireDate),
    notes: nul(s.notes),
  };
}

export function dbToStaffAttendance(r: Row): StaffAttendance {
  return {
    staffId: str(r["staff_id"]),
    date: str(r["date"]),
    arrival: (r["arrival"] as string | null) ?? null,
    departure: (r["departure"] as string | null) ?? null,
  };
}
export function staffAttendanceToDb(a: StaffAttendance) {
  return {
    id: `${a.staffId}_${a.date}`,
    staff_id: a.staffId,
    date: a.date,
    arrival: a.arrival ?? null,
    departure: a.departure ?? null,
  };
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
