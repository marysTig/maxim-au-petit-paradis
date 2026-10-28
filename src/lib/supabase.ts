import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabase environment variables missing. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/* ── Types mirroring Supabase tables ── */
export interface DbChild {
  id: string;
  first_name: string;
  last_name: string;
  birth_date: string | null;
  section: string;
  parent_ids: string[];
  allergies: string | null;
  notes: string | null;
  created_at?: string;
}

export interface DbParent {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  child_ids: string[];
  created_at?: string;
}

export interface DbAttendance {
  id: string;
  child_id: string;
  date: string;
  arrival: string | null;
  departure: string | null;
  created_at?: string;
}

export interface DbPayment {
  id: string;
  child_id: string;
  month: string;
  amount: number;
  status: "paid" | "pending" | "late";
  paid_at: string | null;
  created_at?: string;
}

export interface DbStaff {
  id: string;
  name: string;
  role: string | null;
  phone: string | null;
  email: string | null;
  section: string;
  hire_date: string | null;
  notes: string | null;
  created_at?: string;
}

export interface DbStaffAttendance {
  id: string;
  staff_id: string;
  date: string;
  arrival: string | null;
  departure: string | null;
  created_at?: string;
}

export interface DbMenu {
  id: string;
  week_start: string;
  day: number;
  breakfast: string | null;
  lunch: string | null;
  snack: string | null;
  created_at?: string;
}

export interface DbActivity {
  id: string;
  day: number;
  start_time: string | null;
  end_time: string | null;
  title: string;
  section: string;
  notes: string | null;
  created_at?: string;
}
