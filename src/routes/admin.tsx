import { createFileRoute, redirect } from "@tanstack/react-router";
import { AUTH_KEY } from "./accullie";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import {
  Users,
  Baby,
  LogOut,
  Plus,
  X,
  Check,
  ChevronRight,
  ArrowLeft,
  Phone,
  MessageCircle,
  Heart,
  Layers,
  Home,
  TrendingUp,
  AlertCircle,
  Eye,
  Pencil,
  UtensilsCrossed,
  CalendarDays,
  BarChart3,
  CreditCard,
  Settings,
} from "lucide-react";
import { EmptyState, ErrorBanner } from "../components/admin/ui";
import { PaymentModal, isPaidFor, thisMonth } from "../components/admin/PaymentModal";
import { MenusSection } from "../components/admin/MenusSection";
import { ActivitiesSection } from "../components/admin/ActivitiesSection";
import { ReportsSection } from "../components/admin/ReportsSection";
import { FinanceSection } from "../components/admin/FinanceSection";
import { SettingsSection } from "../components/admin/SettingsSection";
import { EspaceParentSection } from "../components/admin/EspaceParentSection";
import { PaymentGridSection } from "../components/admin/PaymentGridSection";
import {
  activityToDb,
  announcementToDb,
  dbToActivity,
  dbToAnnouncement,
  dbToMenu,
  dbToPayment,
  menuToDb,
  paymentToDb,
  type Activity,
  type Announcement,
  type FinanceEntry,
  type MenuDay,
  type Payment,
} from "../lib/admin-extra";

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
/** Calcule l'âge exact à partir d'une date "YYYY-MM-DD". Retourne null si absent. */
function calcAge(birthDate: string): number | null {
  if (!birthDate) return null;
  const parts = birthDate.split("-");
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (!y || !m || !d) return null;
  const now = new Date();
  let a = now.getFullYear() - y;
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) a--;
  return a >= 0 ? a : null;
}

/** Calcule l'âge en mois (pour les bébés < 1 an). */
function calcMonths(birthDate: string): number {
  const parts = birthDate.split("-");
  const m = Number(parts[1] ?? 1);
  const d = Number(parts[2] ?? 1);
  const y = Number(parts[0] ?? 0);
  const now = new Date();
  let months = (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m);
  if (now.getDate() < d) months--;
  return Math.max(0, months);
}

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
interface Parent {
  id: string;
  name: string;
  phone: string;
  email: string;
  childIds: string[];
}

interface AuthorizedPerson {
  name: string;
  firstName: string;
  phone: string;
}

interface Child {
  id: string;
  // Identification
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: "Garçon" | "Fille" | "";
  nationality: string;
  section: string;
  group: string;
  // Famille
  motherName: string;
  motherProfession: string;
  motherPhone: string;
  fatherName: string;
  fatherProfession: string;
  fatherPhone: string;
  siblingsCount: number;
  familySituation: "Marié(e)" | "Divorcé(e)" | "Veuf(ve)" | "";
  authorizedPersons: AuthorizedPerson[];
  // Extra
  parentIds: string[];
  allergies: string;
  notes: string;
  active: boolean;
}

type Section =
  | "children"
  | "profile"
  | "parents"
  | "nanis"
  | "sections"
  | "menus"
  | "activities"
  | "reports"
  | "espace-parent"
  | "paiement"
  | "financement"
  | "parametres";

interface SectionGroup {
  id: string;
  name: string;
}

interface CrecheSection {
  id: string;
  name: string;
  groups: SectionGroup[];
}

interface Nani {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  group: string;
}

// Clé externe : "naniId::YYYY-MM" → objet { "YYYY-MM-DD": "present" | "absent" }
type DayStatus = "present" | "absent";
type NaniPresences = Record<string, Record<string, DayStatus>>;

/* ─────────────────────────────────────────────
   ROUTE
───────────────────────────────────────────── */
export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Dashboard Admin — Maxim au Petit Paradis" },
      { name: "robots", content: "noindex" },
    ],
  }),
  beforeLoad: () => {
    // On the server (SSR), sessionStorage doesn't exist → always redirect to login.
    // On the client, redirect if the auth flag is missing.
    const isAuthenticated =
      typeof sessionStorage !== "undefined" &&
      sessionStorage.getItem(AUTH_KEY) === "true";
    if (!isAuthenticated) {
      throw redirect({ to: "/accullie" });
    }
  },
  component: AdminDashboard,
});

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}



/* ─────────────────────────────────────────────
   STYLES SHARED
───────────────────────────────────────────── */
const card: React.CSSProperties = {
  background: "oklch(1 0 0 / .72)",
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  border: "2px solid oklch(1 0 0 / .85)",
  borderRadius: "1.5rem",
  boxShadow: "0 6px 32px -8px oklch(0 0 0 / .12)",
  padding: "1.5rem",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.6rem 0.9rem",
  borderRadius: "0.75rem",
  border: "1.5px solid oklch(0.80 0.07 260 / .5)",
  background: "oklch(0.98 0.01 260 / .7)",
  fontSize: "0.9rem",
  color: "oklch(0.25 0.05 260)",
  outline: "none",
  boxSizing: "border-box" as const,
  fontFamily: "var(--font-sans)",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.75rem",
  fontWeight: 600,
  color: "oklch(0.45 0.08 260)",
  marginBottom: "0.3rem",
  letterSpacing: "0.04em",
  textTransform: "uppercase" as const,
};

const badge = (color: string): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  gap: "0.3rem",
  padding: "0.2rem 0.65rem",
  borderRadius: "9999px",
  fontSize: "0.75rem",
  fontWeight: 700,
  background: color,
  color: "#fff",
  fontFamily: "var(--font-display)",
  letterSpacing: "0.03em",
});

/* ─────────────────────────────────────────────
   SUPABASE ↔ APP MAPPERS
───────────────────────────────────────────── */
// DB (snake_case) → App (camelCase)
function dbToChild(r: Record<string, unknown>): Child {
  return {
    id: r.id as string,
    firstName: r.first_name as string,
    lastName: r.last_name as string,
    birthDate: (r.birth_date as string) ?? "",
    gender: ((r.gender as string) ?? "") as Child["gender"],
    nationality: (r.nationality as string) ?? "",
    section: (r.section as string) ?? "Bébés",
    group: (r.group as string) ?? "",
    motherName: (r.mother_name as string) ?? "",
    motherProfession: (r.mother_profession as string) ?? "",
    motherPhone: (r.mother_phone as string) ?? "",
    fatherName: (r.father_name as string) ?? "",
    fatherProfession: (r.father_profession as string) ?? "",
    fatherPhone: (r.father_phone as string) ?? "",
    siblingsCount: Number(r.siblings_count ?? 0),
    familySituation: ((r.family_situation as string) ?? "") as Child["familySituation"],
    authorizedPersons: (r.authorized_persons as AuthorizedPerson[]) ?? [],
    parentIds: (r.parent_ids as string[]) ?? [],
    allergies: (r.allergies as string) ?? "",
    notes: (r.notes as string) ?? "",
    active: r.active !== false, // default true for backward-compat
  };
}
function childToDb(c: Child) {
  return {
    id: c.id,
    first_name: c.firstName,
    last_name: c.lastName,
    birth_date: c.birthDate || null,
    gender: c.gender || null,
    nationality: c.nationality || null,
    section: c.section,
    group: c.group || null,
    mother_name: c.motherName || null,
    mother_profession: c.motherProfession || null,
    mother_phone: c.motherPhone || null,
    father_name: c.fatherName || null,
    father_profession: c.fatherProfession || null,
    father_phone: c.fatherPhone || null,
    siblings_count: c.siblingsCount,
    family_situation: c.familySituation || null,
    authorized_persons: c.authorizedPersons,
    parent_ids: c.parentIds,
    allergies: c.allergies || null,
    notes: c.notes || null,
    active: c.active,
  };
}

function dbToParent(r: Record<string, unknown>): Parent {
  return {
    id: r.id as string,
    name: r.name as string,
    phone: (r.phone as string) ?? "",
    email: (r.email as string) ?? "",
    childIds: (r.child_ids as string[]) ?? [],
  };
}
function parentToDb(p: Parent) {
  return {
    id: p.id,
    name: p.name,
    phone: p.phone || null,
    email: p.email || null,
    child_ids: p.childIds,
  };
}





