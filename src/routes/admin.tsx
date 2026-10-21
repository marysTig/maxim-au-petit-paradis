import { createFileRoute, redirect } from "@tanstack/react-router";
import { AUTH_KEY } from "./accullie";
import { useState, useEffect } from "react";
import {
  Users,
  Baby,
  ClipboardCheck,
  CreditCard,
  LogOut,
  Plus,
  X,
  Check,
  Clock,
  ChevronRight,
  ArrowLeft,
  Phone,
  MessageCircle,
  AlertCircle,
  CheckCircle2,
  Timer,
  Euro,
} from "lucide-react";

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

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  section: string;
  parentIds: string[];
  allergies: string;
  notes: string;
}

interface AttendanceRecord {
  childId: string;
  date: string; // YYYY-MM-DD
  arrival: string | null;
  departure: string | null;
}

interface Payment {
  id: string;
  childId: string;
  month: string; // YYYY-MM
  amount: number;
  status: "paid" | "pending" | "late";
  paidAt: string | null;
}

type Section = "children" | "profile" | "attendance" | "payments" | "parents";

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
    if (
      typeof sessionStorage !== "undefined" &&
      sessionStorage.getItem(AUTH_KEY) !== "true"
    ) {
      throw redirect({ to: "/accullie" });
    }
  },
  component: AdminDashboard,
});

