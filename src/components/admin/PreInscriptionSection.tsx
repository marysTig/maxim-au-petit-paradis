import { useState, useMemo } from "react";
import { Plus, Pencil, X, Check } from "lucide-react";
import {
  card,
  inputStyle,
  labelStyle,
  primaryBtn,
  dangerBtn,
  softBtn,
  pillBtn,
  uid,
  Field,
  PageHeader,
  EmptyState,
} from "./ui";
import { localDateStr } from "../../lib/admin-helpers";

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
export interface PreInscrit {
  id: string;
  lastName: string;
  firstName: string;
  birthDate: string;
  anneeScolaire: string; // e.g. "2026-2027"
  montant: number;       // montant payé à la pré-inscription
  datePaiement: string;  // YYYY-MM-DD
}

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
const CURRENCY = "FCFA";

function money(n: number) {
  return `${n.toLocaleString("fr-FR")} ${CURRENCY}`;
}

function currentSchoolYear(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1; // 1-based
  // L'année scolaire démarre en septembre
  if (m >= 9) return `${y}-${y + 1}`;
  return `${y - 1}-${y}`;
}

/** Génère les options d'années scolaires (3 ans passés, courante, 3 ans futurs). */
function schoolYearOptions(): string[] {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const current = m >= 9 ? y : y - 1;
  const years: string[] = [];
  for (let i = current - 3; i <= current + 3; i++) {
    years.push(`${i}-${i + 1}`);
  }
  return years;
}

