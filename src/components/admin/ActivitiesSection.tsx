import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Activity } from "../../lib/admin-extra";
import { card, inputStyle, badge, PageHeader, Field, primaryBtn, dangerBtn, softBtn, uid } from "./ui";

const DAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi"];
const SECTIONS = ["Bébés", "Moyens", "Grands", "Toutes"];

type ActivityForm = Omit<Activity, "id">;
const emptyForm: ActivityForm = {
  day: 0,
  startTime: "09:00",
  endTime: "10:00",
  title: "",
  section: "Toutes",
  notes: "",
};

export function ActivitiesSection({
  activities,
  setActivities,
  onActivityUpsert,
  onActivityDelete,
}: {
  activities: Activity[];
  setActivities: Dispatch<SetStateAction<Activity[]>>;
  onActivityUpsert: (a: Activity) => void;
  onActivityDelete: (id: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ActivityForm>(emptyForm);

  function add() {
    if (!form.title.trim()) return;
    const created: Activity = { id: uid(), ...form, title: form.title.trim() };
    setActivities((prev) => [...prev, created]);
    onActivityUpsert(created);
    setForm({ ...emptyForm, day: form.day });
    setShowForm(false);
  }

  function remove(id: string) {
    if (!confirm("Supprimer cette activité ?")) return;
    setActivities((prev) => prev.filter((a) => a.id !== id));
    onActivityDelete(id);
  }

  return (
    <div>
      <PageHeader
        icon="🎨"
        title="Activités"
        count={activities.length}
        subtitle="Planning hebdomadaire"
        action={
          <button onClick={() => setShowForm((v) => !v)} style={primaryBtn}>
            {showForm ? "Fermer" : "+ Ajouter"}
          </button>
        }
      />

      {showForm && (
        <div style={{ ...card, marginBottom: "1.25rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
            <Field label="Titre *" span>
              <input
                style={inputStyle}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ex : Peinture, Chansons, Jeux d'eau…"
              />
            </Field>
            <Field label="Jour">
              <select
                style={inputStyle}
                value={form.day}
                onChange={(e) => setForm({ ...form, day: Number(e.target.value) })}
              >
                {DAYS.map((d, i) => (
                  <option key={d} value={i}>
                    {d}
                  </option>
                ))}
              </select>
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
            <Field label="Début">
              <input
                style={inputStyle}
                type="time"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              />
            </Field>
            <Field label="Fin">
              <input
                style={inputStyle}
                type="time"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              />
            </Field>
            <Field label="Notes" span>
              <input
                style={inputStyle}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </Field>
          </div>
          <div style={{ display: "flex", gap: "0.6rem", marginTop: "1rem" }}>
            <button onClick={add} style={primaryBtn}>
              Ajouter
            </button>
            <button onClick={() => setShowForm(false)} style={softBtn}>
              Annuler
            </button>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gap: "0.9rem" }}>
        {DAYS.map((dayName, day) => {
          const list = activities
            .filter((a) => a.day === day)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
          return (
            <div key={dayName} style={card}>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: "1rem",
                  color: "oklch(0.40 0.10 270)",
                  marginBottom: "0.6rem",
                }}
              >
                {dayName}
              </div>
              {list.length === 0 ? (
                <p style={{ margin: 0, fontSize: "0.85rem", color: "oklch(0.60 0.05 260)" }}>Aucune activité</p>
              ) : (
                <div style={{ display: "grid", gap: "0.5rem" }}>
                  {list.map((a) => (
                    <div
                      key={a.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "0.75rem",
                        flexWrap: "wrap",
                        padding: "0.55rem 0.8rem",
                        borderRadius: "0.9rem",
                        background: "oklch(0.52 0.22 260 / .07)",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: "oklch(0.30 0.08 270)", fontSize: "0.92rem" }}>
                          <span style={{ color: "oklch(0.52 0.22 280)", marginRight: "0.5rem" }}>
                            {a.startTime || "--:--"}–{a.endTime || "--:--"}
                          </span>
                          {a.title}
                        </div>
                        {a.notes && (
                          <div style={{ fontSize: "0.78rem", color: "oklch(0.55 0.07 260)", marginTop: "0.15rem" }}>
                            {a.notes}
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={badge("oklch(0.55 0.18 290)")}>{a.section}</span>
                        <button onClick={() => remove(a.id)} style={dangerBtn}>
                          Supprimer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