/* ─────────────────────────────────────────────
   LOCAL-STORAGE HELPERS
───────────────────────────────────────────── */
function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function nowStr() {
  return new Date().toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
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
   MAIN DASHBOARD
───────────────────────────────────────────── */
function AdminDashboard() {
  const [section, setSection] = useState<Section>("children");
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // SSR-safe: always init with [] then load from localStorage on client mount
  const [children, setChildren] = useState<Child[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage after hydration (client only)
  useEffect(() => {
    setChildren(load("db_children", []));
    setParents(load("db_parents", []));
    setAttendance(load("db_attendance", []));
    setPayments(load("db_payments", []));
    setLoaded(true);
  }, []);

  // Persist on change — only after initial load to avoid overwriting with []
  useEffect(() => { if (loaded) save("db_children", children); }, [children, loaded]);
  useEffect(() => { if (loaded) save("db_parents", parents); }, [parents, loaded]);
  useEffect(() => { if (loaded) save("db_attendance", attendance); }, [attendance, loaded]);
  useEffect(() => { if (loaded) save("db_payments", payments); }, [payments, loaded]);

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
    { id: "attendance", label: "Pointage", icon: <ClipboardCheck size={20} /> },
    { id: "payments", label: "Paiements", icon: <CreditCard size={20} /> },
    { id: "parents", label: "Parents", icon: <Users size={20} /> },
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
          <div style={{ marginBottom: "0.3rem" }}>
            👨‍👩‍👧 {parents.length} parent{parents.length > 1 ? "s" : ""}
          </div>
          <div>
            ✅{" "}
            {
              attendance.filter(
                (a) => a.date === todayStr() && a.arrival
              ).length
            }{" "}
            présent{attendance.filter((a) => a.date === todayStr() && a.arrival).length > 1 ? "s" : ""} aujourd'hui
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

        {/* Sections */}
        {section === "children" && (
          <ChildrenSection
            children={children}
            setChildren={setChildren}
            parents={parents}
            setParents={setParents}
            onViewProfile={openProfile}
          />
        )}
        {section === "profile" && selectedChild && (
          <ChildProfile
            child={selectedChild}
            parents={parents}
            attendance={attendance}
            payments={payments}
            onBack={() => navTo("children")}
          />
        )}
        {section === "attendance" && (
          <AttendanceSection
            children={children}
            attendance={attendance}
            setAttendance={setAttendance}
          />
        )}
        {section === "payments" && (
          <PaymentsSection
            children={children}
            payments={payments}
            setPayments={setPayments}
          />
        )}
        {section === "parents" && (
          <ParentsSection
            parents={parents}
            setParents={setParents}
            children={children}
          />
        )}
      </main>

      {/* Responsive styles */}
      <style>{`
        @media (min-width: 768px) {
          .admin-sidebar { transform: translateX(0) !important; position: sticky !important; height: 100vh !important; }
          .admin-main    { margin-left: 0 !important; }
          .admin-topbar  { display: none !important; }
        }
        @media (max-width: 767px) {
          .admin-topbar { display: flex !important; }
          .admin-main   { padding-top: 0 !important; }
        }
      `}</style>
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
}: {
  children: Child[];
  setChildren: React.Dispatch<React.SetStateAction<Child[]>>;
  parents: Parent[];
  setParents: React.Dispatch<React.SetStateAction<Parent[]>>;
  onViewProfile: (c: Child) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<Child, "id">>({
    firstName: "",
    lastName: "",
    birthDate: "",
    section: "Bébés",
    parentIds: [],
    allergies: "",
    notes: "",
  });
  const [search, setSearch] = useState("");

  function addChild() {
    if (!form.firstName.trim() || !form.lastName.trim()) return;
    const newChild: Child = { id: uid(), ...form };
    setChildren((prev) => [...prev, newChild]);
    setForm({ firstName: "", lastName: "", birthDate: "", section: "Bébés", parentIds: [], allergies: "", notes: "" });
    setShowForm(false);
  }

  function removeChild(id: string) {
    if (!confirm("Supprimer cet enfant ?")) return;
    setChildren((prev) => prev.filter((c) => c.id !== id));
    setParents((prev) =>
      prev.map((p) => ({ ...p, childIds: p.childIds.filter((cid) => cid !== id) }))
    );
  }

  const filtered = children.filter((c) =>
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

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
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "1.05rem",
              color: "oklch(0.35 0.1 270)",
              marginBottom: "1rem",
            }}
          >
            ✏️ Nouvel enfant
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <Field label="Prénom *">
              <input style={inputStyle} value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} placeholder="Léa" />
            </Field>
            <Field label="Nom *">
              <input style={inputStyle} value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} placeholder="Martin" />
            </Field>
            <Field label="Date de naissance">
              <input style={inputStyle} type="date" value={form.birthDate} onChange={(e) => setForm((f) => ({ ...f, birthDate: e.target.value }))} />
            </Field>
            <Field label="Section">
              <select style={inputStyle} value={form.section} onChange={(e) => setForm((f) => ({ ...f, section: e.target.value }))}>
                <option>Bébés</option>
                <option>Moyens</option>
                <option>Grands</option>
              </select>
            </Field>
            <Field label="Allergies" span>
              <input style={inputStyle} value={form.allergies} onChange={(e) => setForm((f) => ({ ...f, allergies: e.target.value }))} placeholder="ex : arachides, lactose…" />
            </Field>
            <Field label="Notes" span>
              <input style={inputStyle} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Informations complémentaires…" />
            </Field>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
            <button onClick={addChild} className="kid-btn bg-kid-green" style={{ flex: 1 }}>
              <span className="relative z-10 flex items-center gap-2 justify-center">
                <Check size={16} /> Enregistrer
              </span>
            </button>
            <button onClick={() => setShowForm(false)} className="kid-btn bg-kid-pink" style={{ flex: 1 }}>
              <span className="relative z-10 flex items-center gap-2 justify-center">
                <X size={16} /> Annuler
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: "1rem" }}>
        <input
          style={{ ...inputStyle, padding: "0.65rem 1rem" }}
          placeholder="🔍 Rechercher un enfant…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Children list */}
      {filtered.length === 0 ? (
        <EmptyState icon="👶" text="Aucun enfant enregistré. Cliquez sur « Ajouter » pour commencer." />
      ) : (
        <div style={{ ...card, padding: "0", overflow: "hidden" }}>
          {/* Table header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr 1fr auto",
              padding: "0.65rem 1.25rem",
              background: "linear-gradient(135deg, oklch(0.60 0.22 310 / .12), oklch(0.52 0.22 260 / .12))",
              borderBottom: "1.5px solid oklch(0.85 0.05 265 / .5)",
              gap: "0.5rem",
            }}
          >
            {["Nom & naissance", "Âge", "Section", "Allergies", ""].map((h) => (
              <div
                key={h}
                style={{
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
            const age = child.birthDate
              ? Math.floor((Date.now() - new Date(child.birthDate).getTime()) / (365.25 * 86400000))
              : null;
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
                {/* Ligne principale */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 1fr 1fr auto",
                    alignItems: "start",
                    padding: "0.8rem 1.25rem 0.4rem",
                    gap: "0.5rem",
                  }}
                >
                  {/* Nom + Date naissance */}
                  <div>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.97rem", color: "oklch(0.25 0.08 270)" }}>
                      {child.firstName} {child.lastName}
                    </div>
                    {child.birthDate && (
                      <div style={{ fontSize: "0.74rem", color: "oklch(0.55 0.06 260)", marginTop: "0.15rem" }}>
                        📅 Né{child.firstName.endsWith("a") ? "e" : ""} le{" "}
                        {new Date(child.birthDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
                      </div>
                    )}
                  </div>

                  {/* Âge */}
                  <div style={{ fontSize: "0.9rem", color: "oklch(0.38 0.08 270)", fontWeight: 700 }}>
                    {age !== null ? <>{age} <span style={{ fontWeight: 500, fontSize: "0.8rem" }}>an{age > 1 ? "s" : ""}</span></> : "—"}
                  </div>

                  {/* Section */}
                  <div style={{ paddingTop: "0.1rem" }}>
                    <span style={badge(sectionColors[child.section] ?? "oklch(0.55 0.15 260)")}>
                      {child.section}
                    </span>
                  </div>

                  {/* Allergies */}
                  <div style={{ fontSize: "0.82rem", paddingTop: "0.05rem" }}>
                    {child.allergies ? (
                      <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "oklch(0.48 0.20 27)" }}>
                        <AlertCircle size={13} />{child.allergies}
                      </span>
                    ) : (
                      <span style={{ color: "oklch(0.72 0.04 265)" }}>—</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    <button
                      onClick={() => onViewProfile(child)}
                      title="Voir la fiche"
                      style={{
                        display: "flex", alignItems: "center", gap: "0.3rem",
                        padding: "0.35rem 0.7rem", borderRadius: "0.6rem",
                        border: "1.5px solid oklch(0.65 0.17 260 / .4)",
                        background: "oklch(0.65 0.17 260 / .1)",
                        color: "oklch(0.38 0.15 260)", cursor: "pointer",
                        fontWeight: 700, fontSize: "0.78rem",
                        fontFamily: "var(--font-display)", whiteSpace: "nowrap",
                      }}
                    >
                      <ChevronRight size={13} /> Fiche
                    </button>
                    <button
                      onClick={() => removeChild(child.id)}
                      title="Supprimer"
                      style={{
                        display: "flex", alignItems: "center",
                        padding: "0.35rem 0.55rem", borderRadius: "0.6rem",
                        border: "1.5px solid oklch(0.577 0.245 27 / .3)",
                        background: "oklch(0.577 0.245 27 / .07)",
                        color: "oklch(0.50 0.22 27)", cursor: "pointer",
                      }}
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>

                {/* Ligne secondaire : parents + notes */}
                {(linkedParents.length > 0 || child.notes) && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", padding: "0 1.25rem 0.8rem", alignItems: "center" }}>
                    {linkedParents.length > 0 && (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "oklch(0.55 0.07 265)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Parents :</span>
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
                    {child.notes && (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.2rem 0.65rem", borderRadius: "0.5rem", background: "oklch(0.96 0.04 265 / .4)", border: "1px solid oklch(0.85 0.06 265 / .5)", fontSize: "0.8rem", color: "oklch(0.42 0.08 265)", fontStyle: "italic" }}>
                        📝 {child.notes}
                      </div>
                    )}
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
   2. CHILD PROFILE
───────────────────────────────────────────── */
function ChildProfile({
  child,
  parents,
  attendance,
  payments,
  onBack,
}: {
  child: Child;
  parents: Parent[];
  attendance: AttendanceRecord[];
  payments: Payment[];
  onBack: () => void;
}) {
  const childParents = parents.filter((p) => child.parentIds.includes(p.id));
  const childAttendance = attendance
    .filter((a) => a.childId === child.id)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 15);
  const childPayments = payments
    .filter((p) => p.childId === child.id)
    .sort((a, b) => b.month.localeCompare(a.month));

  const age = child.birthDate
    ? Math.floor((Date.now() - new Date(child.birthDate).getTime()) / (365.25 * 86400000))
    : null;

  const statusColor = { paid: "oklch(0.55 0.22 142)", pending: "oklch(0.65 0.18 65)", late: "oklch(0.55 0.22 27)" };
  const statusLabel = { paid: "Payé", pending: "En attente", late: "En retard" };

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

        {/* Recent attendance */}
        <div style={card}>
          <SectionTitle>📅 Présences récentes</SectionTitle>
          {childAttendance.length === 0 ? (
            <p style={{ fontSize: "0.85rem", color: "oklch(0.60 0.05 260)", marginTop: "0.5rem" }}>Aucune présence enregistrée.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginTop: "0.6rem" }}>
              {childAttendance.map((a) => (
                <div key={`${a.childId}-${a.date}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.4rem 0.65rem", background: "oklch(0.97 0.02 265 / .5)", borderRadius: "0.65rem", fontSize: "0.82rem" }}>
                  <span style={{ color: "oklch(0.40 0.07 265)" }}>{new Date(a.date).toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" })}</span>
                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    {a.arrival && <span style={badge("oklch(0.55 0.22 142)")}>▶ {a.arrival}</span>}
                    {a.departure && <span style={badge("oklch(0.55 0.18 27)")}>◼ {a.departure}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payments */}
        <div style={{ ...card, gridColumn: "1 / -1" }}>
          <SectionTitle>💳 Historique paiements</SectionTitle>
          {childPayments.length === 0 ? (
            <p style={{ fontSize: "0.85rem", color: "oklch(0.60 0.05 260)", marginTop: "0.5rem" }}>Aucun paiement enregistré.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginTop: "0.6rem" }}>
              {childPayments.map((p) => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.55rem 0.85rem", background: "oklch(0.97 0.02 265 / .5)", borderRadius: "0.75rem" }}>
                  <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "oklch(0.35 0.08 270)" }}>
                    {new Date(p.month + "-01").toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ fontWeight: 700, color: "oklch(0.35 0.08 270)" }}>{p.amount} €</span>
                    <span style={badge(statusColor[p.status])}>{statusLabel[p.status]}</span>
                  </div>
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
   3. ATTENDANCE / POINTAGE
───────────────────────────────────────────── */
function AttendanceSection({
  children,
  attendance,
  setAttendance,
}: {
  children: Child[];
  attendance: AttendanceRecord[];
  setAttendance: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
}) {
  const today = todayStr();

  function getRecord(childId: string) {
    return attendance.find((a) => a.childId === childId && a.date === today);
  }

  function markArrival(childId: string) {
    const existing = getRecord(childId);
    if (existing) {
      setAttendance((prev) =>
        prev.map((a) =>
          a.childId === childId && a.date === today
            ? { ...a, arrival: nowStr() }
            : a
        )
      );
    } else {
      setAttendance((prev) => [
        ...prev,
        { childId, date: today, arrival: nowStr(), departure: null },
      ]);
    }
  }

  function markDeparture(childId: string) {
    const existing = getRecord(childId);
    if (!existing) return;
    setAttendance((prev) =>
      prev.map((a) =>
        a.childId === childId && a.date === today
          ? { ...a, departure: nowStr() }
          : a
      )
    );
  }

  const dateLabel = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const present = children.filter((c) => {
    const r = getRecord(c.id);
    return r?.arrival && !r?.departure;
  }).length;
  const departed = children.filter((c) => getRecord(c.id)?.departure).length;
  const absent = children.length - present - departed;

  return (
    <div>
      <PageHeader icon="📋" title="Pointage du jour" subtitle={dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)} />

      {/* Summary stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginBottom: "1.25rem" }}>
        {[
          { label: "Présents", count: present, color: "oklch(0.55 0.22 142)", icon: "✅" },
          { label: "Partis", count: departed, color: "oklch(0.55 0.18 27)", icon: "🏠" },
          { label: "Non arrivés", count: absent, color: "oklch(0.55 0.07 260)", icon: "⏳" },
        ].map((s) => (
          <div key={s.label} style={{ ...card, textAlign: "center", padding: "1rem" }}>
            <div style={{ fontSize: "1.5rem", marginBottom: "0.2rem" }}>{s.icon}</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", fontWeight: 700, color: s.color }}>{s.count}</div>
            <div style={{ fontSize: "0.78rem", color: "oklch(0.55 0.07 260)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {children.length === 0 ? (
        <EmptyState icon="📋" text="Ajoutez des enfants pour commencer le pointage." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {children.map((child) => {
            const rec = getRecord(child.id);
            const hasArrived = !!rec?.arrival;
            const hasDeparted = !!rec?.departure;

            return (
              <div
                key={child.id}
                style={{
                  ...card,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.9rem 1.25rem",
                  flexWrap: "wrap",
                  gap: "0.75rem",
                  borderLeft: hasArrived && !hasDeparted
                    ? "4px solid oklch(0.55 0.22 142)"
                    : hasDeparted
                    ? "4px solid oklch(0.60 0.15 260)"
                    : "4px solid oklch(0.85 0.05 260)",
                }}
              >
                <div style={{ flex: 1, minWidth: "140px" }}>
                  <div style={{ fontWeight: 700, fontFamily: "var(--font-display)", color: "oklch(0.28 0.08 270)" }}>
                    {child.firstName} {child.lastName}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "oklch(0.55 0.07 260)" }}>{child.section}</div>
                </div>

                {/* Time badges */}
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                  {rec?.arrival && (
                    <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", ...badge("oklch(0.55 0.22 142)") }}>
                      <Clock size={12} /> Arrivée : {rec.arrival}
                    </span>
                  )}
                  {rec?.departure && (
                    <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", ...badge("oklch(0.55 0.18 27)") }}>
                      <Timer size={12} /> Départ : {rec.departure}
                    </span>
                  )}
                </div>

                {/* Buttons */}
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() => markArrival(child.id)}
                    disabled={hasArrived}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      padding: "0.4rem 0.85rem",
                      borderRadius: "9999px",
                      border: "none",
                      cursor: hasArrived ? "default" : "pointer",
                      background: hasArrived
                        ? "oklch(0.90 0.05 142)"
                        : "linear-gradient(135deg, oklch(0.65 0.22 142), oklch(0.50 0.24 152))",
                      color: hasArrived ? "oklch(0.55 0.22 142)" : "#fff",
                      fontWeight: 700,
                      fontSize: "0.82rem",
                      fontFamily: "var(--font-display)",
                      transition: "opacity .2s",
                      opacity: hasArrived ? 0.6 : 1,
                    }}
                  >
                    <CheckCircle2 size={14} /> Arrivée
                  </button>
                  <button
                    onClick={() => markDeparture(child.id)}
                    disabled={!hasArrived || hasDeparted}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      padding: "0.4rem 0.85rem",
                      borderRadius: "9999px",
                      border: "none",
                      cursor: !hasArrived || hasDeparted ? "default" : "pointer",
                      background:
                        hasDeparted
                          ? "oklch(0.90 0.05 27)"
                          : !hasArrived
                          ? "oklch(0.92 0.02 260)"
                          : "linear-gradient(135deg, oklch(0.65 0.18 27), oklch(0.50 0.22 37))",
                      color: hasDeparted
                        ? "oklch(0.55 0.18 27)"
                        : !hasArrived
                        ? "oklch(0.65 0.05 260)"
                        : "#fff",
                      fontWeight: 700,
                      fontSize: "0.82rem",
                      fontFamily: "var(--font-display)",
                      opacity: !hasArrived || hasDeparted ? 0.6 : 1,
                    }}
                  >
                    <Timer size={14} /> Départ
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   4. PAYMENTS
───────────────────────────────────────────── */
function PaymentsSection({
  children,
  payments,
  setPayments,
}: {
  children: Child[];
  payments: Payment[];
  setPayments: React.Dispatch<React.SetStateAction<Payment[]>>;
}) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [quickForm, setQuickForm] = useState<{ childId: string; month: string; amount: number; status: Payment["status"] } | null>(null);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);

  const statusColor: Record<Payment["status"], string> = {
    paid: "oklch(0.55 0.22 142)",
    pending: "oklch(0.65 0.18 65)",
    late: "oklch(0.55 0.22 27)",
  };
  const statusLabel: Record<Payment["status"], string> = {
    paid: "\u2705 Pay\u00e9",
    pending: "\u23f3 En attente",
    late: "\ud83d\udd34 En retard",
  };

  function getPaymentForMonth(childId: string, month: string) {
    return payments.find((p) => p.childId === childId && p.month === month);
  }

  function openQuickForm(childId: string) {
    setQuickForm({ childId, month: currentMonth, amount: 350, status: "paid" });
    setExpandedHistory(null);
  }

  function saveQuickPayment() {
    if (!quickForm) return;
    const existing = getPaymentForMonth(quickForm.childId, quickForm.month);
    if (existing) {
      setPayments((prev) =>
        prev.map((p) =>
          p.id === existing.id
            ? { ...p, amount: quickForm.amount, status: quickForm.status, paidAt: quickForm.status === "paid" ? new Date().toLocaleDateString("fr-FR") : p.paidAt }
            : p
        )
      );
    } else {
      setPayments((prev) => [
        ...prev,
        {
          id: uid(), childId: quickForm.childId, month: quickForm.month,
          amount: quickForm.amount, status: quickForm.status,
          paidAt: quickForm.status === "paid" ? new Date().toLocaleDateString("fr-FR") : null,
        },
      ]);
    }
    setQuickForm(null);
  }

  function updateStatus(id: string, status: Payment["status"]) {
    setPayments((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status, paidAt: status === "paid" ? new Date().toLocaleDateString("fr-FR") : p.paidAt } : p
      )
    );
  }

  function removePayment(id: string) {
    if (!confirm("Supprimer ce paiement ?")) return;
    setPayments((prev) => prev.filter((p) => p.id !== id));
  }


  const total = payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const pendingCount = payments.filter((p) => p.status === "pending").length;
  const lateCount = payments.filter((p) => p.status === "late").length;
  const monthLabel = new Date(currentMonth + "-01").toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  return (
    <div>
      <PageHeader
        icon="💳"
        title="Paiements & Abonnements"
        subtitle={`Mois en cours : ${monthLabel}`}
      />

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginBottom: "1.25rem" }}>
        {[
          { label: "Total encaissé", value: `${total} €`, color: "oklch(0.45 0.20 142)", icon: <Euro size={18} /> },
          { label: "En attente", value: `${pendingCount}`, color: "oklch(0.55 0.18 65)", icon: <Clock size={18} /> },
          { label: "En retard", value: `${lateCount}`, color: "oklch(0.50 0.22 27)", icon: <AlertCircle size={18} /> },
        ].map((s) => (
          <div key={s.label} style={{ ...card, padding: "1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ color: s.color, opacity: 0.8 }}>{s.icon}</div>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: "0.75rem", color: "oklch(0.55 0.07 260)" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Children payment table */}
      {children.length === 0 ? (
        <EmptyState icon="💳" text="Ajoutez des enfants pour gérer les paiements." />
      ) : (
        <div style={{ ...card, padding: "0", overflow: "hidden" }}>
          {/* Header */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", padding: "0.65rem 1.25rem", background: "linear-gradient(135deg, oklch(0.60 0.22 310 / .12), oklch(0.52 0.22 260 / .12))", borderBottom: "1.5px solid oklch(0.85 0.05 265 / .5)", gap: "0.75rem" }}>
            {[`Enfant (${children.length})`, `Statut — ${monthLabel}`, "Montant", ""].map((h) => (
              <div key={h} style={{ fontSize: "0.72rem", fontWeight: 700, color: "oklch(0.45 0.10 270)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</div>
            ))}
          </div>

          {children.map((child, idx) => {
            const currentPayment = getPaymentForMonth(child.id, currentMonth);
            const childPayments = payments.filter((p) => p.childId === child.id).sort((a, b) => b.month.localeCompare(a.month));
            const isExpanded = expandedHistory === child.id;
            const isQuickOpen = quickForm?.childId === child.id;

            return (
              <div key={child.id} style={{ borderBottom: idx < children.length - 1 ? "1px solid oklch(0.90 0.03 265 / .5)" : "none" }}>
                {/* Main row */}
                <div
                  style={{
                    display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto",
                    alignItems: "center", padding: "0.85rem 1.25rem", gap: "0.75rem",
                    background: idx % 2 === 0 ? "transparent" : "oklch(0.97 0.02 265 / .3)",
                    transition: "background .15s",
                    borderLeft: currentPayment ? `4px solid ${statusColor[currentPayment.status]}` : "4px solid oklch(0.88 0.05 265)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "oklch(0.94 0.04 265 / .5)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? "transparent" : "oklch(0.97 0.02 265 / .3)")}
                >
                  {/* Nom */}
                  <div>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.95rem", color: "oklch(0.25 0.08 270)" }}>
                      {child.firstName} {child.lastName}
                    </div>
                    <div style={{ fontSize: "0.74rem", color: "oklch(0.57 0.07 260)", marginTop: "0.1rem" }}>
                      {child.section} · {childPayments.length} paiement{childPayments.length > 1 ? "s" : ""} enregistré{childPayments.length > 1 ? "s" : ""}
                    </div>
                  </div>

                  {/* Statut mois en cours */}
                  <div>
                    {currentPayment ? (
                      <select
                        value={currentPayment.status}
                        onChange={(e) => updateStatus(currentPayment.id, e.target.value as Payment["status"])}
                        style={{ ...inputStyle, width: "auto", padding: "0.3rem 0.6rem", fontSize: "0.8rem" }}
                      >
                        <option value="paid">✅ Payé</option>
                        <option value="pending">⏳ En attente</option>
                        <option value="late">🔴 En retard</option>
                      </select>
                    ) : (
                      <span style={{ fontSize: "0.8rem", color: "oklch(0.65 0.05 265)", fontStyle: "italic" }}>— Non enregistré</span>
                    )}
                  </div>

                  {/* Montant */}
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: currentPayment ? "oklch(0.30 0.08 270)" : "oklch(0.70 0.04 265)" }}>
                    {currentPayment ? `${currentPayment.amount} €` : "—"}
                    {currentPayment?.paidAt && (
                      <div style={{ fontSize: "0.7rem", fontWeight: 400, color: "oklch(0.58 0.06 265)" }}>le {currentPayment.paidAt}</div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    <button
                      onClick={() => isQuickOpen ? setQuickForm(null) : openQuickForm(child.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: "0.3rem",
                        padding: "0.35rem 0.7rem", borderRadius: "0.6rem",
                        border: "1.5px solid oklch(0.55 0.22 142 / .4)",
                        background: isQuickOpen ? "oklch(0.55 0.22 142 / .15)" : "oklch(0.55 0.22 142 / .08)",
                        color: "oklch(0.38 0.18 142)", cursor: "pointer",
                        fontWeight: 700, fontSize: "0.78rem",
                        fontFamily: "var(--font-display)", whiteSpace: "nowrap",
                      }}
                    >
                      {isQuickOpen ? <X size={13} /> : <Plus size={13} />}
                      {currentPayment ? "Modifier" : "Ajouter"}
                    </button>
                    <button
                      onClick={() => setExpandedHistory(isExpanded ? null : child.id)}
                      title="Historique des paiements"
                      style={{
                        display: "flex", alignItems: "center",
                        padding: "0.35rem 0.55rem", borderRadius: "0.6rem",
                        border: "1.5px solid oklch(0.65 0.17 260 / .4)",
                        background: isExpanded ? "oklch(0.65 0.17 260 / .15)" : "oklch(0.65 0.17 260 / .07)",
                        color: "oklch(0.40 0.12 260)", cursor: "pointer",
                      }}
                    >
                      <Clock size={13} />
                    </button>
                    {currentPayment && (
                      <button
                        onClick={() => removePayment(currentPayment.id)}
                        style={{ display: "flex", alignItems: "center", padding: "0.35rem 0.45rem", borderRadius: "0.6rem", border: "1.5px solid oklch(0.577 0.245 27 / .3)", background: "oklch(0.577 0.245 27 / .07)", color: "oklch(0.50 0.22 27)", cursor: "pointer" }}
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Formulaire rapide inline */}
                {isQuickOpen && (
                  <div style={{ padding: "0.75rem 1.25rem 1rem", background: "oklch(0.96 0.03 265 / .5)", borderTop: "1px solid oklch(0.88 0.05 265 / .4)" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "0.65rem", alignItems: "end" }}>
                      <Field label="Mois">
                        <input style={inputStyle} type="month" value={quickForm!.month} onChange={(e) => setQuickForm((f) => f ? { ...f, month: e.target.value } : f)} />
                      </Field>
                      <Field label="Montant (€)">
                        <input style={inputStyle} type="number" min={0} value={quickForm!.amount} onChange={(e) => setQuickForm((f) => f ? { ...f, amount: Number(e.target.value) } : f)} />
                      </Field>
                      <Field label="Statut">
                        <select style={inputStyle} value={quickForm!.status} onChange={(e) => setQuickForm((f) => f ? { ...f, status: e.target.value as Payment["status"] } : f)}>
                          <option value="paid">✅ Payé</option>
                          <option value="pending">⏳ En attente</option>
                          <option value="late">🔴 En retard</option>
                        </select>
                      </Field>
                      <button onClick={saveQuickPayment} style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.6rem 1rem", borderRadius: "0.75rem", border: "none", background: "linear-gradient(135deg, oklch(0.60 0.22 142), oklch(0.48 0.22 155))", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: "0.85rem", fontFamily: "var(--font-display)", whiteSpace: "nowrap" }}>
                        <Check size={15} /> Enregistrer
                      </button>
                    </div>
                  </div>
                )}

                {/* Historique dépliable */}
                {isExpanded && (
                  <div style={{ padding: "0.6rem 1.25rem 0.9rem", background: "oklch(0.97 0.02 265 / .3)", borderTop: "1px solid oklch(0.88 0.05 265 / .3)" }}>
                    <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "oklch(0.55 0.07 265)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
                      Historique des paiements
                    </div>
                    {childPayments.length === 0 ? (
                      <p style={{ fontSize: "0.82rem", color: "oklch(0.60 0.05 265)", fontStyle: "italic" }}>Aucun paiement enregistré.</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                        {childPayments.map((p) => (
                          <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.4rem 0.7rem", background: "oklch(1 0 0 / .6)", borderRadius: "0.6rem", borderLeft: `3px solid ${statusColor[p.status]}` }}>
                            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "oklch(0.35 0.08 270)" }}>
                              {new Date(p.month + "-01").toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
                              {p.paidAt && <span style={{ fontWeight: 400, color: "oklch(0.58 0.06 265)", marginLeft: "0.4rem" }}>· le {p.paidAt}</span>}
                            </span>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                              <span style={{ fontWeight: 700, color: "oklch(0.32 0.08 270)" }}>{p.amount} €</span>
                              <span style={badge(statusColor[p.status])}>{statusLabel[p.status]}</span>
                              <button onClick={() => removePayment(p.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "oklch(0.60 0.15 27)", display: "flex" }}>
                                <X size={13} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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
   5. PARENTS
───────────────────────────────────────────── */
function ParentsSection({
  parents,
  setParents,
  children,
}: {
  parents: Parent[];
  setParents: React.Dispatch<React.SetStateAction<Parent[]>>;
  children: Child[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<Parent, "id">>({
    name: "",
    phone: "",
    email: "",
    childIds: [],
  });
  const [search, setSearch] = useState("");

  function addParent() {
    if (!form.name.trim()) return;
    const newParent: Parent = { id: uid(), ...form };
    setParents((prev) => [...prev, newParent]);
    // Link parent to selected children
    form.childIds.forEach((cid) => {
      // handled via childIds
    });
    setForm({ name: "", phone: "", email: "", childIds: [] });
    setShowForm(false);
  }

  function removeParent(id: string) {
    if (!confirm("Supprimer ce parent ?")) return;
    setParents((prev) => prev.filter((p) => p.id !== id));
  }

  function toggleChildLink(parentId: string, childId: string) {
    setParents((prev) =>
      prev.map((p) =>
        p.id === parentId
          ? {
              ...p,
              childIds: p.childIds.includes(childId)
                ? p.childIds.filter((c) => c !== childId)
                : [...p.childIds, childId],
            }
          : p
      )
    );
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
            <Plus size={16} /> Ajouter
          </button>
        }
      />

      {/* Add form */}
      {showForm && (
        <div style={{ ...card, marginBottom: "1.25rem" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.05rem", color: "oklch(0.35 0.1 270)", marginBottom: "1rem" }}>
            ✏️ Nouveau parent
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
            <button onClick={() => setShowForm(false)} className="kid-btn bg-kid-pink" style={{ flex: 1 }}>
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
                  <button onClick={() => removeParent(parent.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "oklch(0.60 0.15 27)", padding: "0.1rem" }}>
                    <X size={16} />
                  </button>
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

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{ ...card, textAlign: "center", padding: "3rem 1.5rem" }}>
      <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>{icon}</div>
      <p style={{ color: "oklch(0.55 0.07 260)", fontSize: "0.92rem" }}>{text}</p>
    </div>
  );
}