/* ─────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────── */
export function PreInscriptionSection({
  preInscrits,
  onSave,
  onDelete,
}: {
  preInscrits: PreInscrit[];
  onSave: (p: PreInscrit) => void;
  onDelete: (id: string) => void;
}) {
  const yearOptions = schoolYearOptions();

  /* ── Filters ── */
  const [filterYear, setFilterYear] = useState("");
  const [search, setSearch] = useState("");

  /* ── Add form ── */
  const [showForm, setShowForm] = useState(false);
  const emptyForm = {
    lastName: "",
    firstName: "",
    birthDate: "",
    anneeScolaire: currentSchoolYear(),
    montant: "",
    datePaiement: localDateStr(),
  };
  const [form, setForm] = useState(emptyForm);

  /* ── Edit modal ── */
  const [editItem, setEditItem] = useState<PreInscrit | null>(null);
  const [editForm, setEditForm] = useState<typeof emptyForm>(emptyForm);

  /* ── Filtered list ── */
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return preInscrits
      .filter((p) => {
        const matchYear = !filterYear || p.anneeScolaire === filterYear;
        const matchSearch =
          !q ||
          p.lastName.toLowerCase().includes(q) ||
          p.firstName.toLowerCase().includes(q);
        return matchYear && matchSearch;
      })
      .sort((a, b) => a.lastName.localeCompare(b.lastName, "fr") || a.firstName.localeCompare(b.firstName, "fr"));
  }, [preInscrits, filterYear, search]);

  /* ── Add ── */
  const montantNum = Number(String(form.montant).replace(",", "."));
  const canAdd =
    form.lastName.trim() !== "" &&
    form.firstName.trim() !== "" &&
    form.anneeScolaire !== "" &&
    Number.isFinite(montantNum) &&
    montantNum >= 0 &&
    form.datePaiement !== "";

  function handleAdd() {
    if (!canAdd) return;
    const newItem: PreInscrit = {
      id: uid(),
      lastName: form.lastName.trim(),
      firstName: form.firstName.trim(),
      birthDate: form.birthDate,
      anneeScolaire: form.anneeScolaire,
      montant: montantNum,
      datePaiement: form.datePaiement,
    };
    onSave(newItem);
    setForm(emptyForm);
    setShowForm(false);
  }

  /* ── Edit ── */
  function startEdit(p: PreInscrit) {
    setEditItem(p);
    setEditForm({
      lastName: p.lastName,
      firstName: p.firstName,
      birthDate: p.birthDate,
      anneeScolaire: p.anneeScolaire,
      montant: String(p.montant),
      datePaiement: p.datePaiement,
    });
  }

  const editMontantNum = Number(String(editForm.montant).replace(",", "."));
  const canEdit =
    editForm.lastName.trim() !== "" &&
    editForm.firstName.trim() !== "" &&
    editForm.anneeScolaire !== "" &&
    Number.isFinite(editMontantNum) &&
    editMontantNum >= 0 &&
    editForm.datePaiement !== "";

  function handleEdit() {
    if (!editItem || !canEdit) return;
    onSave({
      ...editItem,
      lastName: editForm.lastName.trim(),
      firstName: editForm.firstName.trim(),
      birthDate: editForm.birthDate,
      anneeScolaire: editForm.anneeScolaire,
      montant: editMontantNum,
      datePaiement: editForm.datePaiement,
    });
    setEditItem(null);
  }

  function handleDelete(id: string) {
    if (!confirm("Supprimer cette pré-inscription ?")) return;
    onDelete(id);
  }

  /* ── Stat: total paid ── */
  const totalPaid = useMemo(
    () => filtered.reduce((s, p) => s + p.montant, 0),
    [filtered]
  );

  return (
    <div>
      {/* ── Header ── */}
      <PageHeader
        icon="📋"
        title="Pré-inscriptions"
        count={filtered.length}
        subtitle="Gestion des enfants pré-inscrits (hors liste principale)"
        action={
          <button
            id="preinscrip-add-btn"
            onClick={() => {
              setShowForm((v) => !v);
              setEditItem(null);
            }}
            style={primaryBtn}
          >
            <Plus size={16} /> Ajouter
          </button>
        }
      />

      {/* ── Stat cards ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "0.75rem",
          marginBottom: "1.25rem",
        }}
      >
        <div style={{ ...card, textAlign: "center", padding: "1rem" }}>
          <div style={{ fontSize: "1.4rem" }}>📋</div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "oklch(0.52 0.22 260)",
            }}
          >
            {filtered.length}
          </div>
          <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "oklch(0.55 0.07 260)" }}>
            Pré-inscrits{filterYear ? ` (${filterYear})` : ""}
          </div>
        </div>
        <div style={{ ...card, textAlign: "center", padding: "1rem" }}>
          <div style={{ fontSize: "1.4rem" }}>💰</div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.1rem",
              fontWeight: 700,
              color: "oklch(0.45 0.20 145)",
            }}
          >
            {money(totalPaid)}
          </div>
          <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "oklch(0.55 0.07 260)" }}>
            Total perçu{filterYear ? ` (${filterYear})` : ""}
          </div>
        </div>
      </div>

      {/* ── Add form ── */}
      {showForm && (
        <div style={{ ...card, marginBottom: "1.25rem" }}>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "1.05rem",
              color: "oklch(0.35 0.10 270)",
              marginBottom: "1rem",
            }}
          >
            ✏️ Nouvelle pré-inscription
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "0.75rem",
            }}
          >
            <Field label="Nom *">
              <input
                id="preinscrip-form-lastname"
                style={inputStyle}
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                placeholder="NOM"
              />
            </Field>
            <Field label="Prénom *">
              <input
                id="preinscrip-form-firstname"
                style={inputStyle}
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                placeholder="Prénom"
              />
            </Field>
            <Field label="Date de naissance">
              <input
                id="preinscrip-form-birthdate"
                style={inputStyle}
                type="date"
                value={form.birthDate}
                onChange={(e) => setForm((f) => ({ ...f, birthDate: e.target.value }))}
              />
            </Field>
            <Field label="Année scolaire *">
              <select
                id="preinscrip-form-year"
                style={inputStyle}
                value={form.anneeScolaire}
                onChange={(e) => setForm((f) => ({ ...f, anneeScolaire: e.target.value }))}
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </Field>
            <Field label={`Montant pré-inscription (${CURRENCY}) *`}>
              <input
                id="preinscrip-form-amount"
                style={inputStyle}
                inputMode="decimal"
                value={form.montant}
                onChange={(e) => setForm((f) => ({ ...f, montant: e.target.value }))}
                placeholder="25000"
              />
            </Field>
            <Field label="Date du paiement *">
              <input
                id="preinscrip-form-paydate"
                style={inputStyle}
                type="date"
                value={form.datePaiement}
                onChange={(e) => setForm((f) => ({ ...f, datePaiement: e.target.value }))}
              />
            </Field>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
            <button
              id="preinscrip-form-submit"
              onClick={handleAdd}
              disabled={!canAdd}
              style={{
                ...primaryBtn,
                flex: 1,
                justifyContent: "center",
                opacity: canAdd ? 1 : 0.5,
                cursor: canAdd ? "pointer" : "not-allowed",
              }}
            >
              <Check size={16} /> Enregistrer
            </button>
            <button
              onClick={() => { setShowForm(false); setForm(emptyForm); }}
              style={{ ...pillBtn(false), padding: "0.6rem 1.2rem" }}
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* ── Filters ── */}
      <div
        style={{
          ...card,
          padding: "1rem 1.25rem",
          marginBottom: "1rem",
          display: "flex",
          gap: "1rem",
          flexWrap: "wrap",
          alignItems: "flex-end",
        }}
      >
        <div style={{ flex: "1 1 200px" }}>
          <label style={labelStyle}>Rechercher</label>
          <input
            id="preinscrip-search"
            style={inputStyle}
            placeholder="Nom ou prénom…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ flex: "0 1 200px" }}>
          <label style={labelStyle}>Année scolaire</label>
          <select
            id="preinscrip-filter-year"
            style={inputStyle}
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
          >
            <option value="">Toutes</option>
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── List ── */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="📋"
          text="Aucun enfant pré-inscrit. Cliquez sur « Ajouter » pour commencer."
        />
      ) : (
        <div style={{ ...card, padding: 0, overflow: "hidden" }}>
          {/* Header row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr auto",
              gap: "0.5rem",
              padding: "0.75rem 1.25rem",
              background: "oklch(0.93 0.04 265 / .5)",
              borderBottom: "1px solid oklch(0.87 0.04 265 / .5)",
              fontWeight: 700,
              fontSize: "0.75rem",
              color: "oklch(0.45 0.08 260)",
              letterSpacing: "0.04em",
              textTransform: "uppercase" as const,
            }}
          >
            <span>Enfant</span>
            <span>Naissance</span>
            <span>Année scolaire</span>
            <span>Montant payé</span>
            <span>Date paiement</span>
            <span />
          </div>

          {filtered.map((p, idx) => (
            <div
              key={p.id}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr auto",
                gap: "0.5rem",
                padding: "0.75rem 1.25rem",
                alignItems: "center",
                borderBottom:
                  idx < filtered.length - 1
                    ? "1px solid oklch(0.90 0.03 265 / .6)"
                    : "none",
                background: idx % 2 === 0 ? "transparent" : "oklch(0.97 0.02 265 / .3)",
              }}
            >
              {/* Nom + Prénom */}
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: "0.92rem",
                    color: "oklch(0.28 0.08 270)",
                  }}
                >
                  {p.lastName.toUpperCase()} {p.firstName}
                </div>
              </div>

              {/* Date de naissance */}
              <div style={{ fontSize: "0.85rem", color: "oklch(0.45 0.07 260)" }}>
                {p.birthDate
                  ? new Date(p.birthDate + "T12:00:00").toLocaleDateString("fr-FR")
                  : "—"}
              </div>

              {/* Année scolaire */}
              <div>
                <span
                  style={{
                    display: "inline-block",
                    padding: "0.2rem 0.65rem",
                    borderRadius: "9999px",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    background: "oklch(0.52 0.22 260 / .12)",
                    color: "oklch(0.42 0.18 260)",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  {p.anneeScolaire}
                </span>
              </div>

              {/* Montant */}
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  color: "oklch(0.45 0.20 145)",
                }}
              >
                {money(p.montant)}
              </div>

              {/* Date paiement */}
              <div style={{ fontSize: "0.85rem", color: "oklch(0.45 0.07 260)" }}>
                {p.datePaiement
                  ? new Date(p.datePaiement + "T12:00:00").toLocaleDateString("fr-FR")
                  : "—"}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <button
                  title="Modifier"
                  onClick={() => startEdit(p)}
                  style={{
                    ...softBtn,
                    padding: "0.35rem 0.55rem",
                    borderRadius: "0.6rem",
                    border: "1.5px solid oklch(0.52 0.22 260 / .25)",
                  }}
                >
                  <Pencil size={13} />
                </button>
                <button
                  title="Supprimer"
                  onClick={() => handleDelete(p.id)}
                  style={{
                    ...dangerBtn,
                    padding: "0.35rem 0.55rem",
                    borderRadius: "0.6rem",
                    border: "1.5px solid oklch(0.577 0.245 27 / .25)",
                  }}
                >
                  <X size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Edit modal ── */}
      {editItem && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "oklch(0 0 0 / .4)",
            zIndex: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div
            style={{
              ...card,
              width: "100%",
              maxWidth: "560px",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "1.05rem",
                color: "oklch(0.35 0.10 270)",
                marginBottom: "1rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>✏️ Modifier la pré-inscription</span>
              <button
                onClick={() => setEditItem(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "oklch(0.55 0.07 260)",
                  fontSize: "1.1rem",
                }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "0.75rem",
              }}
            >
              <Field label="Nom *">
                <input
                  id="preinscrip-edit-lastname"
                  style={inputStyle}
                  value={editForm.lastName}
                  onChange={(e) => setEditForm((f) => ({ ...f, lastName: e.target.value }))}
                />
              </Field>
              <Field label="Prénom *">
                <input
                  id="preinscrip-edit-firstname"
                  style={inputStyle}
                  value={editForm.firstName}
                  onChange={(e) => setEditForm((f) => ({ ...f, firstName: e.target.value }))}
                />
              </Field>
              <Field label="Date de naissance">
                <input
                  id="preinscrip-edit-birthdate"
                  style={inputStyle}
                  type="date"
                  value={editForm.birthDate}
                  onChange={(e) => setEditForm((f) => ({ ...f, birthDate: e.target.value }))}
                />
              </Field>
              <Field label="Année scolaire *">
                <select
                  id="preinscrip-edit-year"
                  style={inputStyle}
                  value={editForm.anneeScolaire}
                  onChange={(e) => setEditForm((f) => ({ ...f, anneeScolaire: e.target.value }))}
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </Field>
              <Field label={`Montant (${CURRENCY}) *`}>
                <input
                  id="preinscrip-edit-amount"
                  style={inputStyle}
                  inputMode="decimal"
                  value={editForm.montant}
                  onChange={(e) => setEditForm((f) => ({ ...f, montant: e.target.value }))}
                />
              </Field>
              <Field label="Date du paiement *">
                <input
                  id="preinscrip-edit-paydate"
                  style={inputStyle}
                  type="date"
                  value={editForm.datePaiement}
                  onChange={(e) => setEditForm((f) => ({ ...f, datePaiement: e.target.value }))}
                />
              </Field>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
              <button
                id="preinscrip-edit-submit"
                onClick={handleEdit}
                disabled={!canEdit}
                style={{
                  ...primaryBtn,
                  flex: 1,
                  justifyContent: "center",
                  opacity: canEdit ? 1 : 0.5,
                  cursor: canEdit ? "pointer" : "not-allowed",
                }}
              >
                <Check size={16} /> Enregistrer
              </button>
              <button
                onClick={() => setEditItem(null)}
                style={{ ...pillBtn(false), padding: "0.6rem 1.2rem" }}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