/* ─────────────────────────────────────────────
   MAIN DASHBOARD
───────────────────────────────────────────── */
function AdminDashboard() {
  const [section, setSection] = useState<Section>("children");
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [children, setChildren] = useState<Child[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [writeError, setWriteError] = useState<string | null>(null);

  /* -- Menus, Activités, Annonces (Supabase) -- */
  const [menus, setMenus] = useState<MenuDay[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [extrasMissing, setExtrasMissing] = useState(false);

  /* -- Paiements des enfants (Supabase, table `payments`) -- */
  const [payments, setPayments] = useState<Payment[]>([]);

  /* -- Financement (localStorage) -- */
  const [finance, setFinance] = useState<FinanceEntry[]>(() => {
    try {
      const saved = localStorage.getItem("creche_finance");
      return saved ? (JSON.parse(saved) as FinanceEntry[]) : [];
    } catch { return []; }
  });

  function saveFinance(updated: FinanceEntry[]) {
    setFinance(updated);
    localStorage.setItem("creche_finance", JSON.stringify(updated));
  }

  /* -- Sections & groupes (localStorage) -- */
  const [crecheSections, setCrecheSections] = useState<CrecheSection[]>(() => {
    try {
      const saved = localStorage.getItem("creche_sections");
      return saved ? (JSON.parse(saved) as CrecheSection[]) : [];
    } catch { return []; }
  });

  function saveSections(updated: CrecheSection[]) {
    setCrecheSections(updated);
    localStorage.setItem("creche_sections", JSON.stringify(updated));
  }

  /* -- Nanis (localStorage) -- */
  const [nanis, setNanis] = useState<Nani[]>(() => {
    try {
      const saved = localStorage.getItem("creche_nanis");
      return saved ? (JSON.parse(saved) as Nani[]) : [];
    } catch { return []; }
  });

  function saveNanis(updated: Nani[]) {
    setNanis(updated);
    localStorage.setItem("creche_nanis", JSON.stringify(updated));
  }

  /* -- Présences nanis (localStorage) -- */
  const [naniPresences, setNaniPresences] = useState<NaniPresences>(() => {
    try {
      const saved = localStorage.getItem("creche_nani_presences");
      return saved ? (JSON.parse(saved) as NaniPresences) : {};
    } catch { return {}; }
  });

  function saveNaniPresences(updated: NaniPresences) {
    setNaniPresences(updated);
    localStorage.setItem("creche_nani_presences", JSON.stringify(updated));
  }

  /* ── Initial load from Supabase ── */
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setDbError(null);
    try {
      const [c, p] = await Promise.all([
        supabase.from("children").select("*").order("created_at"),
        supabase.from("parents").select("*").order("created_at"),
      ]);
      if (c.error) throw c.error;
      if (p.error) throw p.error;
      setChildren((c.data ?? []).map(r => dbToChild(r as Record<string, unknown>)));
      setParents((p.data ?? []).map(r => dbToParent(r as Record<string, unknown>)));
    } catch (err) {
      console.error("Supabase load error:", err);
      setDbError("Impossible de charger les données. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── Menus / Activités / Annonces: loaded separately so a missing table never blocks the admin ── */
  const fetchExtras = useCallback(async () => {
    const [m, a, n] = await Promise.all([
      supabase.from("menus").select("*"),
      supabase.from("activities").select("*").order("created_at"),
      supabase.from("announcements").select("*").order("created_at"),
    ]);
    if (!m.error) setMenus((m.data ?? []).map((r) => dbToMenu(r as Record<string, unknown>)));
    if (!a.error) setActivities((a.data ?? []).map((r) => dbToActivity(r as Record<string, unknown>)));
    if (!n.error) setAnnouncements((n.data ?? []).map((r) => dbToAnnouncement(r as Record<string, unknown>)));
    const failed = m.error ?? a.error ?? n.error;
    if (failed) console.error("Supabase extras load error:", failed);
    setExtrasMissing(Boolean(failed));
  }, []);

  /* ── Paiements: chargés à part pour qu'un souci ici ne bloque pas le reste ── */
  const fetchPayments = useCallback(async () => {
    const { data, error } = await supabase.from("payments").select("*");
    if (error) {
      console.error("Supabase payments load error:", error);
      return;
    }
    setPayments((data ?? []).map((r) => dbToPayment(r as Record<string, unknown>)));
  }, []);

  useEffect(() => { fetchAll(); fetchExtras(); fetchPayments(); }, [fetchAll, fetchExtras, fetchPayments]);

  /* ── Write errors surfaced to the user ── */
  function reportWrite(label: string, error: unknown) {
    console.error(`Supabase write error (${label}):`, error);
    setWriteError(`Échec de l'enregistrement (${label}). Vos modifications peuvent être perdues.`);
  }

  /* ── Sync helpers (upsert / delete) ── */
  async function upsertChild(child: Child) {
    const { error } = await supabase.from("children").upsert(childToDb(child));
    if (error) reportWrite("enfant", error);
  }
  async function deleteChildDb(id: string) {
    const { error } = await supabase.from("children").delete().eq("id", id);
    if (error) reportWrite("suppression enfant", error);
  }
  async function upsertParent(parent: Parent) {
    const { error } = await supabase.from("parents").upsert(parentToDb(parent));
    if (error) reportWrite("parent", error);
  }
  async function deleteParentDb(id: string) {
    const { error } = await supabase.from("parents").delete().eq("id", id);
    if (error) reportWrite("suppression parent", error);
  }
  function recordPayment(p: Payment) {
    setPayments((prev) => [...prev.filter((x) => x.id !== p.id), p]);
    supabase
      .from("payments")
      .upsert(paymentToDb(p))
      .then(({ error }) => {
        if (error) reportWrite("paiement", error);
      });
  }
  async function upsertMenu(m: MenuDay) {
    const { error } = await supabase.from("menus").upsert(menuToDb(m), { onConflict: "week_start,day" });
    if (error) reportWrite("menu", error);
  }
  async function upsertActivity(a: Activity) {
    const { error } = await supabase.from("activities").upsert(activityToDb(a));
    if (error) reportWrite("activité", error);
  }
  async function deleteActivityDb(id: string) {
    const { error } = await supabase.from("activities").delete().eq("id", id);
    if (error) reportWrite("suppression activité", error);
  }
  async function upsertAnnouncement(a: Announcement) {
    const { error } = await supabase.from("announcements").upsert(announcementToDb(a));
    if (error) reportWrite("annonce", error);
  }
  async function deleteAnnouncementDb(id: string) {
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) reportWrite("suppression annonce", error);
  }

  /* ── Lien enfant ↔ parent: un parent rattaché à un enfant met à jour l'enfant aussi ── */
  function changeChildLink(childId: string, parentId: string, linked: boolean) {
    const child = children.find((c) => c.id === childId);
    if (!child || child.parentIds.includes(parentId) === linked) return;
    const updated: Child = {
      ...child,
      parentIds: linked ? [...child.parentIds, parentId] : child.parentIds.filter((p) => p !== parentId),
    };
    setChildren((prev) => prev.map((c) => (c.id === childId ? updated : c)));
    upsertChild(updated);
  }
  function removeParentCascade(id: string) {
    children.filter((c) => c.parentIds.includes(id)).forEach((c) => changeChildLink(c.id, id, false));
    deleteParentDb(id);
  }



  function logout() {
    sessionStorage.removeItem(AUTH_KEY);
    window.location.href = "/accullie";
  }

  function openProfile(child: Child) {
    setSelectedChild(child);
    setSection("profile");
    setSidebarOpen(false);
  }

  function navTo(s: Section) {
    if (s !== "profile") setSelectedChild(null);
    setSection(s);
    setSidebarOpen(false);
  }

  const navItems: { id: Section; label: string; icon: React.ReactNode }[] = [
    { id: "children", label: "Enfants", icon: <Baby size={20} /> },
    { id: "nanis", label: "Nanis", icon: <Heart size={20} /> },
    { id: "sections", label: "Section & Groupe", icon: <Layers size={20} /> },
    { id: "espace-parent", label: "Espace Parent", icon: <Home size={20} /> },
    { id: "reports", label: "Rapports", icon: <BarChart3 size={20} /> },
    { id: "paiement", label: "Paiements", icon: <CreditCard size={20} /> },
    { id: "financement", label: "Financement", icon: <TrendingUp size={20} /> },
    { id: "parametres", label: "Paramètres", icon: <Settings size={20} /> },
  ];


  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background:
          "linear-gradient(160deg, oklch(0.88 0.07 240) 0%, oklch(0.94 0.04 270) 50%, oklch(0.92 0.06 200) 100%)",
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* ── SIDEBAR ── */}
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "oklch(0 0 0 / .35)",
            zIndex: 30,
          }}
        />
      )}

      <aside
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          width: "230px",
          background: "oklch(0.22 0.06 270 / .97)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          display: "flex",
          flexDirection: "column",
          padding: "1.5rem 1rem",
          zIndex: 40,
          transition: "transform .28s ease",
          transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
          boxShadow: "4px 0 24px oklch(0 0 0 / .18)",
        }}
        // Desktop always visible via CSS below
        className="admin-sidebar"
      >
        {/* Logo */}
        <div style={{ marginBottom: "2rem", paddingLeft: "0.4rem" }}>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.15rem",
              fontWeight: 700,
              color: "oklch(0.96 0.04 260)",
              lineHeight: 1.2,
            }}
          >
            🌈 Maxim
          </div>
          <div
            style={{ fontSize: "0.75rem", color: "oklch(0.65 0.07 260)", marginTop: "0.15rem" }}
          >
            Espace Administrateur
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navTo(item.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.65rem 0.85rem",
                borderRadius: "0.9rem",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                fontSize: "0.9rem",
                fontWeight: section === item.id ? 700 : 500,
                color:
                  section === item.id
                    ? "#fff"
                    : "oklch(0.72 0.06 260)",
                background:
                  section === item.id
                    ? "linear-gradient(135deg, oklch(0.60 0.22 310), oklch(0.52 0.22 260))"
                    : "transparent",
                transition: "background .18s, color .18s",
                textAlign: "left",
              }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* Stats summary */}
        <div
          style={{
            background: "oklch(1 0 0 / .07)",
            borderRadius: "0.85rem",
            padding: "0.75rem",
            marginBottom: "1rem",
            fontSize: "0.78rem",
            color: "oklch(0.65 0.07 260)",
          }}
        >
          <div style={{ marginBottom: "0.3rem" }}>
            👶 {children.length} enfant{children.length > 1 ? "s" : ""}
          </div>
          <div>
            👨‍👩‍👧 {parents.length} parent{parents.length > 1 ? "s" : ""}
          </div>

        </div>

        {/* Logout */}
        <button
          id="logout-btn"
          onClick={logout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            padding: "0.6rem 0.85rem",
            borderRadius: "0.9rem",
            border: "none",
            cursor: "pointer",
            background: "oklch(0.577 0.245 27 / .15)",
            color: "oklch(0.80 0.18 27)",
            fontSize: "0.88rem",
            fontWeight: 600,
            fontFamily: "var(--font-sans)",
          }}
        >
          <LogOut size={16} />
          Se déconnecter
        </button>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main
        style={{
          flex: 1,
          padding: "1.5rem",
          overflowY: "auto",
          minHeight: "100vh",
        }}
        className="admin-main"
      >
        {/* Mobile top bar */}
        <div
          className="admin-topbar"
          style={{
            display: "none",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1.25rem",
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              background: "oklch(1 0 0 / .7)",
              border: "1.5px solid oklch(1 0 0 / .9)",
              borderRadius: "0.75rem",
              padding: "0.4rem 0.7rem",
              cursor: "pointer",
              fontSize: "1.2rem",
            }}
          >
            ☰
          </button>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "1rem",
              background: "linear-gradient(135deg, oklch(0.60 0.22 310), oklch(0.52 0.22 260))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            🌈 Maxim Admin
          </span>
          <div style={{ width: "40px" }} />
        </div>

        {/* Loading state */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: "1rem" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", border: "4px solid oklch(0.85 0.08 260)", borderTopColor: "oklch(0.55 0.22 260)", animation: "spin 0.8s linear infinite" }} />
            <p style={{ color: "oklch(0.45 0.10 260)", fontFamily: "var(--font-display)", fontWeight: 600 }}>Chargement…</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Error state */}
        {dbError && !loading && (
          <div style={{ ...card, textAlign: "center", padding: "2.5rem", maxWidth: "480px", margin: "4rem auto" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>⚠️</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.1rem", color: "oklch(0.45 0.18 27)", marginBottom: "0.5rem" }}>
              Erreur de connexion Supabase
            </div>
            <p style={{ fontSize: "0.88rem", color: "oklch(0.55 0.07 260)", marginBottom: "1.25rem" }}>{dbError}</p>
            <button onClick={fetchAll} style={{ padding: "0.6rem 1.5rem", borderRadius: "9999px", border: "none", background: "linear-gradient(135deg, oklch(0.60 0.22 310), oklch(0.52 0.22 260))", color: "#fff", fontWeight: 700, cursor: "pointer" }}>
              Réessayer
            </button>
          </div>
        )}

        {writeError && !loading && !dbError && (
          <ErrorBanner message={writeError} onClose={() => setWriteError(null)} />
        )}

        {extrasMissing && !loading && !dbError && section === "espace-parent" && (
          <div style={{ ...card, marginBottom: "1rem", fontSize: "0.88rem", color: "oklch(0.45 0.10 270)" }}>
            ℹ️ Les tables Menus / Activités / Annonces n'existent pas encore. Exécutez{" "}
            <code>supabase_schema.sql</code> dans Supabase → SQL Editor, puis rechargez la page.
          </div>
        )}

        {/* Sections */}
        {!loading && !dbError && section === "children" && (
          <ChildrenSection
            children={children}
            setChildren={setChildren}
            parents={parents}
            setParents={setParents}
            onViewProfile={openProfile}
            onChildAdded={upsertChild}
            onChildRemoved={deleteChildDb}
            onParentAdded={upsertParent}
            payments={payments}
            onPay={recordPayment}
            crecheSections={crecheSections}
          />
        )}
        {!loading && !dbError && section === "profile" && selectedChild && (
          <ChildProfile
            child={selectedChild}
            parents={parents}
            onBack={() => navTo("children")}
          />
        )}
        {!loading && !dbError && section === "nanis" && (
          <NanisSection
            nanis={nanis}
            onSaveNanis={saveNanis}
            presences={naniPresences}
            onSavePresences={saveNaniPresences}
            crecheSections={crecheSections}
          />
        )}
        {!loading && !dbError && section === "sections" && (
          <SectionsSection
            crecheSections={crecheSections}
            onSave={saveSections}
          />
        )}

        {!loading && !dbError && section === "reports" && (
          <ReportsSection
            children={children}
            parentsCount={parents.length}
            nanisCount={nanis.length}
            presences={naniPresences}
          />
        )}
        {!loading && !dbError && section === "espace-parent" && (
          <EspaceParentSection
            announcements={announcements}
            setAnnouncements={setAnnouncements}
            onAnnouncementUpsert={upsertAnnouncement}
            onAnnouncementDelete={deleteAnnouncementDb}
          />
        )}
        {!loading && !dbError && section === "paiement" && (
          <PaymentGridSection
            children={children}
            payments={payments}
            onRecord={recordPayment}
          />
        )}
        {!loading && !dbError && section === "financement" && (
          <FinanceSection entries={finance} onSave={saveFinance} />
        )}
        {!loading && !dbError && section === "parametres" && (
          <SettingsSection />
        )}


      </main>

      {/* ── RESPONSIVE STYLES ── */}
      <style>{`
        /* ── Desktop: sidebar always visible ── */
        @media (min-width: 768px) {
          .admin-sidebar {
            transform: translateX(0) !important;
            position: sticky !important;
            top: 0 !important;
            height: 100vh !important;
            flex-shrink: 0;
          }
          .admin-topbar  { display: none !important; }
          .admin-main    { padding: 1.5rem !important; }
          .mobile-bottom-nav { display: none !important; }
        }

        /* ── Phone: everything adapts ── */
        @media (max-width: 767px) {
          /* Topbar */
          .admin-topbar { display: flex !important; }

          /* Main content area */
          .admin-main {
            padding: 0.75rem 0.75rem 5rem !important;
          }

          /* Cards */
          .admin-main [style*="border-radius: 1.5rem"],
          .admin-main [style*="border-radius:1.5rem"] {
            border-radius: 1rem !important;
            padding: 1rem !important;
          }

          /* Page headers: wrap on small screens */
          .admin-main [style*="display: flex"][style*="justify-content: space-between"] {
            flex-wrap: wrap;
            gap: 0.6rem;
          }

          /* Stat grids: 2 columns on phone instead of 3 */
          .admin-main [style*="grid-template-columns: repeat(3, 1fr)"] {
            grid-template-columns: 1fr 1fr !important;
          }

          /* Form grids: single column on phone */
          .admin-main [style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
          .admin-main [style*="grid-template-columns: repeat(2, 1fr)"] {
            grid-template-columns: 1fr !important;
          }
          .admin-main [style*="grid-template-columns: 1fr 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
          .admin-main [style*="grid-template-columns: 1fr 1fr 1fr auto"] {
            grid-template-columns: 1fr 1fr !important;
          }

          /* Children table: make scrollable */
          .children-table-header,
          .children-table-row {
            grid-template-columns: 2fr 0.7fr 1fr auto !important;
          }
          .col-note { display: none !important; }

          /* Payments table: stack */
          .admin-main [style*="grid-template-columns: 2fr 1fr 1fr auto"] {
            grid-template-columns: 1fr auto !important;
          }

          /* Attendance rows: stack buttons below name */
          .admin-main [style*="align-items: center"][style*="justify-content: space-between"] {
            flex-wrap: wrap;
            gap: 0.5rem;
          }

          /* Sidebar overlay: full-width on very small phones */
          .admin-sidebar { width: 240px !important; }

          /* Bottom navigation bar */
          .mobile-bottom-nav {
            display: flex !important;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: oklch(0.22 0.06 270 / .97);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-top: 1px solid oklch(1 0 0 / .12);
            z-index: 50;
            padding: 0.4rem 0;
            justify-content: flex-start;
            align-items: center;
            overflow-x: auto;
          }
        }
      `}</style>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="mobile-bottom-nav" style={{ display: "none" }}>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => navTo(item.id)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.2rem",
              padding: "0.4rem 0.75rem",
              borderRadius: "0.75rem",
              border: "none",
              cursor: "pointer",
              background: section === item.id
                ? "linear-gradient(135deg, oklch(0.60 0.22 310 / .3), oklch(0.52 0.22 260 / .3))"
                : "transparent",
              color: section === item.id ? "oklch(0.88 0.10 270)" : "oklch(0.65 0.07 260)",
              minWidth: "60px",
              transition: "background .18s, color .18s",
            }}
          >
            {item.icon}
            <span style={{ fontSize: "0.62rem", fontWeight: 600, fontFamily: "var(--font-sans)", letterSpacing: "0.02em" }}>
              {item.label}
            </span>
          </button>
        ))}
      </nav>

    </div>
  );
}

