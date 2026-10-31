import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import type { FinanceEntry } from "../../lib/admin-extra";
import { localDateStr } from "../../lib/admin-helpers";
import { CURRENCY } from "./ReportsSection";
import { card, EmptyState, Field, inputStyle, labelStyle, PageHeader, pillBtn, primaryBtn, uid } from "./ui";

export function FinanceSection({
  entries,
  onSave,
}: {
  entries: FinanceEntry[];
  onSave: (next: FinanceEntry[]) => void;
}) {
  const [month, setMonth] = useState(localDateStr().slice(0, 7));
  const [showForm, setShowForm] = useState(false);
  const emptyForm = { label: "", amount: "", date: localDateStr() };
  const [form, setForm] = useState(emptyForm);

  const monthEntries = useMemo(
    () => entries.filter((e) => e.date.startsWith(month) && e.kind === "depense")
          .sort((a, b) => b.date.localeCompare(a.date)),
    [entries, month]
  );

  const totalDepense = useMemo(
    () => monthEntries.reduce((s, e) => s + e.amount, 0),
    [monthEntries]
  );

  const money = (n: number) => `${n.toLocaleString("fr-FR")} ${CURRENCY}`;
  const amountValue = Number(form.amount.replace(",", "."));
  const canSave = form.label.trim() !== "" && Number.isFinite(amountValue) && amountValue > 0 && form.date !== "";

  function addEntry() {
    if (!canSave) return;
    onSave([...entries, { id: uid(), kind: "depense", label: form.label.trim(), amount: amountValue, date: form.date }]);
    setForm(emptyForm);
    setShowForm(false);
  }

  function removeEntry(id: string) {
    if (!confirm("Supprimer cette écriture ?")) return;
    onSave(entries.filter((e) => e.id !== id));
  }

  return (
    <div>
      <PageHeader
        icon="📊"
        title="Financement & Dépenses"
        count={monthEntries.length}
        subtitle="Suivi des dépenses de la crèche"
        action={
          <button onClick={() => setShowForm((v) => !v)} style={primaryBtn}>
            <Plus size={16} /> Ajouter
          </button>
        }
      />

      {/* Total dépenses du mois */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem", marginBottom: "1.25rem" }}>
        <div style={{ ...card, textAlign: "center", padding: "1rem" }}>
          <div style={{ fontSize: "1.4rem" }}>🧾</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", fontWeight: 700, color: "oklch(0.55 0.20 27)" }}>
            {money(totalDepense)}
          </div>
          <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "oklch(0.55 0.07 260)" }}>Dépenses du mois</div>
        </div>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div style={{ ...card, marginBottom: "1.25rem" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.05rem", color: "oklch(0.35 0.1 270)", marginBottom: "1rem" }}>
            ✏️ Nouvelle dépense
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" }}>
            <Field label="Libellé *">
              <input
                style={inputStyle}
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                placeholder="Achat de jouets"
              />
            </Field>
            <Field label={`Montant (${CURRENCY}) *`}>
              <input
                style={inputStyle}
                inputMode="decimal"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="5000"
              />
            </Field>
            <Field label="Date *">
              <input
                style={inputStyle}
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              />
            </Field>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
            <button
              onClick={addEntry}
              disabled={!canSave}
              style={{ ...primaryBtn, flex: 1, justifyContent: "center", opacity: canSave ? 1 : 0.5, cursor: canSave ? "pointer" : "not-allowed" }}
            >
              Enregistrer
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

      {/* Sélecteur de mois */}
      <div style={{ ...card, padding: "1rem 1.25rem", marginBottom: "1rem", maxWidth: "260px" }}>
        <label style={labelStyle}>Mois</label>
        <input type="month" style={inputStyle} value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} />
      </div>

      {/* Liste */}
      {monthEntries.length === 0 ? (
        <EmptyState icon="🧾" text="Aucune dépense pour ce mois. Cliquez sur « Ajouter » pour commencer." />
      ) : (
        <div style={{ ...card, padding: 0, overflow: "hidden" }}>
          {monthEntries.map((e, idx) => (
            <div
              key={e.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto auto",
                gap: "0.75rem",
                alignItems: "center",
                padding: "0.75rem 1.25rem",
                borderBottom: idx < monthEntries.length - 1 ? "1px solid oklch(0.90 0.03 265 / .6)" : "none",
                background: idx % 2 === 0 ? "transparent" : "oklch(0.97 0.02 265 / .3)",
              }}
            >
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9rem", color: "oklch(0.28 0.08 270)" }}>
                  {e.label}
                </div>
                <div style={{ fontSize: "0.75rem", color: "oklch(0.55 0.07 260)" }}>
                  🧾 {new Date(e.date + "T12:00:00").toLocaleDateString("fr-FR")}
                </div>
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "oklch(0.55 0.20 27)" }}>
                −{money(e.amount)}
              </div>
              <button
                onClick={() => removeEntry(e.id)}
                title="Supprimer"
                style={{ display: "flex", alignItems: "center", padding: "0.35rem 0.5rem", borderRadius: "0.6rem", border: "1.5px solid oklch(0.577 0.245 27 / .3)", background: "oklch(0.577 0.245 27 / .07)", color: "oklch(0.50 0.22 27)", cursor: "pointer" }}
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
