import { useState, useRef } from "react";
import type { Payment } from "../../lib/admin-extra";
import { PageHeader } from "./ui";

/* ── Mois de l'année scolaire Sep → Juil ── */
const SCHOOL_MONTHS = [
  { label: "Sep", m: 9 },
  { label: "Oct", m: 10 },
  { label: "Nov", m: 11 },
  { label: "Déc", m: 12 },
  { label: "Jan", m: 1 },
  { label: "Fév", m: 2 },
  { label: "Mar", m: 3 },
  { label: "Avr", m: 4 },
  { label: "Mai", m: 5 },
  { label: "Juin", m: 6 },
  { label: "Juil", m: 7 },
];

/** Retourne l'année scolaire courante (Sep→Dec = même année; Jan→Juil = année précédente). */
function currentSchoolYear(): number {
  const now = new Date();
  return now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
}

/** YYYY-MM pour un mois donné d'une année scolaire (ex: Sep 2024 → "2024-09") */
function monthKey(schoolYear: number, m: number): string {
  const year = m >= 9 ? schoolYear : schoolYear + 1;
  return `${year}-${String(m).padStart(2, "0")}`;
}

/** ID unique pour un paiement enfant×mois */
function payId(childId: string, mk: string) {
  return `pay_${childId}_${mk}`;
}

interface Child {
  id: string;
  firstName: string;
  lastName: string;
}

interface Props {
  children: Child[];
  payments: Payment[];
  onRecord: (p: Payment) => void;
}

