import { useState } from "react";
import { X } from "lucide-react";
import type { Payment } from "../../lib/admin-extra";
import { localDateStr } from "../../lib/admin-helpers";
import { CURRENCY } from "./ReportsSection";
import { badge, inputStyle, labelStyle, primaryBtn, softBtn } from "./ui";

export const thisMonth = () => localDateStr().slice(0, 7);

/** A month counts as paid once a "paid" payment is recorded for it; otherwise it is waiting. */
export function isPaidFor(payments: Payment[], childId: string, month: string): boolean {
  return payments.some((p) => p.childId === childId && p.month === month && p.status === "paid");
}

function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  if (!y || !m) return month;
  const label = new Date(y, m - 1, 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

const money = (n: number) => `${n.toLocaleString("fr-FR")} ${CURRENCY}`;
const PAID = "oklch(0.55 0.22 142)";
const WAITING = "oklch(0.60 0.18 70)";

export function PaymentModal({
  childId,
  childName,
  payments,
  initialView,
  onPay,
  onClose,
}: {
  childId: string;
  childName: string;
  payments: Payment[];
  initialView: "status" | "pay";
  /** When omitted the modal is read-only (no payment button). */
  onPay?: ((p: Payment) => void) | undefined;
  onClose: () => void;
}) {
  const [view, setView] = useState<"status" | "pay">(onPay ? initialView : "status");
  const now = thisMonth();
  const mine = payments.filter((p) => p.childId === childId).sort((a, b) => b.month.localeCompare(a.month));
  const lastPaid = mine.find((p) => p.status === "paid");
  const current = mine.find((p) => p.month === now && p.status === "paid");

  const [month, setMonth] = useState(now);
  const [amount, setAmount] = useState(lastPaid ? String(lastPaid.amount) : "");
  const amountValue = Number(amount.replace(",", "."));
  const canSave = month !== "" && Number.isFinite(amountValue) && amountValue > 0;
  const alreadyPaid = isPaidFor(payments, childId, month);

  function save() {
    if (!onPay || !canSave) return;
    onPay({
      id: `${childId}_${month}`,
      childId,
      month,
      amount: amountValue,
      status: "paid",
      paidAt: localDateStr(),
    });
    setView("status");
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 10000,
        background: "oklch(0.15 0.08 265 / .65)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "linear-gradient(160deg, oklch(0.99 0.01 265), oklch(0.96 0.03 270))",
          borderRadius: "1.5rem", boxShadow: "0 24px 80px oklch(0.30 0.15 270 / .35)",
          width: "100%", maxWidth: "460px", maxHeight: "88vh", overflowY: "auto",
          padding: "1.75rem", position: "relative",
        }}
      >
        <button
          onClick={onClose}
          title="Fermer"
          style={{
            position: "absolute", top: "1rem", right: "1rem", background: "oklch(0.577 0.245 27 / .10)",
            border: "none", borderRadius: "50%", width: "2rem", height: "2rem",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "oklch(0.50 0.22 27)",
          }}
        >
          <X size={16} />
        </button>

        <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.2rem", color: "oklch(0.25 0.10 270)", marginBottom: "0.25rem" }}>
          💳 Paiement
        </div>
        <div style={{ fontSize: "0.88rem", color: "oklch(0.52 0.08 260)", marginBottom: "1.1rem" }}>{childName}</div>

        {/* Statut du mois en cours */}
        <div
          style={{
            display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem",
            padding: "0.9rem 1rem", borderRadius: "1rem", marginBottom: "1rem",
            background: current ? "oklch(0.55 0.22 142 / .10)" : "oklch(0.60 0.18 70 / .10)",
            border: `1.5px solid ${current ? "oklch(0.55 0.22 142 / .35)" : "oklch(0.60 0.18 70 / .35)"}`,
          }}
        >
          <div>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "oklch(0.50 0.08 265)" }}>
              {monthLabel(now)}
            </div>
            <div style={{ fontSize: "0.85rem", color: "oklch(0.35 0.08 270)", marginTop: "0.15rem" }}>
              {current
                ? `${money(current.amount)} le ${new Date(current.paidAt + "T12:00:00").toLocaleDateString("fr-FR")}`
                : "Aucun paiement reçu ce mois-ci"}
            </div>
          </div>
          <span style={badge(current ? PAID : WAITING)}>{current ? "✅ Payé" : "⏳ En attente"}</span>
        </div>

        {view === "pay" ? (
          <div style={{ display: "grid", gap: "0.75rem", marginBottom: "1rem" }}>
            <div>
              <label style={labelStyle}>Mois</label>
              <input type="month" style={inputStyle} value={month} onChange={(e) => setMonth(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Montant ({CURRENCY})</label>
              <input
                style={inputStyle}
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="120"
              />
            </div>
            {alreadyPaid && (
              <p style={{ margin: 0, fontSize: "0.8rem", color: "oklch(0.50 0.15 50)" }}>
                Un paiement existe déjà pour {monthLabel(month)} : il sera remplacé.
              </p>
            )}
            <div style={{ display: "flex", gap: "0.6rem" }}>
              <button
                onClick={save}
                disabled={!canSave}
                style={{ ...primaryBtn, flex: 1, justifyContent: "center", opacity: canSave ? 1 : 0.5, cursor: canSave ? "pointer" : "not-allowed" }}
              >
                Enregistrer le paiement
              </button>
              <button onClick={() => setView("status")} style={softBtn}>
                Annuler
              </button>
            </div>
          </div>
        ) : (
          onPay && (
            <button onClick={() => setView("pay")} style={{ ...primaryBtn, width: "100%", justifyContent: "center", marginBottom: "1rem" }}>
              💶 Enregistrer un paiement
            </button>
          )
        )}

        {/* Historique */}
        <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "oklch(0.50 0.08 265)", marginBottom: "0.4rem" }}>
          Historique
        </div>
        {mine.length === 0 ? (
          <p style={{ margin: 0, fontSize: "0.85rem", color: "oklch(0.60 0.05 260)" }}>Aucun paiement enregistré.</p>
        ) : (
          <div style={{ display: "grid", gap: "0.4rem" }}>
            {mine.map((p) => (
              <div
                key={p.id}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem",
                  padding: "0.5rem 0.75rem", borderRadius: "0.75rem", background: "oklch(0.97 0.02 265 / .6)",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "oklch(0.30 0.08 270)" }}>{monthLabel(p.month)}</div>
                  {p.paidAt && (
                    <div style={{ fontSize: "0.74rem", color: "oklch(0.55 0.07 260)" }}>
                      Payé le {new Date(p.paidAt + "T12:00:00").toLocaleDateString("fr-FR")}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "oklch(0.35 0.08 270)" }}>{money(p.amount)}</span>
                  <span style={badge(p.status === "paid" ? PAID : WAITING)}>{p.status === "paid" ? "Payé" : "En attente"}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