/* ─────────────────────────────────────────────
   1. CHILDREN LIST
───────────────────────────────────────────── */
function ChildrenSection({
  children,
  setChildren,
  parents,
  setParents,
  onViewProfile,
  onChildAdded,
  onChildRemoved,
  onParentAdded,
  payments,
  onPay,
  crecheSections,
}: {
  children: Child[];
  setChildren: React.Dispatch<React.SetStateAction<Child[]>>;
  parents: Parent[];
  setParents: React.Dispatch<React.SetStateAction<Parent[]>>;
  onViewProfile: (c: Child) => void;
  onChildAdded: (c: Child) => void;
  onChildRemoved: (id: string) => void;
  onParentAdded?: (p: Parent) => void;
  payments: Payment[];
  onPay: (p: Payment) => void;
  crecheSections: CrecheSection[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [formStep, setFormStep] = useState<"identification" | "famille">("identification");
  const [selectedChildModal, setSelectedChildModal] = useState<Child | null>(null);
  // Paiement: depuis la liste = statut seul; depuis la fiche détail = statut + bouton payer
  const [paymentModal, setPaymentModal] = useState<{ child: Child; view: "status" | "pay"; canPay: boolean } | null>(null);
  const [editChild, setEditChild] = useState<Child | null>(null);
  const [editStep, setEditStep] = useState<"identification" | "famille">("identification");
  const emptyChild: Omit<Child, "id"> = {
    firstName: "", lastName: "", birthDate: "", gender: "", nationality: "", section: "Bébés", group: "",
    motherName: "", motherProfession: "", motherPhone: "",
    fatherName: "", fatherProfession: "", fatherPhone: "",
    siblingsCount: 0, familySituation: "",
    authorizedPersons: [{ name: "", firstName: "", phone: "" }, { name: "", firstName: "", phone: "" }] as AuthorizedPerson[],
    parentIds: [], allergies: "", notes: "", active: true,
  };
  const [form, setForm] = useState<Omit<Child, "id">>(emptyChild);
  const [search, setSearch] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [filterGroup, setFilterGroup] = useState("");

  function setF<K extends keyof Omit<Child, "id">>(k: K, v: Omit<Child, "id">[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function updateAuthorizedPerson(idx: number, field: keyof AuthorizedPerson, value: string) {
    setForm((f) => {
      const updated = [...f.authorizedPersons];
      updated[idx] = { ...updated[idx], [field]: value } as AuthorizedPerson;
      return { ...f, authorizedPersons: updated };
    });
  }

  function addAuthorizedPerson() {
    setForm((f) => ({ ...f, authorizedPersons: [...f.authorizedPersons, { name: "", firstName: "", phone: "" }] }));
  }

  function removeAuthorizedPerson(idx: number) {
    setForm((f) => ({ ...f, authorizedPersons: f.authorizedPersons.filter((_, i) => i !== idx) }));
  }

  function addChild() {
    if (!form.firstName.trim() || !form.lastName.trim()) return;
    const newChild: Child = { id: uid(), ...form };
    setChildren((prev) => [...prev, newChild]);
    onChildAdded(newChild);
    syncParentLinks(newChild.id, [], newChild.parentIds);
    setForm(emptyChild);
    setFormStep("identification");
    setShowForm(false);
  }

  /** Garde les deux côtés du lien enfant ↔ parent synchronisés (état + Supabase). */
  function syncParentLinks(childId: string, before: string[], after: string[]) {
    const updated = parents
      .filter((p) => before.includes(p.id) !== after.includes(p.id))
      .map((p) => ({
        ...p,
        childIds: after.includes(p.id)
          ? [...p.childIds.filter((c) => c !== childId), childId]
          : p.childIds.filter((c) => c !== childId),
      }));
    if (updated.length === 0) return;
    setParents((prev) => prev.map((p) => updated.find((u) => u.id === p.id) ?? p));
    updated.forEach((u) => onParentAdded?.(u));
  }

  function removeChild(id: string) {
    if (!confirm("Supprimer cet enfant ?")) return;
    const linked = parents.filter((p) => p.childIds.includes(id));
    setChildren((prev) => prev.filter((c) => c.id !== id));
    setParents((prev) =>
      prev.map((p) => ({ ...p, childIds: p.childIds.filter((cid) => cid !== id) }))
    );
    linked.forEach((p) => onParentAdded?.({ ...p, childIds: p.childIds.filter((cid) => cid !== id) }));
    onChildRemoved(id);
  }

  function saveEdit() {
    if (!editChild) return;
    const before = children.find((c) => c.id === editChild.id)?.parentIds ?? [];
    setChildren((prev) => prev.map((c) => c.id === editChild.id ? editChild : c));
    onChildAdded(editChild); // upsert in Supabase
    syncParentLinks(editChild.id, before, editChild.parentIds);
    setEditChild(null);
    setEditStep("identification");
  }

  function setEC<K extends keyof Child>(k: K, v: Child[K]) {
    setEditChild((c) => c ? { ...c, [k]: v } : c);
  }

  function updateEditAuthorizedPerson(idx: number, field: keyof AuthorizedPerson, value: string) {
    setEditChild((c) => {
      if (!c) return c;
      const updated = [...c.authorizedPersons];
      updated[idx] = { ...updated[idx], [field]: value } as AuthorizedPerson;
      return { ...c, authorizedPersons: updated };
    });
  }

  function addEditAuthorizedPerson() {
    setEditChild((c) => c ? { ...c, authorizedPersons: [...c.authorizedPersons, { name: "", firstName: "", phone: "" }] } : c);
  }

  function removeEditAuthorizedPerson(idx: number) {
    setEditChild((c) => c ? { ...c, authorizedPersons: c.authorizedPersons.filter((_, i) => i !== idx) } : c);
  }

  const filtered = children.filter((c) => {
    const matchText = `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase());
    const matchSection = !filterSection || c.section === filterSection;
    const matchGroup = !filterGroup || c.group === filterGroup;
    return matchText && matchSection && matchGroup;
  });

  // Groupes disponibles pour le filtre (selon la section sélectionnée)
  const filterGroupOptions = filterSection
    ? crecheSections.find((s) => s.name === filterSection)?.groups ?? []
    : crecheSections.flatMap((s) => s.groups);

  const sectionColors: Record<string, string> = {
    Bébés: "oklch(0.65 0.20 0)",
    Moyens: "oklch(0.60 0.22 310)",
    Grands: "oklch(0.55 0.22 245)",
  };

  return (
    <div>
      <PageHeader
        icon="👶"
        title="Liste des enfants"
        count={children.length}
        action={
          <button
            onClick={() => setShowForm((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.5rem 1rem",
              borderRadius: "9999px",
              border: "none",
              cursor: "pointer",
              background: "linear-gradient(135deg, oklch(0.60 0.22 310), oklch(0.52 0.22 260))",
              color: "#fff",
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "0.9rem",
              boxShadow: "0 3px 12px oklch(0.52 0.22 280 / .35)",
            }}
          >
            <Plus size={16} />
            Ajouter
          </button>
        }
      />



      {/* Add form */}
      {showForm && (
        <div style={{ ...card, marginBottom: "1.25rem" }}>
          {/* Form header + step tabs */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.1rem", color: "oklch(0.35 0.1 270)" }}>
              👶 Nouvel enfant
            </div>
            <div style={{ display: "flex", gap: "0.4rem" }}>
              {(["identification", "famille"] as const).map((step) => (
                <button
                  key={step}
                  onClick={() => setFormStep(step)}
                  style={{
                    padding: "0.4rem 1rem", borderRadius: "9999px", border: "none", cursor: "pointer",
                    fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.82rem",
                    background: formStep === step
                      ? "linear-gradient(135deg, oklch(0.60 0.22 310), oklch(0.52 0.22 260))"
                      : "oklch(0.92 0.03 265)",
                    color: formStep === step ? "#fff" : "oklch(0.50 0.08 265)",
                    transition: "all .18s",
                  }}
                >
                  {step === "identification" ? "1. Identification" : "2. Famille"}
                </button>
              ))}
            </div>
          </div>

          {/* Step 1 : Identification */}
          {formStep === "identification" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <Field label="Prénom *">
                <input style={inputStyle} value={form.firstName} onChange={(e) => setF("firstName", e.target.value)} placeholder="Léa" />
              </Field>
              <Field label="Nom *">
                <input style={inputStyle} value={form.lastName} onChange={(e) => setF("lastName", e.target.value)} placeholder="Martin" />
              </Field>
              <Field label="Date de naissance">
                <input style={inputStyle} type="date" value={form.birthDate} onChange={(e) => setF("birthDate", e.target.value)} />
              </Field>
              <Field label="Sexe">
                <select style={inputStyle} value={form.gender} onChange={(e) => setF("gender", e.target.value as Child["gender"])}>
                  <option value="">— Choisir —</option>
                  <option>Garçon</option>
                  <option>Fille</option>
                </select>
              </Field>
              <Field label="Nationalité">
                <input style={inputStyle} value={form.nationality} onChange={(e) => setF("nationality", e.target.value)} placeholder="Française" />
              </Field>
              <Field label="Section">
                <select
                  style={inputStyle}
                  value={form.section}
                  onChange={(e) => { setF("section", e.target.value); setF("group", ""); }}
                >
                  <option value="">— Sélectionner une section —</option>
                  {crecheSections.length === 0 && <option disabled>Aucune section (créez-en dans "Section &amp; Groupe")</option>}
                  {crecheSections.map((s) => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Groupe">
                <select
                  style={inputStyle}
                  value={form.group}
                  onChange={(e) => setF("group", e.target.value)}
                >
                  <option value="">— Sélectionner un groupe —</option>
                  {crecheSections.length === 0 && (
                    <option disabled>Aucun groupe — créez des sections d'abord</option>
                  )}
                  {/* Si une section est choisie : montrer ses groupes */}
                  {form.section
                    ? crecheSections
                        .find((s) => s.name === form.section)
                        ?.groups.map((g) => (
                          <option key={g.id} value={g.name}>{g.name}</option>
                        ))
                    : /* Sinon : tous les groupes groupés par section */
                      crecheSections.map((s) =>
                        s.groups.length > 0 ? (
                          <optgroup key={s.id} label={s.name}>
                            {s.groups.map((g) => (
                              <option key={g.id} value={g.name}>{g.name}</option>
                            ))}
                          </optgroup>
                        ) : null
                      )}
                </select>
              </Field>
              <Field label="Allergies" span>
                <input style={inputStyle} value={form.allergies} onChange={(e) => setF("allergies", e.target.value)} placeholder="ex : arachides, lactose…" />
              </Field>
              <Field label="Notes" span>
                <input style={inputStyle} value={form.notes} onChange={(e) => setF("notes", e.target.value)} placeholder="Informations complémentaires…" />
              </Field>
            </div>
          )}

          {/* Step 2 : Données famille */}
          {formStep === "famille" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Mère */}
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.85rem", color: "oklch(0.50 0.15 310)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.6rem" }}>
                  👩 Mère
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.65rem" }}>
                  <Field label="Nom et prénom">
                    <input style={inputStyle} value={form.motherName} onChange={(e) => setF("motherName", e.target.value)} placeholder="Sophie Martin" />
                  </Field>
                  <Field label="Profession">
                    <input style={inputStyle} value={form.motherProfession} onChange={(e) => setF("motherProfession", e.target.value)} placeholder="Infirmière" />
                  </Field>
                  <Field label="Téléphone">
                    <input style={inputStyle} type="tel" value={form.motherPhone} onChange={(e) => setF("motherPhone", e.target.value)} placeholder="06 12 34 56 78" />
                  </Field>
                </div>
              </div>
              {/* Père */}
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.85rem", color: "oklch(0.50 0.15 245)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.6rem" }}>
                  👨 Père
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.65rem" }}>
                  <Field label="Nom et prénom">
                    <input style={inputStyle} value={form.fatherName} onChange={(e) => setF("fatherName", e.target.value)} placeholder="Jean Martin" />
                  </Field>
                  <Field label="Profession">
                    <input style={inputStyle} value={form.fatherProfession} onChange={(e) => setF("fatherProfession", e.target.value)} placeholder="Enseignant" />
                  </Field>
                  <Field label="Téléphone">
                    <input style={inputStyle} type="tel" value={form.fatherPhone} onChange={(e) => setF("fatherPhone", e.target.value)} placeholder="06 98 76 54 32" />
                  </Field>
                </div>
              </div>
              {/* Situation familiale */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem" }}>
                <Field label="Nombre de frères et sœurs">
                  <input style={inputStyle} type="number" min={0} value={form.siblingsCount} onChange={(e) => setF("siblingsCount", Number(e.target.value))} />
                </Field>
                <Field label="Situation familiale">
                  <select style={inputStyle} value={form.familySituation} onChange={(e) => setF("familySituation", e.target.value as Child["familySituation"])}>
                    <option value="">— Choisir —</option>
                    <option>Marié(e)</option>
                    <option>Divorcé(e)</option>
                    <option>Veuf(ve)</option>
                  </select>
                </Field>
              </div>
              {/* Parents rattachés */}
              <ParentPicker parents={parents} value={form.parentIds} onChange={(ids) => setF("parentIds", ids)} />
              {/* Personnes autorisées */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.6rem" }}>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.85rem", color: "oklch(0.45 0.18 142)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    🔐 Personnes autorisées à récupérer l'enfant
                  </div>
                  <button
                    onClick={addAuthorizedPerson}
                    style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.35rem 0.85rem", borderRadius: "9999px", border: "none", cursor: "pointer", background: "oklch(0.55 0.22 142 / .15)", color: "oklch(0.38 0.18 142)", fontWeight: 700, fontSize: "0.8rem", fontFamily: "var(--font-display)" }}
                  >
                    <Plus size={14} /> Ajouter une personne
                  </button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {form.authorizedPersons.map((ap, idx) => (
                    <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "0.55rem", alignItems: "end", padding: "0.75rem", background: "oklch(0.97 0.02 142 / .3)", borderRadius: "0.85rem", border: "1px solid oklch(0.85 0.06 142 / .3)" }}>
                      <Field label="Nom">
                        <input style={inputStyle} value={ap.name} onChange={(e) => updateAuthorizedPerson(idx, "name", e.target.value)} placeholder="Dupont" />
                      </Field>
                      <Field label="Prénom">
                        <input style={inputStyle} value={ap.firstName} onChange={(e) => updateAuthorizedPerson(idx, "firstName", e.target.value)} placeholder="Paul" />
                      </Field>
                      <Field label="Téléphone">
                        <input style={inputStyle} type="tel" value={ap.phone} onChange={(e) => updateAuthorizedPerson(idx, "phone", e.target.value)} placeholder="06 11 22 33 44" />
                      </Field>
                      {form.authorizedPersons.length > 1 && (
                        <button onClick={() => removeAuthorizedPerson(idx)} style={{ background: "none", border: "none", cursor: "pointer", color: "oklch(0.60 0.15 27)", padding: "0.5rem", alignSelf: "flex-end" }}>
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem", flexWrap: "wrap" }}>
            {formStep === "identification" ? (
              <button
                onClick={() => { if (form.firstName.trim() && form.lastName.trim()) setFormStep("famille"); }}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", padding: "0.65rem 1.25rem", borderRadius: "9999px", border: "none", cursor: "pointer", background: "linear-gradient(135deg, oklch(0.60 0.22 310), oklch(0.52 0.22 260))", color: "#fff", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9rem" }}
              >
                Suivant → Données famille
              </button>
            ) : (
              <>
                <button onClick={() => setFormStep("identification")} style={{ padding: "0.65rem 1.25rem", borderRadius: "9999px", border: "1.5px solid oklch(0.80 0.07 260 / .5)", background: "oklch(1 0 0 / .6)", color: "oklch(0.45 0.10 270)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer" }}>
                  ← Retour
                </button>
                <button onClick={addChild} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", padding: "0.65rem 1.25rem", borderRadius: "9999px", border: "none", cursor: "pointer", background: "linear-gradient(135deg, oklch(0.60 0.22 142), oklch(0.48 0.22 155))", color: "#fff", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9rem" }}>
                  <Check size={16} /> Enregistrer l'enfant
                </button>
              </>
            )}
            <button onClick={() => { setShowForm(false); setFormStep("identification"); setForm(emptyChild); }} style={{ padding: "0.65rem 1rem", borderRadius: "9999px", border: "none", background: "oklch(0.577 0.245 27 / .12)", color: "oklch(0.50 0.22 27)", fontFamily: "var(--font-display)", fontWeight: 700, cursor: "pointer" }}>
              <X size={16} />
            </button>
          </div>
        </div>
      )}


      {/* Search + Filtres */}
      <div style={{ display: "flex", gap: "0.65rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <input
          style={{ ...inputStyle, padding: "0.65rem 1rem", flex: "2 1 180px" }}
          placeholder="🔍 Rechercher un enfant…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          style={{ ...inputStyle, flex: "1 1 140px" }}
          value={filterSection}
          onChange={(e) => { setFilterSection(e.target.value); setFilterGroup(""); }}
        >
          <option value="">Toutes les sections</option>
          {crecheSections.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
        </select>
        <select
          style={{ ...inputStyle, flex: "1 1 140px" }}
          value={filterGroup}
          onChange={(e) => setFilterGroup(e.target.value)}
          disabled={filterGroupOptions.length === 0}
        >
          <option value="">Tous les groupes</option>
          {filterGroupOptions.map((g) => <option key={g.id} value={g.name}>{g.name}</option>)}
        </select>
        {(filterSection || filterGroup || search) && (
          <button
            onClick={() => { setSearch(""); setFilterSection(""); setFilterGroup(""); }}
            title="Effacer les filtres"
            style={{ padding: "0.5rem 0.9rem", borderRadius: "9999px", border: "1.5px solid oklch(0.577 0.245 27 / .3)", background: "oklch(0.577 0.245 27 / .07)", color: "oklch(0.50 0.22 27)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.82rem", whiteSpace: "nowrap" }}
          >
            <X size={14} /> Effacer
          </button>
        )}
      </div>

      {/* Children list */}
      {filtered.length === 0 ? (
        <EmptyState icon="👶" text="Aucun enfant enregistré. Cliquez sur « Ajouter » pour commencer." />
      ) : (
        <div style={{ ...card, padding: "0", overflow: "hidden" }}>
          {/* Table header */}
          <div
            className="children-table-header"
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 0.55fr 0.7fr 1.4fr 0.9fr 1.2fr 1.4fr 120px",
              columnGap: "0.75rem",
              alignItems: "center",
              padding: "0.65rem 1.25rem",
              background: "linear-gradient(135deg, oklch(0.60 0.22 310 / .12), oklch(0.52 0.22 260 / .12))",
              borderBottom: "1.5px solid oklch(0.85 0.05 265 / .5)",
            }}
          >
            {["Nom & naissance", "Actif", "Âge", "Section", "Groupe", "Allergies", "Note", ""].map((h) => (
              <div
                key={h}
                style={{
                  minWidth: 0,
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  color: "oklch(0.45 0.10 270)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {h}
              </div>
            ))}
          </div>

          {/* Rows */}
          {filtered.map((child, idx) => {
            const age = calcAge(child.birthDate);
            const linkedParents = parents.filter((p) => child.parentIds.includes(p.id));
            return (
              <div
                key={child.id}
                style={{
                  borderBottom: idx < filtered.length - 1 ? "1px solid oklch(0.90 0.03 265 / .6)" : "none",
                  background: idx % 2 === 0 ? "transparent" : "oklch(0.97 0.02 265 / .3)",
                  transition: "background .15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "oklch(0.94 0.04 265 / .5)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? "transparent" : "oklch(0.97 0.02 265 / .3)")}
              >
                {/* Main row — same grid as header */}
                <div
                  className="children-table-row"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 0.55fr 0.7fr 1.4fr 0.9fr 1.2fr 1.4fr 120px",
                    columnGap: "0.75rem",
                    alignItems: "center",
                    padding: "0.75rem 1.25rem 0.5rem",
                  }}
                >
                  {/* Nom + Date naissance */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.95rem", color: "oklch(0.25 0.08 270)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {child.firstName} {child.lastName}
                    </div>
                    {child.birthDate && (
                      <div style={{ fontSize: "0.73rem", color: "oklch(0.55 0.06 260)", marginTop: "0.1rem", whiteSpace: "nowrap" }}>
                        📅 Né{child.firstName.endsWith("a") ? "e" : ""} le{" "}
                        {new Date(child.birthDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
                      </div>
                    )}
                  </div>

                  {/* Actif */}
                  <div style={{ minWidth: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <input
                      type="checkbox"
                      id={`active-${child.id}`}
                      checked={child.active !== false}
                      onChange={(e) => {
                        const updated = { ...child, active: e.target.checked };
                        setChildren((prev) => prev.map((c) => c.id === child.id ? updated : c));
                        upsertChild(updated);
                      }}
                      style={{ width: 18, height: 18, accentColor: "oklch(0.60 0.22 142)", cursor: "pointer" }}
                      title={child.active !== false ? "Actif — cliquer pour désactiver" : "Inactif — cliquer pour activer"}
                    />
                  </div>

                  {/* Âge */}
                  <div style={{ minWidth: 0, fontSize: "0.9rem", color: "oklch(0.38 0.08 270)", fontWeight: 700 }}>
                    {age === null ? (
                      <span style={{ color: "oklch(0.72 0.04 265)", fontWeight: 500 }}>—</span>
                    ) : age === 0 ? (
                      <>{calcMonths(child.birthDate)}<span style={{ fontWeight: 500, fontSize: "0.78rem", marginLeft: "0.15rem" }}>mois</span></>
                    ) : (
                      <>{age}<span style={{ fontWeight: 500, fontSize: "0.78rem", marginLeft: "0.15rem" }}>an{age > 1 ? "s" : ""}</span></>
                    )}
                  </div>

                  {/* Section */}
                  <div style={{ minWidth: 0 }}>
                    <span style={badge(sectionColors[child.section] ?? "oklch(0.55 0.15 260)")}>
                      {child.section || "—"}
                    </span>
                  </div>

                  {/* Groupe */}
                  <div style={{ minWidth: 0 }}>
                    {child.group ? (
                      <span style={badge("oklch(0.52 0.20 280)")}>
                        {child.group}
                      </span>
                    ) : (
                      <span style={{ color: "oklch(0.72 0.04 265)", fontSize: "0.85rem" }}>—</span>
                    )}
                  </div>

                  {/* Allergies */}
                  <div style={{ minWidth: 0, fontSize: "0.81rem", overflow: "hidden" }}>
                    {child.allergies ? (
                      <span title={child.allergies} style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "oklch(0.48 0.20 27)", overflow: "hidden" }}>
                        <AlertCircle size={12} style={{ flexShrink: 0 }} />
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{child.allergies}</span>
                      </span>
                    ) : (
                      <span style={{ color: "oklch(0.72 0.04 265)" }}>—</span>
                    )}
                  </div>

                  {/* Note */}
                  <div className="col-note" style={{ minWidth: 0, fontSize: "0.81rem", color: "oklch(0.42 0.08 265)", fontStyle: child.notes ? "italic" : "normal", overflow: "hidden" }}>
                    {child.notes ? (
                      <span title={child.notes} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                        📝 {child.notes}
                      </span>
                    ) : (
                      <span style={{ color: "oklch(0.72 0.04 265)" }}>—</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "0.35rem", alignItems: "center", justifyContent: "flex-end" }}>
                    {/* Bouton Voir */}
                    <button
                      onClick={() => setSelectedChildModal(child)}
                      title="Voir toutes les informations"
                      style={{
                        display: "flex", alignItems: "center",
                        padding: "0.35rem 0.5rem", borderRadius: "0.6rem",
                        border: "1.5px solid oklch(0.55 0.20 260 / .4)",
                        background: "oklch(0.55 0.20 260 / .08)",
                        color: "oklch(0.40 0.18 260)", cursor: "pointer",
                      }}
                    >
                      <Eye size={13} />
                    </button>
                    {/* Bouton Statut de paiement (vert = payé ce mois-ci, orange = en attente) */}
                    {(() => {
                      const paid = isPaidFor(payments, child.id, thisMonth());
                      const tone = paid ? "oklch(0.55 0.22 142)" : "oklch(0.60 0.18 70)";
                      return (
                        <button
                          onClick={() => setPaymentModal({ child, view: "status", canPay: false })}
                          title={paid ? "Paiement : payé ce mois-ci" : "Paiement : en attente"}
                          style={{
                            display: "flex", alignItems: "center", gap: "0.3rem",
                            padding: "0.35rem 0.55rem", borderRadius: "0.6rem",
                            border: `1.5px solid ${tone}`,
                            background: paid ? "oklch(0.55 0.22 142 / .10)" : "oklch(0.60 0.18 70 / .10)",
                            color: paid ? "oklch(0.38 0.18 142)" : "oklch(0.45 0.15 60)",
                            cursor: "pointer", fontSize: "0.72rem", fontWeight: 700, whiteSpace: "nowrap",
                          }}
                        >
                          <CreditCard size={13} /> {paid ? "Payé" : "En attente"}
                        </button>
                      );
                    })()}
                    {/* Bouton Modifier */}
                    <button
                      onClick={() => { setEditChild(child); setEditStep("identification"); }}
                      title="Modifier"
                      style={{
                        display: "flex", alignItems: "center",
                        padding: "0.35rem 0.5rem", borderRadius: "0.6rem",
                        border: "1.5px solid oklch(0.60 0.22 142 / .4)",
                        background: "oklch(0.60 0.22 142 / .08)",
                        color: "oklch(0.38 0.18 142)", cursor: "pointer",
                      }}
                    >
                      <Pencil size={13} />
                    </button>
                    {/* Bouton Supprimer */}
                    <button
                      onClick={() => removeChild(child.id)}
                      title="Supprimer"
                      style={{
                        display: "flex", alignItems: "center",
                        padding: "0.35rem 0.5rem", borderRadius: "0.6rem",
                        border: "1.5px solid oklch(0.577 0.245 27 / .3)",
                        background: "oklch(0.577 0.245 27 / .07)",
                        color: "oklch(0.50 0.22 27)", cursor: "pointer",
                      }}
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>

                {/* Ligne secondaire : parents rattachés */}
                {linkedParents.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", padding: "0 1.25rem 0.7rem", alignItems: "center" }}>
                    <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "oklch(0.55 0.07 265)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Parents :</span>
                    {linkedParents.map((p) => (
                      <span key={p.id} style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", padding: "0.15rem 0.55rem", borderRadius: "9999px", background: "oklch(0.52 0.22 260 / .12)", border: "1px solid oklch(0.52 0.22 260 / .25)", fontSize: "0.78rem", fontWeight: 600, color: "oklch(0.35 0.12 265)" }}>
                        👤 {p.name}
                        {p.phone && (
                          <a href={`tel:${p.phone}`} style={{ color: "oklch(0.50 0.20 142)", marginLeft: "0.2rem", display: "flex" }} title={`Appeler ${p.name}`}>
                            <Phone size={11} />
                          </a>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modale édition enfant ── */}
      {editChild && (
        <div
          onClick={() => { setEditChild(null); setEditStep("identification"); }}
          style={{
            position: "fixed", inset: 0, zIndex: 10000,
            background: "oklch(0.15 0.08 265 / .65)",
            backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "1.5rem",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "linear-gradient(160deg, oklch(0.99 0.01 265), oklch(0.96 0.03 270))",
              borderRadius: "1.5rem",
              boxShadow: "0 24px 80px oklch(0.30 0.15 270 / .35)",
              width: "100%", maxWidth: "660px",
              maxHeight: "90vh", overflowY: "auto",
              padding: "2rem",
              position: "relative",
            }}
          >
            {/* Close */}
            <button
              onClick={() => { setEditChild(null); setEditStep("identification"); }}
              style={{
                position: "absolute", top: "1rem", right: "1rem",
                background: "oklch(0.577 0.245 27 / .10)", border: "none", borderRadius: "50%",
                width: "2rem", height: "2rem", display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "oklch(0.50 0.22 27)",
              }}
            >
              <X size={16} />
            </button>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.1rem", color: "oklch(0.35 0.1 270)" }}>
                ✏️ Modifier — {editChild.firstName} {editChild.lastName}
              </div>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                {(["identification", "famille"] as const).map((step) => (
                  <button key={step} onClick={() => setEditStep(step)} style={{
                    padding: "0.4rem 1rem", borderRadius: "9999px", border: "none", cursor: "pointer",
                    fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.82rem",
                    background: editStep === step ? "linear-gradient(135deg, oklch(0.60 0.22 310), oklch(0.52 0.22 260))" : "oklch(0.92 0.03 265)",
                    color: editStep === step ? "#fff" : "oklch(0.50 0.08 265)", transition: "all .18s",
                  }}>
                    {step === "identification" ? "1. Identification" : "2. Famille"}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 1 */}
            {editStep === "identification" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <Field label="Prénom *">
                  <input style={inputStyle} value={editChild.firstName} onChange={(e) => setEC("firstName", e.target.value)} />
                </Field>
                <Field label="Nom *">
                  <input style={inputStyle} value={editChild.lastName} onChange={(e) => setEC("lastName", e.target.value)} />
                </Field>
                <Field label="Date de naissance">
                  <input style={inputStyle} type="date" value={editChild.birthDate} onChange={(e) => setEC("birthDate", e.target.value)} />
                </Field>
                <Field label="Sexe">
                  <select style={inputStyle} value={editChild.gender} onChange={(e) => setEC("gender", e.target.value as Child["gender"])}>
                    <option value="">— Choisir —</option>
                    <option>Garçon</option>
                    <option>Fille</option>
                  </select>
                </Field>
                <Field label="Nationalité">
                  <input style={inputStyle} value={editChild.nationality} onChange={(e) => setEC("nationality", e.target.value)} />
                </Field>
                <Field label="Section">
                  <select style={inputStyle} value={editChild.section} onChange={(e) => { setEC("section", e.target.value); setEC("group", ""); }}>
                    <option value="">— Sélectionner —</option>
                    {crecheSections.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </Field>
                <Field label="Groupe">
                  <select style={inputStyle} value={editChild.group} onChange={(e) => setEC("group", e.target.value)}>
                    <option value="">— Sélectionner —</option>
                    {editChild.section
                      ? crecheSections.find((s) => s.name === editChild.section)?.groups.map((g) => <option key={g.id} value={g.name}>{g.name}</option>)
                      : crecheSections.map((s) => s.groups.length > 0
                          ? <optgroup key={s.id} label={s.name}>{s.groups.map((g) => <option key={g.id} value={g.name}>{g.name}</option>)}</optgroup>
                          : null)}
                  </select>
                </Field>
                <Field label="Allergies" span>
                  <input style={inputStyle} value={editChild.allergies} onChange={(e) => setEC("allergies", e.target.value)} />
                </Field>
                <Field label="Notes" span>
                  <input style={inputStyle} value={editChild.notes} onChange={(e) => setEC("notes", e.target.value)} />
                </Field>
              </div>
            )}

            {/* Step 2 */}
            {editStep === "famille" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.85rem", color: "oklch(0.50 0.15 310)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.6rem" }}>👩 Mère</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.65rem" }}>
                    <Field label="Nom et prénom"><input style={inputStyle} value={editChild.motherName} onChange={(e) => setEC("motherName", e.target.value)} /></Field>
                    <Field label="Profession"><input style={inputStyle} value={editChild.motherProfession} onChange={(e) => setEC("motherProfession", e.target.value)} /></Field>
                    <Field label="Téléphone"><input style={inputStyle} type="tel" value={editChild.motherPhone} onChange={(e) => setEC("motherPhone", e.target.value)} /></Field>
                  </div>
                </div>
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.85rem", color: "oklch(0.50 0.15 245)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.6rem" }}>👨 Père</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.65rem" }}>
                    <Field label="Nom et prénom"><input style={inputStyle} value={editChild.fatherName} onChange={(e) => setEC("fatherName", e.target.value)} /></Field>
                    <Field label="Profession"><input style={inputStyle} value={editChild.fatherProfession} onChange={(e) => setEC("fatherProfession", e.target.value)} /></Field>
                    <Field label="Téléphone"><input style={inputStyle} type="tel" value={editChild.fatherPhone} onChange={(e) => setEC("fatherPhone", e.target.value)} /></Field>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem" }}>
                  <Field label="Nombre de frères et sœurs">
                    <input style={inputStyle} type="number" min={0} value={editChild.siblingsCount} onChange={(e) => setEC("siblingsCount", Number(e.target.value))} />
                  </Field>
                  <Field label="Situation familiale">
                    <select style={inputStyle} value={editChild.familySituation} onChange={(e) => setEC("familySituation", e.target.value as Child["familySituation"])}>
                      <option value="">— Choisir —</option>
                      <option>Marié(e)</option>
                      <option>Divorcé(e)</option>
                      <option>Veuf(ve)</option>
                    </select>
                  </Field>
                </div>
                {/* Parents rattachés */}
                <ParentPicker parents={parents} value={editChild.parentIds} onChange={(ids) => setEC("parentIds", ids)} />
                {/* Personnes autorisées */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.6rem" }}>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.85rem", color: "oklch(0.45 0.18 142)", textTransform: "uppercase", letterSpacing: "0.05em" }}>🔐 Personnes autorisées</div>
                    <button onClick={addEditAuthorizedPerson} style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.35rem 0.85rem", borderRadius: "9999px", border: "none", cursor: "pointer", background: "oklch(0.55 0.22 142 / .15)", color: "oklch(0.38 0.18 142)", fontWeight: 700, fontSize: "0.8rem", fontFamily: "var(--font-display)" }}>
                      <Plus size={14} /> Ajouter
                    </button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                    {editChild.authorizedPersons.map((ap, idx) => (
                      <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "0.55rem", alignItems: "end", padding: "0.75rem", background: "oklch(0.97 0.02 142 / .3)", borderRadius: "0.85rem", border: "1px solid oklch(0.85 0.06 142 / .3)" }}>
                        <Field label="Nom"><input style={inputStyle} value={ap.name} onChange={(e) => updateEditAuthorizedPerson(idx, "name", e.target.value)} /></Field>
                        <Field label="Prénom"><input style={inputStyle} value={ap.firstName} onChange={(e) => updateEditAuthorizedPerson(idx, "firstName", e.target.value)} /></Field>
                        <Field label="Téléphone"><input style={inputStyle} type="tel" value={ap.phone} onChange={(e) => updateEditAuthorizedPerson(idx, "phone", e.target.value)} /></Field>
                        {editChild.authorizedPersons.length > 1 && (
                          <button onClick={() => removeEditAuthorizedPerson(idx)} style={{ background: "none", border: "none", cursor: "pointer", color: "oklch(0.60 0.15 27)", padding: "0.5rem", alignSelf: "flex-end" }}><X size={16} /></button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Boutons du bas */}
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem", flexWrap: "wrap" }}>
              {editStep === "identification" ? (
                <button onClick={() => setEditStep("famille")} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", padding: "0.65rem 1.25rem", borderRadius: "9999px", border: "none", cursor: "pointer", background: "linear-gradient(135deg, oklch(0.60 0.22 310), oklch(0.52 0.22 260))", color: "#fff", fontFamily: "var(--font-display)", fontWeight: 700 }}>
                  Suivant → Données famille
                </button>
              ) : (
                <>
                  <button onClick={() => setEditStep("identification")} style={{ padding: "0.65rem 1.25rem", borderRadius: "9999px", border: "1.5px solid oklch(0.80 0.07 260 / .5)", background: "oklch(1 0 0 / .6)", color: "oklch(0.45 0.10 270)", fontFamily: "var(--font-display)", fontWeight: 700, cursor: "pointer" }}>
                    ← Retour
                  </button>
                  <button onClick={saveEdit} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", padding: "0.65rem 1.25rem", borderRadius: "9999px", border: "none", cursor: "pointer", background: "linear-gradient(135deg, oklch(0.60 0.22 142), oklch(0.48 0.22 155))", color: "#fff", fontFamily: "var(--font-display)", fontWeight: 700 }}>
                    <Check size={16} /> Enregistrer les modifications
                  </button>
                </>
              )}
              <button onClick={() => { setEditChild(null); setEditStep("identification"); }} style={{ padding: "0.65rem 1rem", borderRadius: "9999px", border: "none", background: "oklch(0.577 0.245 27 / .12)", color: "oklch(0.50 0.22 27)", fontFamily: "var(--font-display)", fontWeight: 700, cursor: "pointer" }}>
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modale détail enfant ── */}
      {selectedChildModal && (() => {
        const mc = selectedChildModal;
        const age = calcAge(mc.birthDate);
        const linkedParents = parents.filter((p) => mc.parentIds.includes(p.id));
        return (
          <div
            onClick={() => setSelectedChildModal(null)}
            style={{
              position: "fixed", inset: 0, zIndex: 9999,
              background: "oklch(0.15 0.08 265 / .65)",
              backdropFilter: "blur(6px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "1.5rem",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "linear-gradient(160deg, oklch(0.99 0.01 265), oklch(0.96 0.03 270))",
                borderRadius: "1.5rem",
                boxShadow: "0 24px 80px oklch(0.30 0.15 270 / .35)",
                width: "100%", maxWidth: "620px",
                maxHeight: "88vh", overflowY: "auto",
                padding: "2rem",
                position: "relative",
              }}
            >
              <button
                onClick={() => setSelectedChildModal(null)}
                style={{
                  position: "absolute", top: "1rem", right: "1rem",
                  background: "oklch(0.577 0.245 27 / .10)",
                  border: "none", borderRadius: "50%",
                  width: "2rem", height: "2rem",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", color: "oklch(0.50 0.22 27)",
                }}
              >
                <X size={16} />
              </button>

              {/* Avatar + nom */}
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.75rem" }}>
                <div style={{
                  width: "56px", height: "56px", borderRadius: "50%",
                  background: "linear-gradient(135deg, oklch(0.60 0.22 310), oklch(0.52 0.22 260))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.6rem", flexShrink: 0,
                }}>
                  {mc.gender === "Fille" ? "👧" : mc.gender === "Garçon" ? "👦" : "👶"}
                </div>
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.3rem", color: "oklch(0.25 0.10 270)" }}>
                    {mc.firstName} {mc.lastName}
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "oklch(0.52 0.08 260)", marginTop: "0.2rem" }}>
                    {mc.section}{mc.group ? ` • ${mc.group}` : ""}
                    {age !== null && <span style={{ marginLeft: "0.5rem" }}>— {age} an{age > 1 ? "s" : ""}</span>}
                  </div>
                </div>
              </div>

              {/* 0. Paiement */}
              <ModalSection title="💳 Paiement">
                {(() => {
                  const paid = isPaidFor(payments, mc.id, thisMonth());
                  return (
                    <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                      <span style={badge(paid ? "oklch(0.55 0.22 142)" : "oklch(0.60 0.18 70)")}>
                        {paid ? "✅ Payé ce mois-ci" : "⏳ En attente ce mois-ci"}
                      </span>
                      <button
                        onClick={() => setPaymentModal({ child: mc, view: "status", canPay: true })}
                        style={{ padding: "0.4rem 0.9rem", borderRadius: "9999px", border: "1.5px solid oklch(0.55 0.20 260 / .45)", background: "oklch(0.55 0.20 260 / .08)", color: "oklch(0.40 0.18 260)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer" }}
                      >
                        💳 Statut de paiement
                      </button>
                      <button
                        onClick={() => setPaymentModal({ child: mc, view: "pay", canPay: true })}
                        style={{ padding: "0.4rem 0.9rem", borderRadius: "9999px", border: "none", background: "linear-gradient(135deg, oklch(0.60 0.22 142), oklch(0.48 0.22 155))", color: "#fff", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer" }}
                      >
                        💶 Payer
                      </button>
                    </div>
                  );
                })()}
              </ModalSection>

              {/* 1. Identification */}
              <ModalSection title="🧒 Identification">
                <ModalRow label="Prénom" value={mc.firstName} />
                <ModalRow label="Nom" value={mc.lastName} />
                <ModalRow label="Date de naissance"
                  value={mc.birthDate
                    ? new Date(mc.birthDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
                    : null} />
                <ModalRow label="Âge" value={age !== null ? `${age} an${age > 1 ? "s" : ""}` : null} />
                <ModalRow label="Sexe" value={mc.gender || null} />
                <ModalRow label="Nationalité" value={mc.nationality || null} />
                <ModalRow label="Section" value={mc.section || null} />
                <ModalRow label="Groupe" value={mc.group || null} />
              </ModalSection>

              {/* 2. Famille */}
              <ModalSection title="👨‍👩‍👦 Données famille">
                <ModalRow label="Mère" value={mc.motherName || null} />
                <ModalRow label="Profession mère" value={mc.motherProfession || null} />
                <ModalRow label="Tél. mère" value={mc.motherPhone || null} phone />
                <ModalRow label="Père" value={mc.fatherName || null} />
                <ModalRow label="Profession père" value={mc.fatherProfession || null} />
                <ModalRow label="Tél. père" value={mc.fatherPhone || null} phone />
                <ModalRow label="Frères & sœurs" value={String(mc.siblingsCount)} />
                <ModalRow label="Situation familiale" value={mc.familySituation || null} />
              </ModalSection>

              {/* 3. Personnes autorisées */}
              {mc.authorizedPersons.length > 0 && (
                <ModalSection title="🔐 Personnes autorisées">
                  {mc.authorizedPersons.map((ap, i) => (
                    <div key={i} style={{ display: "flex", gap: "0.5rem", alignItems: "baseline", marginBottom: "0.4rem", gridColumn: "1 / -1" }}>
                      <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.78rem", color: "oklch(0.55 0.07 265)", minWidth: "1.1rem" }}>{i + 1}.</span>
                      <span style={{ fontSize: "0.88rem", color: "oklch(0.30 0.08 270)", fontWeight: 600 }}>{ap.firstName} {ap.name}</span>
                      {ap.phone && <a href={`tel:${ap.phone}`} style={{ fontSize: "0.82rem", color: "oklch(0.45 0.20 142)" }}>{ap.phone}</a>}
                    </div>
                  ))}
                </ModalSection>
              )}

              {/* 4. Parents rattachés */}
              {linkedParents.length > 0 && (
                <ModalSection title="👥 Parents rattachés">
                  {linkedParents.map((p) => (
                    <div key={p.id} style={{ display: "flex", gap: "0.65rem", alignItems: "center", flexWrap: "wrap", gridColumn: "1 / -1", marginBottom: "0.35rem" }}>
                      <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "oklch(0.30 0.08 270)" }}>👤 {p.name}</span>
                      {p.phone && <a href={`tel:${p.phone}`} style={{ fontSize: "0.82rem", color: "oklch(0.45 0.20 142)" }}>{p.phone}</a>}
                      {p.email && <span style={{ fontSize: "0.78rem", color: "oklch(0.55 0.07 260)" }}>{p.email}</span>}
                    </div>
                  ))}
                </ModalSection>
              )}

              {/* 5. Santé & notes */}
              {(mc.allergies || mc.notes) && (
                <ModalSection title="📋 Santé & notes">
                  <ModalRow label="Allergies" value={mc.allergies || null} />
                  <ModalRow label="Notes" value={mc.notes || null} />
                </ModalSection>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── Modale paiement ── */}
      {paymentModal && (
        <PaymentModal
          childId={paymentModal.child.id}
          childName={`${paymentModal.child.firstName} ${paymentModal.child.lastName}`}
          payments={payments}
          initialView={paymentModal.view}
          onPay={paymentModal.canPay ? onPay : undefined}
          onClose={() => setPaymentModal(null)}
        />
      )}

    </div>
  );
}

function ParentPicker({
  parents,
  value,
  onChange,
}: {
  parents: Parent[];
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  return (
    <div>
      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.85rem", color: "oklch(0.45 0.18 260)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.6rem" }}>
        👨‍👩‍👧 Parents rattachés
      </div>
      {parents.length === 0 ? (
        <p style={{ margin: 0, fontSize: "0.85rem", color: "oklch(0.55 0.07 260)" }}>
          Aucun parent enregistré. Ajoutez-en dans l'onglet « Parents » pour les rattacher à cet enfant.
        </p>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
          {parents.map((p) => {
            const on = value.includes(p.id);
            return (
              <button
                type="button"
                key={p.id}
                onClick={() => onChange(on ? value.filter((id) => id !== p.id) : [...value, p.id])}
                style={{
                  padding: "0.3rem 0.8rem",
                  borderRadius: "9999px",
                  border: `1.5px solid ${on ? "oklch(0.55 0.22 142)" : "oklch(0.75 0.07 260 / .5)"}`,
                  background: on ? "oklch(0.55 0.22 142 / .12)" : "transparent",
                  color: on ? "oklch(0.40 0.20 142)" : "oklch(0.55 0.07 265)",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {on ? "✓" : "+"} {p.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ModalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <div style={{
        fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.78rem",
        color: "oklch(0.50 0.12 280)", textTransform: "uppercase", letterSpacing: "0.06em",
        marginBottom: "0.55rem", paddingBottom: "0.35rem",
        borderBottom: "1.5px solid oklch(0.88 0.05 265 / .5)",
      }}>
        {title}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.35rem 1rem" }}>
        {children}
      </div>
    </div>
  );
}

function ModalRow({ label, value, phone }: { label: string; value: string | null; phone?: boolean }) {
  if (!value) return null;
  return (
    <>
      <div style={{ fontSize: "0.75rem", color: "oklch(0.60 0.06 265)", fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: "0.86rem", color: "oklch(0.28 0.08 270)", fontWeight: 500 }}>
        {phone
          ? <a href={`tel:${value}`} style={{ color: "oklch(0.45 0.20 142)", textDecoration: "none" }}>{value}</a>
          : value}
      </div>
    </>
  );
}


/* ─────────────────────────────────────────────
   2. CHILD PROFILE
───────────────────────────────────────────── */
function ChildProfile({
  child,
  parents,
  onBack,
}: {
  child: Child;
  parents: Parent[];
  onBack: () => void;
}) {
  const childParents = parents.filter((p) => child.parentIds.includes(p.id));

  const age = calcAge(child.birthDate);


  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <button
          onClick={onBack}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.45rem 0.85rem",
            borderRadius: "9999px",
            border: "1.5px solid oklch(0.80 0.07 260 / .5)",
            background: "oklch(1 0 0 / .6)",
            color: "oklch(0.45 0.10 270)",
            cursor: "pointer",
            fontSize: "0.85rem",
            fontWeight: 600,
          }}
        >
          <ArrowLeft size={15} /> Retour
        </button>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "1.4rem",
            background: "linear-gradient(135deg, oklch(0.60 0.22 310), oklch(0.52 0.22 260))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            margin: 0,
          }}
        >
          {child.firstName} {child.lastName}
        </h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        {/* Info card */}
        <div style={{ ...card, gridColumn: "1 / -1" }}>
          <SectionTitle>📋 Informations générales</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginTop: "0.75rem" }}>
            <InfoRow label="Prénom" value={child.firstName} />
            <InfoRow label="Nom" value={child.lastName} />
            <InfoRow label="Section" value={child.section} />
            <InfoRow
              label="Date de naissance"
              value={
                child.birthDate
                  ? new Date(child.birthDate).toLocaleDateString("fr-FR")
                  : "—"
              }
            />
            {age !== null && <InfoRow label="Âge" value={`${age} an${age > 1 ? "s" : ""}`} />}
            <InfoRow label="Allergies" value={child.allergies || "Aucune"} />
          </div>
          {child.notes && (
            <div style={{ marginTop: "0.75rem", padding: "0.65rem 0.85rem", background: "oklch(0.96 0.04 265 / .4)", borderRadius: "0.75rem", fontSize: "0.85rem", color: "oklch(0.40 0.08 265)" }}>
              📝 {child.notes}
            </div>
          )}
        </div>

        {/* Parents */}
        <div style={card}>
          <SectionTitle>👪 Parents rattachés</SectionTitle>
          {childParents.length === 0 ? (
            <p style={{ fontSize: "0.85rem", color: "oklch(0.60 0.05 260)", marginTop: "0.5rem" }}>Aucun parent rattaché.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.6rem" }}>
              {childParents.map((p) => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 0.7rem", background: "oklch(0.97 0.02 265 / .5)", borderRadius: "0.75rem" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{p.name}</div>
                    <div style={{ fontSize: "0.78rem", color: "oklch(0.55 0.07 260)" }}>{p.phone}</div>
                  </div>
                  <a href={`tel:${p.phone}`} style={{ color: "oklch(0.55 0.18 142)", display: "flex" }}>
                    <Phone size={16} />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


/* ─────────────────────────────────────────────
   5. PARENTS
───────────────────────────────────────────── */
export function ParentsSection({
  parents,
  setParents,
  children,
  onParentAdded,
  onParentRemoved,
  onChildLinkChange,
}: {
  parents: Parent[];
  setParents: React.Dispatch<React.SetStateAction<Parent[]>>;
  children: Child[];
  onParentAdded: (p: Parent) => void;
  onParentRemoved: (id: string) => void;
  onChildLinkChange: (childId: string, parentId: string, linked: boolean) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<Parent, "id">>({
    name: "",
    phone: "",
    email: "",
    childIds: [],
  });
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState<string | null>(null);

  function closeForm() {
    setForm({ name: "", phone: "", email: "", childIds: [] });
    setEditId(null);
    setShowForm(false);
  }

  function startEdit(p: Parent) {
    setForm({ name: p.name, phone: p.phone, email: p.email, childIds: p.childIds });
    setEditId(p.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function addParent() {
    if (!form.name.trim()) return;
    if (editId) {
      const before = parents.find((p) => p.id === editId)?.childIds ?? [];
      const updated: Parent = { id: editId, ...form };
      setParents((prev) => prev.map((p) => (p.id === editId ? updated : p)));
      onParentAdded(updated);
      form.childIds.filter((c) => !before.includes(c)).forEach((c) => onChildLinkChange(c, editId, true));
      before.filter((c) => !form.childIds.includes(c)).forEach((c) => onChildLinkChange(c, editId, false));
      closeForm();
      return;
    }
    const newParent: Parent = { id: uid(), ...form };
    setParents((prev) => [...prev, newParent]);
    onParentAdded(newParent);
    newParent.childIds.forEach((cid) => onChildLinkChange(cid, newParent.id, true));
    closeForm();
  }

  function removeParent(id: string) {
    if (!confirm("Supprimer ce parent ?")) return;
    setParents((prev) => prev.filter((p) => p.id !== id));
    onParentRemoved(id);
  }

  function toggleChildLink(parentId: string, childId: string) {
    const parent = parents.find((p) => p.id === parentId);
    if (!parent) return;
    const linked = !parent.childIds.includes(childId);
    const updated: Parent = {
      ...parent,
      childIds: linked ? [...parent.childIds, childId] : parent.childIds.filter((c) => c !== childId),
    };
    setParents((prev) => prev.map((p) => (p.id === parentId ? updated : p)));
    onParentAdded(updated);
    onChildLinkChange(childId, parentId, linked);
  }

  const filtered = parents.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        icon="👨‍👩‍👧"
        title="Liste des parents"
        count={parents.length}
        action={
          <button
            onClick={() => (showForm ? closeForm() : setShowForm(true))}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.5rem 1rem",
              borderRadius: "9999px",
              border: "none",
              cursor: "pointer",
              background: "linear-gradient(135deg, oklch(0.60 0.22 310), oklch(0.52 0.22 260))",
              color: "#fff",
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "0.9rem",
              boxShadow: "0 3px 12px oklch(0.52 0.22 280 / .35)",
            }}
          >
            <Plus size={16} /> Ajouter
          </button>
        }
      />

      {/* Add form */}
      {showForm && (
        <div style={{ ...card, marginBottom: "1.25rem" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.05rem", color: "oklch(0.35 0.1 270)", marginBottom: "1rem" }}>
            {editId ? "✏️ Modifier le parent" : "✏️ Nouveau parent"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <Field label="Nom complet *">
              <input style={inputStyle} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Marie Dupont" />
            </Field>
            <Field label="Téléphone">
              <input style={inputStyle} type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="06 12 34 56 78" />
            </Field>
            <Field label="Email" span>
              <input style={inputStyle} type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="marie@email.fr" />
            </Field>
            {children.length > 0 && (
              <Field label="Enfants rattachés" span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  {children.map((c) => (
                    <label
                      key={c.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        padding: "0.3rem 0.7rem",
                        borderRadius: "9999px",
                        border: "1.5px solid oklch(0.65 0.17 260 / .4)",
                        background: form.childIds.includes(c.id) ? "oklch(0.55 0.22 260 / .15)" : "oklch(0.97 0.02 260)",
                        cursor: "pointer",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        color: "oklch(0.40 0.10 270)",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={form.childIds.includes(c.id)}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            childIds: e.target.checked
                              ? [...f.childIds, c.id]
                              : f.childIds.filter((id) => id !== c.id),
                          }))
                        }
                        style={{ accentColor: "oklch(0.55 0.22 260)" }}
                      />
                      {c.firstName} {c.lastName}
                    </label>
                  ))}
                </div>
              </Field>
            )}
          </div>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
            <button onClick={addParent} className="kid-btn bg-kid-green" style={{ flex: 1 }}>
              <span className="relative z-10 flex items-center gap-2 justify-center"><Check size={16} /> Enregistrer</span>
            </button>
            <button onClick={closeForm} className="kid-btn bg-kid-pink" style={{ flex: 1 }}>
              <span className="relative z-10 flex items-center gap-2 justify-center"><X size={16} /> Annuler</span>
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: "1rem" }}>
        <input
          style={{ ...inputStyle, padding: "0.65rem 1rem" }}
          placeholder="🔍 Rechercher un parent…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Parent cards */}
      {filtered.length === 0 ? (
        <EmptyState icon="👨‍👩‍👧" text="Aucun parent enregistré." />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
          {filtered.map((parent) => {
            const linkedChildren = children.filter((c) => parent.childIds.includes(c.id));
            return (
              <div key={parent.id} style={{ ...card, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.05rem", color: "oklch(0.28 0.08 270)" }}>
                      {parent.name}
                    </div>
                    {parent.email && (
                      <div style={{ fontSize: "0.78rem", color: "oklch(0.55 0.07 260)", marginTop: "0.1rem" }}>
                        {parent.email}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "0.35rem" }}>
                    <button onClick={() => startEdit(parent)} title="Modifier" style={{ background: "none", border: "none", cursor: "pointer", color: "oklch(0.50 0.15 260)", padding: "0.1rem" }}>
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => removeParent(parent.id)} title="Supprimer" style={{ background: "none", border: "none", cursor: "pointer", color: "oklch(0.60 0.15 27)", padding: "0.1rem" }}>
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* Phone + actions */}
                {parent.phone && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 0.75rem", background: "oklch(0.97 0.02 265 / .5)", borderRadius: "0.75rem" }}>
                    <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "oklch(0.35 0.08 270)" }}>
                      📞 {parent.phone}
                    </span>
                    <div style={{ display: "flex", gap: "0.4rem" }}>
                      <a
                        href={`tel:${parent.phone}`}
                        title="Appeler"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          padding: "0.35rem 0.65rem",
                          borderRadius: "0.6rem",
                          background: "oklch(0.55 0.22 142)",
                          color: "#fff",
                          textDecoration: "none",
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          gap: "0.3rem",
                        }}
                      >
                        <Phone size={13} /> Appeler
                      </a>
                      <a
                        href={`sms:${parent.phone}`}
                        title="SMS"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          padding: "0.35rem 0.65rem",
                          borderRadius: "0.6rem",
                          background: "oklch(0.60 0.22 245)",
                          color: "#fff",
                          textDecoration: "none",
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          gap: "0.3rem",
                        }}
                      >
                        <MessageCircle size={13} /> SMS
                      </a>
                    </div>
                  </div>
                )}

                {/* Linked children */}
                {linkedChildren.length > 0 && (
                  <div>
                    <div style={{ fontSize: "0.73rem", fontWeight: 600, color: "oklch(0.50 0.08 265)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.3rem" }}>
                      Enfants
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                      {linkedChildren.map((c) => (
                        <span key={c.id} style={badge("oklch(0.52 0.22 260)")}>
                          👶 {c.firstName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Link children */}
                {children.length > 0 && (
                  <div>
                    <div style={{ fontSize: "0.73rem", fontWeight: 600, color: "oklch(0.50 0.08 265)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.3rem" }}>
                      Rattacher un enfant
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                      {children.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => toggleChildLink(parent.id, c.id)}
                          style={{
                            padding: "0.2rem 0.6rem",
                            borderRadius: "9999px",
                            border: `1.5px solid ${parent.childIds.includes(c.id) ? "oklch(0.55 0.22 142)" : "oklch(0.75 0.07 260 / .5)"}`,
                            background: parent.childIds.includes(c.id) ? "oklch(0.55 0.22 142 / .12)" : "transparent",
                            color: parent.childIds.includes(c.id) ? "oklch(0.40 0.20 142)" : "oklch(0.55 0.07 265)",
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all .18s",
                          }}
                        >
                          {parent.childIds.includes(c.id) ? "✓" : "+"} {c.firstName}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


/* ─────────────────────────────────────────────
   NANIS
───────────────────────────────────────────── */
function NanisSection({
  nanis, onSaveNanis, presences, onSavePresences, crecheSections,
}: {
  nanis: Nani[];
  onSaveNanis: (n: Nani[]) => void;
  presences: NaniPresences;
  onSavePresences: (p: NaniPresences) => void;
  crecheSections: CrecheSection[];
}) {
  const [tab, setTab] = useState<"ajouter" | "liste" | "paiement">("liste");
  const [form, setForm] = useState<Omit<Nani, "id">>({ firstName: "", lastName: "", phone: "", group: "" });
  const [presenceModal, setPresenceModal] = useState<{ nani: Nani; month: string } | null>(null);
  const [dayPicker, setDayPicker] = useState<{ naniId: string; month: string; day: string } | null>(null);
  const [printPicker, setPrintPicker] = useState<{ nani: Nani } | null>(null);
  const [editNaniId, setEditNaniId] = useState<string | null>(null);

  // Tous les groupes disponibles
  const allGroups = crecheSections.flatMap((s) => s.groups);

  // Mois courant navigable "YYYY-MM"
  const todayMonth = (() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`;
  })();
  const [currentMonth, setCurrentMonth] = useState(todayMonth);
  const [printPickerMonth, setPrintPickerMonth] = useState(todayMonth);

  function prevMonth() {
    const [y, m] = currentMonth.split("-").map(Number);
    const d = new Date((y ?? 2024), (m ?? 1) - 2, 1);
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  function nextMonth() {
    const [y, m] = currentMonth.split("-").map(Number);
    const d = new Date((y ?? 2024), (m ?? 1), 1);
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  function printNaniMonth(nani: Nani, month: string) {
    const key = `${nani.id}::${month}`;
    const map: Record<string, DayStatus> = presences[key] ?? {};
    const days = daysInMonth(month);
    const label = new Date(month + "-01").toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    const nPresent = Object.values(map).filter((s) => s === "present").length;
    const nAbsent = Object.values(map).filter((s) => s === "absent").length;

    const rows = days.map((day) => {
      const status = map[day] as DayStatus | undefined;
      const dayDate = new Date(day + "T12:00:00");
      const isWeekend = dayDate.getDay() === 0 || dayDate.getDay() === 6;
      const dayLabel = dayDate.toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long" });
      const statusLabel = status === "present" ? "✅ Présente" : status === "absent" ? "❌ Absente" : isWeekend ? "🏖️ Week-end" : "—";
      const bg = status === "present" ? "#d4f7e0" : status === "absent" ? "#fde8e8" : isWeekend ? "#f3f3f7" : "#fff";
      const textStyle = isWeekend && !status ? "color:#aaa;font-style:italic" : "";
      return `<tr style="background:${bg}"><td style="padding:6px 12px;border-bottom:1px solid #eee;text-transform:capitalize;${textStyle}">${dayLabel}</td><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:700;text-align:center;${textStyle}">${statusLabel}</td></tr>`;
    }).join("");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Présences ${nani.firstName} ${nani.lastName} — ${label}</title>
    <style>body{font-family:system-ui,sans-serif;padding:2rem;color:#1a1a2e}h1{font-size:1.4rem;margin-bottom:0.25rem}h2{font-size:1rem;color:#666;font-weight:400;margin-bottom:1.5rem}
    table{width:100%;border-collapse:collapse;font-size:0.9rem}th{background:#f5f0ff;padding:8px 12px;text-align:left;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em;color:#6b5b95}
    .stats{display:flex;gap:1.5rem;margin-bottom:1.5rem}.stat{padding:0.5rem 1rem;border-radius:8px;font-weight:700;font-size:0.9rem}
    .stat-p{background:#d4f7e0;color:#1a6a3c}.stat-a{background:#fde8e8;color:#8b1a1a}
    @media print{body{padding:0.5rem}}</style></head>
    <body>
    <h1>📅 ${nani.firstName} ${nani.lastName}</h1>
    <h2>Présences — ${label}${nani.group ? ` • ${nani.group}` : ""}</h2>
    <div class="stats">
      <span class="stat stat-p">✅ ${nPresent} jour${nPresent > 1 ? "s" : ""} présente${nPresent > 1 ? "s" : ""}</span>
      <span class="stat stat-a">❌ ${nAbsent} jour${nAbsent > 1 ? "s" : ""} absente${nAbsent > 1 ? "s" : ""}</span>
    </div>
    <table><thead><tr><th>Jour</th><th style="text-align:center">Statut</th></tr></thead><tbody>${rows}</tbody></table>
    <p style="margin-top:1.5rem;font-size:0.75rem;color:#999">Imprimé le ${new Date().toLocaleDateString("fr-FR")}</p>
    <script>window.print();window.onafterprint=()=>window.close();</script>
    </body></html>`;

    const w = window.open("", "_blank", "width=700,height=900");
    w?.document.write(html);
    w?.document.close();
  }

  function addNani() {
    if (!form.firstName.trim() || !form.lastName.trim()) return;
    if (editNaniId) {
      onSaveNanis(nanis.map((n) => (n.id === editNaniId ? { id: editNaniId, ...form } : n)));
    } else {
      onSaveNanis([...nanis, { id: uid(), ...form }]);
    }
    setForm({ firstName: "", lastName: "", phone: "", group: "" });
    setEditNaniId(null);
    setTab("liste");
  }

  function startEditNani(n: Nani) {
    setForm({ firstName: n.firstName, lastName: n.lastName, phone: n.phone, group: n.group });
    setEditNaniId(n.id);
    setTab("ajouter");
  }

  function cancelNaniForm() {
    setForm({ firstName: "", lastName: "", phone: "", group: "" });
    setEditNaniId(null);
    setTab("liste");
  }

  function removeNani(id: string) {
    if (!confirm("Supprimer cette nani ?")) return;
    onSaveNanis(nanis.filter((n) => n.id !== id));
  }

  function setDayStatus(naniId: string, month: string, day: string, status: DayStatus | null) {
    const key = `${naniId}::${month}`;
    const current = { ...(presences[key] ?? {}) };
    if (status === null) {
      delete current[day];
    } else {
      current[day] = status;
    }
    onSavePresences({ ...presences, [key]: current });
    setDayPicker(null);
  }

  // Jours du mois sélectionné
  function daysInMonth(month: string): string[] {
    const [y, m] = month.split("-").map(Number);
    const count = new Date(y ?? 2024, m ?? 1, 0).getDate();
    return Array.from({ length: count }, (_, i) => {
      const d = String(i + 1).padStart(2, "0");
      return `${month}-${d}`;
    });
  }

  const monthLabel = new Date(currentMonth + "-01").toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  function countPresent(naniId: string, month: string) {
    const key = `${naniId}::${month}`;
    const map = presences[key] ?? {};
    return Object.values(map).filter((s) => s === "present").length;
  }

  return (
    <div>
      <PageHeader
        icon="👩‍🍼"
        title="Nanis"
        count={nanis.length}
        subtitle="Auxiliaires de puériculture"
        action={null}
      />

      {/* Onglets */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        {([
          { id: "liste", label: "📋 Liste", },
          { id: "ajouter", label: "➕ Ajouter" },
          { id: "paiement", label: "💰 Paiement / Présence" },
        ] as { id: "ajouter" | "liste" | "paiement"; label: string }[]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "0.5rem 1.1rem", borderRadius: "9999px", border: "none", cursor: "pointer",
              fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.85rem",
              background: tab === t.id
                ? "linear-gradient(135deg, oklch(0.60 0.22 310), oklch(0.52 0.22 260))"
                : "oklch(0.92 0.03 265)",
              color: tab === t.id ? "#fff" : "oklch(0.50 0.08 265)",
              transition: "all .18s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── ONGLET LISTE ── */}
      {tab === "liste" && (
        nanis.length === 0
          ? <EmptyState icon="👩‍🍼" text="Aucune nani enregistrée. Cliquez sur « Ajouter » pour commencer." />
          : (
            <div style={{ ...card, padding: "0", overflow: "hidden" }}>
              {/* Header */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto auto auto",
                gap: "0.75rem", alignItems: "center",
                padding: "0.6rem 1.25rem",
                background: "linear-gradient(135deg, oklch(0.60 0.22 310 / .12), oklch(0.52 0.22 260 / .12))",
                borderBottom: "1.5px solid oklch(0.85 0.05 265 / .5)",
              }}>
                {["Prénom", "Nom", "Téléphone", "Groupe", "", "", ""].map((h, i) => (
                  <div key={i} style={{ fontSize: "0.72rem", fontWeight: 700, color: "oklch(0.45 0.10 270)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</div>
                ))}
              </div>
              {nanis.map((n, idx) => (
                <div key={n.id} style={{
                  display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto auto auto",
                  gap: "0.75rem", alignItems: "center",
                  padding: "0.75rem 1.25rem",
                  borderBottom: idx < nanis.length - 1 ? "1px solid oklch(0.90 0.03 265 / .6)" : "none",
                  background: idx % 2 === 0 ? "transparent" : "oklch(0.97 0.02 265 / .3)",
                }}>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9rem", color: "oklch(0.28 0.08 270)" }}>{n.firstName}</div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9rem", color: "oklch(0.28 0.08 270)" }}>{n.lastName}</div>
                  <div style={{ fontSize: "0.85rem", color: "oklch(0.45 0.08 265)" }}>
                    {n.phone ? <a href={`tel:${n.phone}`} style={{ color: "oklch(0.45 0.20 142)", textDecoration: "none" }}>{n.phone}</a> : "—"}
                  </div>
                  <div style={{ fontSize: "0.82rem" }}>
                    {n.group ? <span style={badge("oklch(0.52 0.20 280)")}>{n.group}</span> : <span style={{ color: "oklch(0.72 0.04 265)" }}>—</span>}
                  </div>
                  <button
                    onClick={() => { setPrintPickerMonth(todayMonth); setPrintPicker({ nani: n }); }}
                    title="Imprimer le récapitulatif"
                    style={{ display: "flex", alignItems: "center", padding: "0.35rem 0.5rem", borderRadius: "0.6rem", border: "1.5px solid oklch(0.55 0.18 280 / .4)", background: "oklch(0.55 0.18 280 / .08)", color: "oklch(0.38 0.15 280)", cursor: "pointer" }}
                  >
                    🖨️
                  </button>
                  <button onClick={() => startEditNani(n)} title="Modifier" style={{ display: "flex", alignItems: "center", padding: "0.35rem 0.5rem", borderRadius: "0.6rem", border: "1.5px solid oklch(0.55 0.18 260 / .4)", background: "oklch(0.55 0.18 260 / .08)", color: "oklch(0.40 0.15 260)", cursor: "pointer" }}>
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => removeNani(n.id)} title="Supprimer" style={{ display: "flex", alignItems: "center", padding: "0.35rem 0.5rem", borderRadius: "0.6rem", border: "1.5px solid oklch(0.577 0.245 27 / .3)", background: "oklch(0.577 0.245 27 / .07)", color: "oklch(0.50 0.22 27)", cursor: "pointer" }}>
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          )
      )}

      {/* ── ONGLET AJOUTER ── */}
      {tab === "ajouter" && (
        <div style={card}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: "oklch(0.35 0.1 270)", marginBottom: "1rem" }}>
            {editNaniId ? "✏️ Modifier la nani" : "👩‍🍼 Nouvelle nani"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <Field label="Prénom *">
              <input style={inputStyle} value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} placeholder="Marie" />
            </Field>
            <Field label="Nom *">
              <input style={inputStyle} value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} placeholder="Dupont" />
            </Field>
            <Field label="Téléphone">
              <input style={inputStyle} type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="06 12 34 56 78" />
            </Field>
            <Field label="Groupe">
              <select style={inputStyle} value={form.group} onChange={(e) => setForm((f) => ({ ...f, group: e.target.value }))}>
                <option value="">— Sélectionner —</option>
                {crecheSections.map((s) => s.groups.length > 0 ? (
                  <optgroup key={s.id} label={s.name}>
                    {s.groups.map((g) => <option key={g.id} value={g.name}>{g.name}</option>)}
                  </optgroup>
                ) : null)}
                {allGroups.length === 0 && <option disabled>Créez des sections d'abord</option>}
              </select>
            </Field>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem" }}>
            <button
              onClick={addNani}
              disabled={!form.firstName.trim() || !form.lastName.trim()}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
                padding: "0.65rem 1.25rem", borderRadius: "9999px", border: "none", cursor: "pointer",
                background: form.firstName.trim() && form.lastName.trim()
                  ? "linear-gradient(135deg, oklch(0.60 0.22 142), oklch(0.48 0.22 155))"
                  : "oklch(0.88 0.04 260)",
                color: form.firstName.trim() && form.lastName.trim() ? "#fff" : "oklch(0.60 0.06 260)",
                fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9rem",
              }}
            >
              <Check size={16} /> Enregistrer
            </button>
            <button onClick={cancelNaniForm} style={{ padding: "0.65rem 1rem", borderRadius: "9999px", border: "none", background: "oklch(0.577 0.245 27 / .12)", color: "oklch(0.50 0.22 27)", fontFamily: "var(--font-display)", fontWeight: 700, cursor: "pointer" }}>
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── ONGLET PAIEMENT / PRÉSENCE ── */}
      {tab === "paiement" && (
        nanis.length === 0
          ? <EmptyState icon="💰" text="Aucune nani enregistrée. Ajoutez d'abord une nani." />
          : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {/* Navigation mois */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", marginBottom: "0.25rem" }}>
                <button onClick={prevMonth} style={{ display: "flex", alignItems: "center", padding: "0.4rem 0.75rem", borderRadius: "9999px", border: "1.5px solid oklch(0.80 0.07 260 / .5)", background: "white", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.85rem", color: "oklch(0.45 0.10 270)" }}>◄</button>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: "oklch(0.35 0.10 270)", textTransform: "capitalize", minWidth: "150px", textAlign: "center" }}>
                  {monthLabel}
                </div>
                <button onClick={nextMonth} disabled={currentMonth >= todayMonth} style={{ display: "flex", alignItems: "center", padding: "0.4rem 0.75rem", borderRadius: "9999px", border: "1.5px solid oklch(0.80 0.07 260 / .5)", background: "white", cursor: currentMonth >= todayMonth ? "not-allowed" : "pointer", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.85rem", color: currentMonth >= todayMonth ? "oklch(0.78 0.04 265)" : "oklch(0.45 0.10 270)", opacity: currentMonth >= todayMonth ? 0.5 : 1 }}>►</button>
                {currentMonth !== todayMonth && (
                  <button onClick={() => setCurrentMonth(todayMonth)} style={{ padding: "0.35rem 0.8rem", borderRadius: "9999px", border: "none", background: "oklch(0.60 0.20 260 / .12)", color: "oklch(0.42 0.16 260)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer" }}>Aujourd'hui</button>
                )}
              </div>
              {nanis.map((n) => {
                const nPresent = countPresent(n.id, currentMonth);
                const key2 = `${n.id}::${currentMonth}`;
                const map2 = presences[key2] ?? {};
                const nAbsent = Object.values(map2).filter((s) => s === "absent").length;
                return (
                  <div key={n.id} style={{ ...card, display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.95rem", color: "oklch(0.28 0.08 270)" }}>
                        {n.firstName} {n.lastName}
                      </div>
                      {n.group && <div style={{ fontSize: "0.78rem", color: "oklch(0.55 0.07 260)", marginTop: "0.15rem" }}>{n.group}</div>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                      <div style={{ display: "flex", gap: "0.4rem" }}>
                        <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "oklch(0.42 0.20 142)", background: "oklch(0.42 0.20 142 / .10)", padding: "0.2rem 0.55rem", borderRadius: "9999px" }}>✅ {nPresent}j</span>
                        {nAbsent > 0 && <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "oklch(0.50 0.22 27)", background: "oklch(0.50 0.22 27 / .10)", padding: "0.2rem 0.55rem", borderRadius: "9999px" }}>❌ {nAbsent}j</span>}
                      </div>
                      <div style={{ display: "flex", gap: "0.4rem" }}>
                        <button
                          onClick={() => setPresenceModal({ nani: n, month: currentMonth })}
                          style={{
                            display: "flex", alignItems: "center", gap: "0.35rem",
                            padding: "0.4rem 0.85rem", borderRadius: "9999px", border: "none", cursor: "pointer",
                            background: "linear-gradient(135deg, oklch(0.55 0.22 142), oklch(0.45 0.22 155))",
                            color: "#fff", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.85rem",
                            boxShadow: "0 2px 8px oklch(0.45 0.22 142 / .3)",
                          }}
                        >
                          $ Présences
                        </button>
                        <button
                          onClick={() => printNaniMonth(n, currentMonth)}
                          title="Imprimer le récapitulatif"
                          style={{
                            display: "flex", alignItems: "center", gap: "0.35rem",
                            padding: "0.4rem 0.85rem", borderRadius: "9999px", border: "1.5px solid oklch(0.55 0.18 280 / .4)",
                            background: "oklch(0.55 0.18 280 / .08)",
                            color: "oklch(0.38 0.15 280)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer",
                          }}
                        >
                          🖨️ Imprimer
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
      )}

      {/* ── MODALE PRÉSENCES ── */}
      {presenceModal && (() => {
        const { nani, month } = presenceModal;
        const key = `${nani.id}::${month}`;
        const checkedDays: Record<string, DayStatus> = presences[key] ?? {};
        const days = daysInMonth(month);
        const label = new Date(month + "-01").toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

        return (
          <div
            onClick={() => setPresenceModal(null)}
            style={{
              position: "fixed", inset: 0, zIndex: 10001,
              background: "oklch(0.15 0.08 265 / .65)", backdropFilter: "blur(6px)",
              display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "linear-gradient(160deg, oklch(0.99 0.01 265), oklch(0.96 0.03 270))",
                borderRadius: "1.5rem", boxShadow: "0 24px 80px oklch(0.30 0.15 270 / .35)",
                width: "100%", maxWidth: "520px", maxHeight: "88vh", overflowY: "auto",
                padding: "2rem", position: "relative",
              }}
            >
              <button onClick={() => setPresenceModal(null)} style={{ position: "absolute", top: "1rem", right: "1rem", background: "oklch(0.577 0.245 27 / .10)", border: "none", borderRadius: "50%", width: "2rem", height: "2rem", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "oklch(0.50 0.22 27)" }}>
                <X size={16} />
              </button>

              <div style={{ marginBottom: "1.25rem" }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.15rem", color: "oklch(0.25 0.10 270)", marginBottom: "0.75rem" }}>
                  📅 {nani.firstName} {nani.lastName}
                </div>
                {/* Navigation mois dans la modale */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                  <button
                    onClick={() => setPresenceModal({ nani, month: (() => { const [y, m] = month.split("-").map(Number); const d = new Date((y ?? 2024), (m ?? 1) - 2, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; })() })}
                    style={{ padding: "0.3rem 0.65rem", borderRadius: "9999px", border: "1.5px solid oklch(0.82 0.06 260 / .5)", background: "white", cursor: "pointer", fontWeight: 700, fontSize: "0.85rem", color: "oklch(0.45 0.10 270)" }}
                  >◄</button>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.92rem", color: "oklch(0.35 0.10 270)", textTransform: "capitalize", minWidth: "130px", textAlign: "center" }}>
                    {label}
                  </div>
                  <button
                    onClick={() => setPresenceModal({ nani, month: (() => { const [y, m] = month.split("-").map(Number); const d = new Date((y ?? 2024), (m ?? 1), 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; })() })}
                    disabled={month >= todayMonth}
                    style={{ padding: "0.3rem 0.65rem", borderRadius: "9999px", border: "1.5px solid oklch(0.82 0.06 260 / .5)", background: "white", cursor: month >= todayMonth ? "not-allowed" : "pointer", fontWeight: 700, fontSize: "0.85rem", color: month >= todayMonth ? "oklch(0.78 0.04 265)" : "oklch(0.45 0.10 270)", opacity: month >= todayMonth ? 0.5 : 1 }}
                  >►</button>
                  <button
                    onClick={() => printNaniMonth(nani, month)}
                    title="Imprimer"
                    style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.3rem 0.75rem", borderRadius: "9999px", border: "1.5px solid oklch(0.55 0.18 280 / .4)", background: "oklch(0.55 0.18 280 / .08)", color: "oklch(0.38 0.15 280)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer" }}
                  >
                    🖨️ Imprimer
                  </button>
                </div>
                <div style={{ marginTop: "0.55rem", display: "flex", gap: "0.6rem" }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "oklch(0.42 0.20 142)", background: "oklch(0.42 0.20 142 / .10)", padding: "0.2rem 0.6rem", borderRadius: "9999px" }}>
                    ✅ {Object.values(checkedDays).filter((s) => s === "present").length} présente{Object.values(checkedDays).filter((s) => s === "present").length > 1 ? "s" : ""}
                  </span>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "oklch(0.50 0.22 27)", background: "oklch(0.50 0.22 27 / .10)", padding: "0.2rem 0.6rem", borderRadius: "9999px" }}>
                    ❌ {Object.values(checkedDays).filter((s) => s === "absent").length} absent{Object.values(checkedDays).filter((s) => s === "absent").length > 1 ? "es" : "e"}
                  </span>
                </div>
              </div>

              {/* Grille des jours */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "0.45rem", position: "relative" }}>
                {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
                  <div key={i} style={{ textAlign: "center", fontSize: "0.68rem", fontWeight: 700, color: "oklch(0.60 0.07 265)", paddingBottom: "0.2rem" }}>{d}</div>
                ))}
                {/* Décalage pour le 1er jour du mois */}
                {(() => {
                  const firstDay = new Date(month + "-01").getDay();
                  const offset = firstDay === 0 ? 6 : firstDay - 1;
                  return Array.from({ length: offset }, (_, i) => <div key={`e${i}`} />);
                })()}
                {days.map((day) => {
                  const dayNum = parseInt(day.split("-")[2] ?? "0", 10);
                  const status = checkedDays[day] as DayStatus | undefined;
                  const dayDate = new Date(day + "T12:00:00");
                  const isWeekend = dayDate.getDay() === 0 || dayDate.getDay() === 6;
                  const isPickerOpen = dayPicker?.naniId === nani.id && dayPicker?.day === day;

                  const bgColor = status === "present"
                    ? "linear-gradient(135deg, oklch(0.60 0.22 142), oklch(0.48 0.22 155))"
                    : status === "absent"
                    ? "linear-gradient(135deg, oklch(0.577 0.245 27), oklch(0.50 0.22 20))"
                    : isWeekend ? "oklch(0.94 0.03 265 / .4)" : "transparent";

                  const borderColor = status === "present"
                    ? "oklch(0.52 0.22 142)"
                    : status === "absent"
                    ? "oklch(0.577 0.245 27)"
                    : isWeekend ? "oklch(0.88 0.04 265 / .4)" : "oklch(0.85 0.05 265 / .6)";

                  const textColor = status ? "#fff" : isWeekend ? "oklch(0.70 0.04 265)" : "oklch(0.35 0.08 270)";

                  return (
                    <div key={day} style={{ position: "relative" }}>
                      <button
                        onClick={() => setDayPicker(isPickerOpen ? null : { naniId: nani.id, month, day })}
                        style={{
                          width: "100%", aspectRatio: "1", borderRadius: "0.6rem", border: `1.5px solid ${borderColor}`,
                          background: bgColor, color: textColor,
                          fontSize: "0.82rem", fontWeight: status ? 700 : 500,
                          cursor: "pointer", transition: "all .14s",
                          fontFamily: "var(--font-display)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        {dayNum}
                      </button>

                      {/* Mini popup de choix */}
                      {isPickerOpen && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            position: "absolute", bottom: "calc(100% + 6px)", left: "50%",
                            transform: "translateX(-50%)",
                            zIndex: 99999,
                            background: "white",
                            borderRadius: "0.85rem",
                            boxShadow: "0 8px 32px oklch(0.20 0.10 270 / .25)",
                            border: "1.5px solid oklch(0.90 0.04 265 / .6)",
                            padding: "0.5rem",
                            display: "flex", flexDirection: "column", gap: "0.3rem",
                            minWidth: "120px",
                          }}
                        >
                          <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "oklch(0.55 0.07 265)", textAlign: "center", paddingBottom: "0.2rem", borderBottom: "1px solid oklch(0.92 0.03 265)" }}>
                            {dayNum} {label.split(" ")[0]}
                          </div>
                          <button
                            onClick={() => setDayStatus(nani.id, month, day, "present")}
                            style={{
                              padding: "0.4rem 0.7rem", borderRadius: "0.6rem", border: "none", cursor: "pointer",
                              background: status === "present" ? "oklch(0.55 0.22 142)" : "oklch(0.55 0.22 142 / .12)",
                              color: status === "present" ? "#fff" : "oklch(0.38 0.18 142)",
                              fontWeight: 700, fontSize: "0.82rem", fontFamily: "var(--font-display)",
                              display: "flex", alignItems: "center", gap: "0.35rem",
                            }}
                          >
                            ✅ Présente
                          </button>
                          <button
                            onClick={() => setDayStatus(nani.id, month, day, "absent")}
                            style={{
                              padding: "0.4rem 0.7rem", borderRadius: "0.6rem", border: "none", cursor: "pointer",
                              background: status === "absent" ? "oklch(0.577 0.245 27)" : "oklch(0.577 0.245 27 / .12)",
                              color: status === "absent" ? "#fff" : "oklch(0.50 0.22 27)",
                              fontWeight: 700, fontSize: "0.82rem", fontFamily: "var(--font-display)",
                              display: "flex", alignItems: "center", gap: "0.35rem",
                            }}
                          >
                            ❌ Absente
                          </button>
                          {status && (
                            <button
                              onClick={() => setDayStatus(nani.id, month, day, null)}
                              style={{
                                padding: "0.3rem 0.7rem", borderRadius: "0.6rem", border: "1px solid oklch(0.88 0.04 265)", cursor: "pointer",
                                background: "transparent", color: "oklch(0.60 0.06 265)",
                                fontWeight: 600, fontSize: "0.75rem", fontFamily: "var(--font-display)",
                              }}
                            >
                              ↩ Effacer
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Légende */}
              <div style={{ display: "flex", gap: "1rem", marginTop: "1.25rem", fontSize: "0.75rem", color: "oklch(0.55 0.07 260)", flexWrap: "wrap" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <span style={{ width: "12px", height: "12px", borderRadius: "3px", background: "oklch(0.55 0.22 142)", display: "inline-block" }} /> Présente
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <span style={{ width: "12px", height: "12px", borderRadius: "3px", background: "oklch(0.577 0.245 27)", display: "inline-block" }} /> Absente
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <span style={{ width: "12px", height: "12px", borderRadius: "3px", background: "oklch(0.94 0.03 265 / .6)", border: "1px solid oklch(0.85 0.05 265)", display: "inline-block" }} /> Week-end
                </span>
              </div>

              <button
                onClick={() => setPresenceModal(null)}
                style={{ width: "100%", marginTop: "1.25rem", padding: "0.65rem", borderRadius: "9999px", border: "none", cursor: "pointer", background: "linear-gradient(135deg, oklch(0.60 0.22 310), oklch(0.52 0.22 260))", color: "#fff", fontFamily: "var(--font-display)", fontWeight: 700 }}
              >
                ✓ Fermer
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

/* ─────────────────────────────────────────────
   SECTIONS & GROUPES
───────────────────────────────────────────── */
function SectionsSection({
  crecheSections,
  onSave,
}: {
  crecheSections: CrecheSection[];
  onSave: (updated: CrecheSection[]) => void;
}) {
  const [newSectionName, setNewSectionName] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newGroupNames, setNewGroupNames] = useState<Record<string, string>>({});

  function addSection() {
    const name = newSectionName.trim();
    if (!name) return;
    if (crecheSections.some((s) => s.name.toLowerCase() === name.toLowerCase())) return;
    onSave([...crecheSections, { id: uid(), name, groups: [] }]);
    setNewSectionName("");
  }

  function removeSection(id: string) {
    if (!confirm("Supprimer cette section et tous ses groupes ?")) return;
    onSave(crecheSections.filter((s) => s.id !== id));
  }

  function addGroup(sectionId: string) {
    const name = (newGroupNames[sectionId] ?? "").trim();
    if (!name) return;
    onSave(crecheSections.map((s) =>
      s.id === sectionId
        ? { ...s, groups: [...s.groups, { id: uid(), name }] }
        : s
    ));
    setNewGroupNames((prev) => ({ ...prev, [sectionId]: "" }));
  }

  function removeGroup(sectionId: string, groupId: string) {
    onSave(crecheSections.map((s) =>
      s.id === sectionId
        ? { ...s, groups: s.groups.filter((g) => g.id !== groupId) }
        : s
    ));
  }

  const totalGroups = crecheSections.reduce((acc, s) => acc + s.groups.length, 0);

  return (
    <div>
      <PageHeader
        icon="🏫"
        title="Sections & Groupes"
        count={crecheSections.length}
        subtitle={`${totalGroups} groupe${totalGroups > 1 ? "s" : ""} au total`}
        action={null}
      />

      {/* Add section form */}
      <div style={{ ...card, marginBottom: "1.25rem" }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: "oklch(0.35 0.1 270)", marginBottom: "0.85rem" }}>
          ➕ Nouvelle section
        </div>
        <div style={{ display: "flex", gap: "0.65rem" }}>
          <input
            style={{ ...inputStyle, flex: 1 }}
            value={newSectionName}
            onChange={(e) => setNewSectionName(e.target.value)}
            placeholder="ex : Bébés, Moyens, Grands…"
            onKeyDown={(e) => e.key === "Enter" && addSection()}
          />
          <button
            onClick={addSection}
            disabled={!newSectionName.trim()}
            style={{
              display: "flex", alignItems: "center", gap: "0.4rem",
              padding: "0.6rem 1.25rem", borderRadius: "9999px", border: "none", cursor: "pointer",
              background: newSectionName.trim()
                ? "linear-gradient(135deg, oklch(0.60 0.22 310), oklch(0.52 0.22 260))"
                : "oklch(0.88 0.04 260)",
              color: newSectionName.trim() ? "#fff" : "oklch(0.60 0.06 260)",
              fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9rem",
              transition: "all .18s",
            }}
          >
            <Plus size={16} /> Ajouter
          </button>
        </div>
      </div>

      {/* Sections list */}
      {crecheSections.length === 0 ? (
        <EmptyState icon="🏫" text="Aucune section créée. Commencez par ajouter une section ci-dessus." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          {crecheSections.map((sec) => {
            const isOpen = expandedId === sec.id;
            return (
              <div key={sec.id} style={{ ...card, padding: "0", overflow: "hidden" }}>
                {/* Section header */}
                <div
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "1rem 1.25rem", cursor: "pointer",
                    background: isOpen
                      ? "linear-gradient(135deg, oklch(0.60 0.22 310 / .08), oklch(0.52 0.22 260 / .08))"
                      : "transparent",
                    borderBottom: isOpen ? "1.5px solid oklch(0.88 0.05 265 / .5)" : "none",
                    transition: "background .18s",
                  }}
                  onClick={() => setExpandedId(isOpen ? null : sec.id)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{ fontSize: "1.4rem" }}>🏷️</div>
                    <div>
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: "oklch(0.30 0.10 270)" }}>
                        {sec.name}
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "oklch(0.55 0.07 260)", marginTop: "0.1rem" }}>
                        {sec.groups.length} groupe{sec.groups.length > 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "0.75rem", color: "oklch(0.55 0.07 260)", fontFamily: "var(--font-display)" }}>
                      {isOpen ? "▲ Fermer" : "▼ Gérer les groupes"}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeSection(sec.id); }}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "oklch(0.60 0.15 27)", padding: "0.3rem", borderRadius: "0.5rem" }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* Groups panel */}
                {isOpen && (
                  <div style={{ padding: "1rem 1.25rem" }}>
                    {/* Groups list */}
                    {sec.groups.length === 0 ? (
                      <p style={{ fontSize: "0.85rem", color: "oklch(0.60 0.06 260)", marginBottom: "0.85rem" }}>
                        Aucun groupe dans cette section.
                      </p>
                    ) : (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
                        {sec.groups.map((g) => (
                          <div
                            key={g.id}
                            style={{
                              display: "inline-flex", alignItems: "center", gap: "0.4rem",
                              padding: "0.3rem 0.85rem",
                              background: "linear-gradient(135deg, oklch(0.60 0.22 310 / .10), oklch(0.52 0.22 260 / .10))",
                              border: "1.5px solid oklch(0.70 0.12 280 / .3)",
                              borderRadius: "9999px",
                              fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.85rem",
                              color: "oklch(0.42 0.14 280)",
                            }}
                          >
                            {g.name}
                            <button
                              onClick={() => removeGroup(sec.id, g.id)}
                              style={{ background: "none", border: "none", cursor: "pointer", color: "oklch(0.65 0.12 27)", padding: "0", lineHeight: 1, display: "flex" }}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add group */}
                    <div style={{ display: "flex", gap: "0.55rem" }}>
                      <input
                        style={{ ...inputStyle, flex: 1, fontSize: "0.85rem" }}
                        value={newGroupNames[sec.id] ?? ""}
                        onChange={(e) => setNewGroupNames((prev) => ({ ...prev, [sec.id]: e.target.value }))}
                        placeholder="Nom du groupe…"
                        onKeyDown={(e) => e.key === "Enter" && addGroup(sec.id)}
                      />
                      <button
                        onClick={() => addGroup(sec.id)}
                        style={{
                          display: "flex", alignItems: "center", gap: "0.3rem",
                          padding: "0.5rem 1rem", borderRadius: "9999px", border: "none", cursor: "pointer",
                          background: "oklch(0.55 0.22 142 / .15)", color: "oklch(0.38 0.18 142)",
                          fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.82rem",
                        }}
                      >
                        <Plus size={14} /> Groupe
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   SHARED UI COMPONENTS
───────────────────────────────────────────── */
function PageHeader({
  icon,
  title,
  count,
  subtitle,
  action,
}: {
  icon: string;
  title: string;
  count?: number;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
      <div>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.5rem",
            fontWeight: 700,
            margin: 0,
            background: "linear-gradient(135deg, oklch(0.60 0.22 310), oklch(0.52 0.22 260))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          {icon} {title}
          {count !== undefined && (
            <span style={{ fontSize: "1rem", background: "oklch(0.52 0.22 280 / .15)", WebkitTextFillColor: "oklch(0.52 0.22 280)", padding: "0.1rem 0.55rem", borderRadius: "9999px" }}>
              {count}
            </span>
          )}
        </h1>
        {subtitle && <p style={{ margin: "0.15rem 0 0", fontSize: "0.85rem", color: "oklch(0.50 0.08 265)" }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.95rem", color: "oklch(0.40 0.10 270)", marginBottom: "0.25rem" }}>
      {children}
    </div>
  );
}

function Field({
  label,
  children,
  span,
}: {
  label: string;
  children: React.ReactNode;
  span?: boolean;
}) {
  return (
    <div style={span ? { gridColumn: "1 / -1" } : {}}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: "0.73rem", fontWeight: 600, color: "oklch(0.55 0.07 260)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.15rem" }}>{label}</div>
      <div style={{ fontSize: "0.92rem", fontWeight: 600, color: "oklch(0.30 0.08 270)" }}>{value || "—"}</div>
    </div>
  );
}