export function PaymentGridSection({ children, payments, onRecord }: Props) {
  const [schoolYear, setSchoolYear] = useState(currentSchoolYear);
  const [activeCell, setActiveCell] = useState<{ childId: string; mk: string } | null>(null);
  const [dateInput, setDateInput] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const popRef = useRef<HTMLDivElement>(null);

  const sorted = [...children].sort((a, b) =>
    `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`)
  );

  function getPayment(childId: string, mk: string): Payment | undefined {
    return payments.find((p) => p.childId === childId && p.month === mk);
  }

  function openCell(childId: string, mk: string) {
    const existing = getPayment(childId, mk);
    setActiveCell({ childId, mk });
    setDateInput(existing?.paidAt ?? "");
    setAmountInput(existing?.amount ? String(existing.amount) : "");
  }

  function savePayment(status: "paid" | "pending" | "late") {
    if (!activeCell) return;
    const { childId, mk } = activeCell;
    const existing = getPayment(childId, mk);
    const p: Payment = {
      id: existing?.id ?? payId(childId, mk),
      childId,
      month: mk,
      amount: Number(amountInput) || 0,
      status,
      paidAt: status === "paid" ? (dateInput || new Date().toISOString().slice(0, 10)) : "",
    };
    onRecord(p);
    setActiveCell(null);
  }

  /* ── Statistiques rapides ── */
  const totalPaid = payments.filter((p) => p.status === "paid").length;
  const totalPending = payments.filter((p) => p.status === "pending").length;
  const totalLate = payments.filter((p) => p.status === "late").length;

  /* ── Couleur de cellule ── */
  function cellColor(p: Payment | undefined) {
    if (!p || p.status === "pending") return { bg: "oklch(0.94 0.02 260)", color: "oklch(0.55 0.06 260)" };
    if (p.status === "paid") return { bg: "oklch(0.88 0.14 142)", color: "oklch(0.32 0.12 142)" };
    return { bg: "oklch(0.92 0.14 27)", color: "oklch(0.40 0.18 27)" }; // late
  }

  const cellBase: React.CSSProperties = {
    border: "1px solid oklch(0.88 0.04 260)",
    padding: "0.3rem 0.2rem",
    textAlign: "center",
    fontSize: "0.72rem",
    cursor: "pointer",
    transition: "filter 0.12s",
    userSelect: "none",
    minWidth: "52px",
  };

  return (
    <div>
      <PageHeader
        icon="💳"
        title="Paiements"
        count={children.length}
        subtitle="Suivi mensuel des paiements — septembre à juillet"
        action={undefined}
      />

      {/* Statistiques */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
        {[
          { label: "Payés", value: totalPaid, color: "oklch(0.88 0.14 142)", text: "oklch(0.28 0.12 142)" },
          { label: "En attente", value: totalPending, color: "oklch(0.93 0.06 70)", text: "oklch(0.45 0.12 70)" },
          { label: "En retard", value: totalLate, color: "oklch(0.92 0.14 27)", text: "oklch(0.40 0.18 27)" },
        ].map((s) => (
          <div key={s.label} style={{
            flex: 1, minWidth: "110px", background: s.color, borderRadius: "1rem",
            padding: "0.75rem 1rem", display: "flex", flexDirection: "column", gap: "0.1rem",
          }}>
            <span style={{ fontSize: "1.5rem", fontWeight: 800, color: s.text, lineHeight: 1 }}>{s.value}</span>
            <span style={{ fontSize: "0.78rem", fontWeight: 600, color: s.text, opacity: 0.8 }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Sélecteur d'année scolaire */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
        <button
          onClick={() => setSchoolYear((y) => y - 1)}
          style={{ background: "oklch(0.90 0.04 265)", border: "none", borderRadius: "0.5rem", padding: "0.35rem 0.7rem", cursor: "pointer", fontWeight: 700, fontSize: "1rem" }}
        >←</button>
        <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "oklch(0.35 0.10 270)" }}>
          Année scolaire {schoolYear}–{schoolYear + 1}
        </span>
        <button
          onClick={() => setSchoolYear((y) => y + 1)}
          style={{ background: "oklch(0.90 0.04 265)", border: "none", borderRadius: "0.5rem", padding: "0.35rem 0.7rem", cursor: "pointer", fontWeight: 700, fontSize: "1rem" }}
        >→</button>
      </div>

      {children.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "oklch(0.55 0.07 260)", fontSize: "0.95rem" }}>
          👶 Aucun enfant enregistré. Ajoutez des enfants dans la section <strong>Enfants</strong>.
        </div>
      ) : (
        /* ── Tableau scrollable ── */
        <div style={{ overflowX: "auto", borderRadius: "1rem", boxShadow: "0 2px 16px oklch(0 0 0 / .08)" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", background: "white", minWidth: "700px" }}>
            <thead>
              <tr style={{ background: "linear-gradient(135deg, oklch(0.60 0.22 310), oklch(0.52 0.22 260))" }}>
                <th style={{ ...cellBase, cursor: "default", color: "#fff", background: "transparent", border: "none", textAlign: "left", padding: "0.6rem 0.8rem", fontWeight: 700, fontSize: "0.82rem", position: "sticky", left: 0, minWidth: "140px" }}>
                  Enfant
                </th>
                {SCHOOL_MONTHS.map(({ label, m }) => (
                  <th key={m} style={{ ...cellBase, cursor: "default", color: "#fff", background: "transparent", border: "none", fontWeight: 700, fontSize: "0.78rem" }}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((child, rowIdx) => (
                <tr key={child.id} style={{ background: rowIdx % 2 === 0 ? "white" : "oklch(0.97 0.02 260)" }}>
                  {/* Nom enfant — sticky */}
                  <td style={{
                    ...cellBase, cursor: "default", textAlign: "left", padding: "0.5rem 0.8rem",
                    fontWeight: 600, fontSize: "0.84rem", color: "oklch(0.28 0.08 270)",
                    position: "sticky", left: 0, background: rowIdx % 2 === 0 ? "white" : "oklch(0.97 0.02 260)",
                    borderRight: "2px solid oklch(0.85 0.06 265)",
                  }}>
                    {child.lastName} {child.firstName}
                  </td>
                  {/* Cellules mois */}
                  {SCHOOL_MONTHS.map(({ m }) => {
                    const mk = monthKey(schoolYear, m);
                    const pay = getPayment(child.id, mk);
                    const { bg, color } = cellColor(pay);
                    const isActive = activeCell?.childId === child.id && activeCell?.mk === mk;
                    return (
                      <td
                        key={m}
                        onClick={() => openCell(child.id, mk)}
                        style={{
                          ...cellBase,
                          background: isActive ? "oklch(0.75 0.20 290)" : bg,
                          color: isActive ? "#fff" : color,
                          fontWeight: pay?.status === "paid" ? 700 : 400,
                          outline: isActive ? "2px solid oklch(0.55 0.22 290)" : undefined,
                        }}
                        title={pay?.paidAt ? `Payé le ${pay.paidAt}` : "Cliquer pour enregistrer"}
                      >
                        {pay?.status === "paid" ? "✓" : pay?.status === "late" ? "!" : "·"}
                        {pay?.paidAt && (
                          <div style={{ fontSize: "0.62rem", opacity: 0.85, lineHeight: 1.1 }}>
                            {pay.paidAt.slice(5).replace("-", "/")}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Popover de saisie ── */}
      {activeCell && (
        <>
          {/* Overlay */}
          <div
            onClick={() => setActiveCell(null)}
            style={{ position: "fixed", inset: 0, zIndex: 40, background: "oklch(0 0 0 / .25)" }}
          />
          <div
            ref={popRef}
            style={{
              position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
              zIndex: 50, background: "white", borderRadius: "1.25rem",
              boxShadow: "0 16px 60px oklch(0 0 0 / .22)",
              padding: "1.5rem", minWidth: "280px", maxWidth: "340px", width: "90vw",
            }}
          >
            <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "oklch(0.35 0.10 270)", marginBottom: "1rem" }}>
              💳 Enregistrer le paiement
              <div style={{ fontSize: "0.78rem", fontWeight: 500, color: "oklch(0.55 0.07 260)", marginTop: "0.2rem" }}>
                {(() => {
                  const c = children.find((x) => x.id === activeCell.childId);
                  return c ? `${c.lastName} ${c.firstName}` : "";
                })()} · {activeCell.mk}
              </div>
            </div>

            {/* Date */}
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "oklch(0.45 0.08 265)", marginBottom: "0.3rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Date de paiement
            </label>
            <input
              type="date"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              style={{
                width: "100%", padding: "0.6rem 0.8rem", borderRadius: "0.75rem",
                border: "1.5px solid oklch(0.80 0.07 260)", fontSize: "0.92rem",
                marginBottom: "0.75rem", boxSizing: "border-box", outline: "none",
              }}
            />

            {/* Montant */}
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "oklch(0.45 0.08 265)", marginBottom: "0.3rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Montant (DA)
            </label>
            <input
              type="number"
              min="0"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              placeholder="ex : 8000"
              style={{
                width: "100%", padding: "0.6rem 0.8rem", borderRadius: "0.75rem",
                border: "1.5px solid oklch(0.80 0.07 260)", fontSize: "0.92rem",
                marginBottom: "1rem", boxSizing: "border-box", outline: "none",
              }}
            />

            {/* Boutons */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <button
                onClick={() => savePayment("paid")}
                style={{
                  padding: "0.6rem", borderRadius: "0.75rem", border: "none", cursor: "pointer",
                  background: "oklch(0.72 0.22 142)", color: "#fff", fontWeight: 700, fontSize: "0.88rem",
                }}
              >
                ✓ Payé
              </button>
              <button
                onClick={() => savePayment("late")}
                style={{
                  padding: "0.6rem", borderRadius: "0.75rem", border: "none", cursor: "pointer",
                  background: "oklch(0.80 0.20 27)", color: "#fff", fontWeight: 700, fontSize: "0.88rem",
                }}
              >
                ! En retard
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              <button
                onClick={() => savePayment("pending")}
                style={{
                  padding: "0.6rem", borderRadius: "0.75rem", border: "1.5px solid oklch(0.80 0.07 260)",
                  background: "white", color: "oklch(0.45 0.08 265)", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer",
                }}
              >
                · En attente
              </button>
              <button
                onClick={() => setActiveCell(null)}
                style={{
                  padding: "0.6rem", borderRadius: "0.75rem", border: "1.5px solid oklch(0.80 0.07 260)",
                  background: "white", color: "oklch(0.55 0.07 260)", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer",
                }}
              >
                Annuler
              </button>
            </div>
          </div>
        </>
      )}

      {/* Légende */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "1rem", fontSize: "0.78rem", color: "oklch(0.50 0.07 260)" }}>
        <span><span style={{ background: "oklch(0.88 0.14 142)", borderRadius: "50%", display: "inline-block", width: 10, height: 10, marginRight: 4 }} />Payé</span>
        <span><span style={{ background: "oklch(0.92 0.14 27)", borderRadius: "50%", display: "inline-block", width: 10, height: 10, marginRight: 4 }} />En retard</span>
        <span><span style={{ background: "oklch(0.94 0.02 260)", borderRadius: "50%", display: "inline-block", width: 10, height: 10, marginRight: 4 }} />En attente</span>
      </div>
    </div>
  );
}
