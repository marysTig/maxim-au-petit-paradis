import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Staff, StaffAttendance } from "../../lib/admin-extra";
import {
  card,
  inputStyle,
  badge,
  PageHeader,
  Field,
  EmptyState,
  primaryBtn,
  dangerBtn,
  softBtn,
  pillBtn,
  uid,
  todayStr,
  nowStr,
} from "./ui";

const SECTIONS = ["Bébés", "Moyens", "Grands", "Toutes"];

type StaffForm = Omit<Staff, "id">;
const emptyForm: StaffForm = {
  name: "",
  role: "",
  phone: "",
  email: "",
  section: "Toutes",
  hireDate: "",
  notes: "",
};

export function StaffSection({
  staff,
  setStaff,
  staffAttendance,
  setStaffAttendance,
  onStaffUpsert,
  onStaffDelete,
  onAttendanceUpsert,
}: {
  staff: Staff[];
  setStaff: Dispatch<SetStateAction<Staff[]>>;
  staffAttendance: StaffAttendance[];
  setStaffAttendance: Dispatch<SetStateAction<StaffAttendance[]>>;
  onStaffUpsert: (s: Staff) => void;
  onStaffDelete: (id: string) => void;
  onAttendanceUpsert: (r: StaffAttendance) => void;
}) {
  const [tab, setTab] = useState<"team" | "pointage">("team");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<StaffForm>(emptyForm);
  const [search, setSearch] = useState("");

  const today = todayStr();

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
    setTab("team");
  }

  function openEdit(s: Staff) {
    const { id, ...rest } = s;
    setEditingId(id);
    setForm(rest);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  function save() {
    if (!form.name.trim()) return;
    if (editingId) {
      const updated: Staff = { id: editingId, ...form };
      setStaff((prev) => prev.map((s) => (s.id === editingId ? updated : s)));
      onStaffUpsert(updated);
    } else {
      const created: Staff = { id: uid(), ...form };
      setStaff((prev) => [...prev, created]);
      onStaffUpsert(created);
    }
    closeForm();
  }

  function remove(id: string) {
    if (!confirm("Supprimer ce membre du personnel ?")) return;
    setStaff((prev) => prev.filter((s) => s.id !== id));
    setStaffAttendance((prev) => prev.filter((a) => a.staffId !== id));
    onStaffDelete(id);
  }

  function getRecord(staffId: string) {
    return staffAttendance.find((a) => a.staffId === staffId && a.date === today);
  }

  function markArrival(staffId: string) {
    const existing = getRecord(staffId);
    const updated: StaffAttendance = existing
      ? { ...existing, arrival: nowStr() }
      : { staffId, date: today, arrival: nowStr(), departure: null };
    setStaffAttendance((prev) =>
      existing
        ? prev.map((a) => (a.staffId === staffId && a.date === today ? updated : a))
        : [...prev, updated]
    );
    onAttendanceUpsert(updated);
  }

  function markDeparture(staffId: string) {
    const existing = getRecord(staffId);
    if (!existing || !existing.arrival) return;
    const updated: StaffAttendance = { ...existing, departure: nowStr() };
    setStaffAttendance((prev) =>
      prev.map((a) => (a.staffId === staffId && a.date === today ? updated : a))
    );
    onAttendanceUpsert(updated);
  }

  const filtered = staff.filter((s) => {
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.role.toLowerCase().includes(q);
  });

  const present = staff.filter((s) => {
    const r = getRecord(s.id);
    return r?.arrival && !r?.departure;
  }).length;
  const departed = staff.filter((s) => getRecord(s.id)?.departure).length;
  const notArrived = staff.length - present - departed;

  const dateLabel = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div>
      <PageHeader
        icon="🧑‍🏫"
        title="Personnel"
        count={staff.length}
        subtitle="Équipe éducative et pointage"
        action={
          <button onClick={openAdd} style={primaryBtn}>
            + Ajouter
          </button>
        }
      />

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <button style={pillBtn(tab === "team")} onClick={() => setTab("team")}>
          👥 Équipe
        </button>
        <button style={pillBtn(tab === "pointage")} onClick={() => setTab("pointage")}>
          📋 Pointage
        </button>
      </div>

      {showForm && tab === "team" && (
        <div style={{ ...card, marginBottom: "1.25rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
            <Field label="Nom complet *">
              <input
                style={inputStyle}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex : Amel Benali"
              />
            </Field>
            <Field label="Rôle">
              <input
                style={inputStyle}
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                placeholder="Ex : Éducatrice"
              />
            </Field>
            <Field label="Téléphone">
              <input
                style={inputStyle}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="05 .. .. .. .."
              />
            </Field>
            <Field label="Email">
              <input
                style={inputStyle}
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
            <Field label="Section">
              <select
                style={inputStyle}
                value={form.section}
                onChange={(e) => setForm({ ...form, section: e.target.value })}
              >
                {SECTIONS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Date d'embauche">
              <input
                style={inputStyle}
                type="date"
                value={form.hireDate}
                onChange={(e) => setForm({ ...form, hireDate: e.target.value })}
              />
            </Field>
            <Field label="Notes" span>
              <textarea
                style={{ ...inputStyle, minHeight: "70px", resize: "vertical" }}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </Field>
          </div>
          <div style={{ display: "flex", gap: "0.6rem", marginTop: "1rem" }}>
            <button onClick={save} style={primaryBtn}>
              {editingId ? "Enregistrer" : "Ajouter"}
            </button>
            <button onClick={closeForm} style={softBtn}>
              Annuler
            </button>
          </div>
        </div>
      )}

      {tab === "team" && (
        <>
          <input
            style={{ ...inputStyle, marginBottom: "1rem" }}
            placeholder="🔍 Rechercher un nom ou un rôle…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {filtered.length === 0 ? (
            <EmptyState icon="🧑‍🏫" text={staff.length === 0 ? "Aucun membre du personnel pour le moment." : "Aucun résultat."} />
          ) : (
            <div style={{ display: "grid", gap: "0.75rem" }}>
              {filtered.map((s) => (
                <div
                  key={s.id}
                  style={{ ...card, padding: "1rem 1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "oklch(0.30 0.08 270)" }}>
                      {s.name}
                    </div>
                    <div style={{ fontSize: "0.82rem", color: "oklch(0.50 0.08 265)", marginTop: "0.15rem" }}>
                      {s.role || "—"}
                      {s.hireDate && ` · depuis le ${new Date(s.hireDate).toLocaleDateString("fr-FR")}`}
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.4rem", flexWrap: "wrap", alignItems: "center" }}>
                      <span style={badge("oklch(0.55 0.18 290)")}>{s.section}</span>
                      {s.phone && (
                        <a href={`tel:${s.phone}`} style={{ fontSize: "0.82rem", color: "oklch(0.45 0.18 260)", fontWeight: 600 }}>
                          📞 {s.phone}
                        </a>
                      )}
                      {s.email && (
                        <a href={`mailto:${s.email}`} style={{ fontSize: "0.82rem", color: "oklch(0.45 0.18 260)", fontWeight: 600 }}>
                          ✉️ {s.email}
                        </a>
                      )}
                    </div>
                    {s.notes && (
                      <p style={{ margin: "0.4rem 0 0", fontSize: "0.82rem", color: "oklch(0.55 0.07 260)" }}>{s.notes}</p>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button onClick={() => openEdit(s)} style={softBtn}>
                      Modifier
                    </button>
                    <button onClick={() => remove(s.id)} style={dangerBtn}>
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "pointage" && (
        <>
          <p style={{ margin: "0 0 0.9rem", fontSize: "0.9rem", color: "oklch(0.50 0.08 265)", fontWeight: 600 }}>
            {dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginBottom: "1.25rem" }}>
            {[
              { label: "Présents", count: present, color: "oklch(0.55 0.22 142)", icon: "✅" },
              { label: "Partis", count: departed, color: "oklch(0.55 0.18 27)", icon: "🏠" },
              { label: "Non arrivés", count: notArrived, color: "oklch(0.55 0.07 260)", icon: "⏳" },
            ].map((s) => (
              <div key={s.label} style={{ ...card, textAlign: "center", padding: "1rem" }}>
                <div style={{ fontSize: "1.5rem", marginBottom: "0.2rem" }}>{s.icon}</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", fontWeight: 700, color: s.color }}>
                  {s.count}
                </div>
                <div style={{ fontSize: "0.78rem", color: "oklch(0.55 0.07 260)", fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {staff.length === 0 ? (
            <EmptyState icon="🧑‍🏫" text="Ajoutez d'abord des membres du personnel." />
          ) : (
            <div style={{ display: "grid", gap: "0.6rem" }}>
              {staff.map((s) => {
                const r = getRecord(s.id);
                const hasArrived = !!r?.arrival;
                const hasDeparted = !!r?.departure;
                return (
                  <div
                    key={s.id}
                    style={{ ...card, padding: "0.9rem 1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}
                  >
                    <div>
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "oklch(0.30 0.08 270)" }}>
                        {s.name}
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "oklch(0.55 0.07 260)" }}>
                        {hasArrived ? `Arrivée ${r?.arrival}` : "Pas encore arrivé"}
                        {hasDeparted && ` · Départ ${r?.departure}`}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        onClick={() => markArrival(s.id)}
                        disabled={hasArrived}
                        style={{ ...primaryBtn, opacity: hasArrived ? 0.4 : 1, cursor: hasArrived ? "default" : "pointer" }}
                      >
                        Arrivée
                      </button>
                      <button
                        onClick={() => markDeparture(s.id)}
                        disabled={!hasArrived || hasDeparted}
                        style={{ ...softBtn, opacity: !hasArrived || hasDeparted ? 0.4 : 1, cursor: !hasArrived || hasDeparted ? "default" : "pointer" }}
                      >
                        Départ
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
