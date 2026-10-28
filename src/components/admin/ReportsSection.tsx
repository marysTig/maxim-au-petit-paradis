import { useMemo, useState } from "react";
import { buildReport, localDateStr, paymentsToCsv } from "../../lib/admin-helpers";
import type { PayStatus } from "../../lib/admin-helpers";
import { card, inputStyle, labelStyle, PageHeader, EmptyState, primaryBtn, softBtn } from "./ui";

const SECTION_ORDER = ["Bébés", "Moyens", "Grands"];

export function ReportsSection({
  children,
  attendance,
  payments,
}: {
  children: { id: string; firstName: string; lastName: string; section: string }[];
  attendance: { childId: string; date: string; arrival: string | null }[];
  payments: { childId: string; month: string; amount: number; status: PayStatus }[];
}) {
  const [month, setMonth] = useState(localDateStr().slice(0, 7));

  const report = useMemo(
    () => buildReport({ children, attendance, payments, month }),
    [children, attendance, payments, month]
  );

  const monthLabel = useMemo(() => {
    const [y, m] = month.split("-").map(Number);
    if (!y || !m) return month;
    const label = new Date(y, m - 1, 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }, [month]);

  function exportCsv() {
    const rows = payments
      .filter((p) => p.month === month)
      .map((p) => {
        const child = children.find((c) => c.id === p.childId);
        return {
          childName: child ? `${child.firstName} ${child.lastName}` : p.childId,
          month: p.month,
          amount: p.amount,
          status: p.status,
        };
      });
    const blob = new Blob(["﻿" + paymentsToCsv(rows)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `paiements-${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const ratePct = Math.round(report.attendanceRate * 100);

  const sectionRows = SECTION_ORDER.map((s) => ({ name: s, count: report.sectionCounts[s] ?? 0 }));
  const others = children.length - sectionRows.reduce((sum, r) => sum + r.count, 0);
  if (others > 0) sectionRows.push({ name: "Non défini", count: others });

  const payCards: { key: PayStatus; label: string; icon: string; color: string }[] = [
    { key: "paid", label: "Payés", icon: "✅", color: "oklch(0.55 0.22 142)" },
    { key: "pending", label: "En attente", icon: "⏳", color: "oklch(0.60 0.18 70)" },
    { key: "late", label: "En retard", icon: "⚠️", color: "oklch(0.55 0.20 27)" },
  ];

  return (
    <div>
      <PageHeader
        icon="📊"
        title="Rapports"
        subtitle={monthLabel}
        action={
          <div className="no-print" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button onClick={() => window.print()} style={softBtn}>
              🖨️ Imprimer
            </button>
            <button onClick={exportCsv} style={primaryBtn}>
              ⬇️ Exporter CSV
            </button>
          </div>
        }
      />

      <div className="no-print" style={{ ...card, padding: "1rem 1.25rem", marginBottom: "1.25rem", maxWidth: "260px" }}>
        <label style={labelStyle}>Mois</label>
        <input
          type="month"
          style={inputStyle}
          value={month}
          onChange={(e) => e.target.value && setMonth(e.target.value)}
        />
      </div>

      {children.length === 0 ? (
        <EmptyState icon="📊" text="Ajoutez des enfants pour générer des rapports." />
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem", marginBottom: "1.25rem" }}>
            <div style={{ ...card, textAlign: "center", padding: "1.1rem" }}>
              <div style={{ fontSize: "1.5rem" }}>📈</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 700, color: "oklch(0.52 0.22 260)" }}>
                {ratePct} %
              </div>
              <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "oklch(0.55 0.07 260)" }}>Taux de présence</div>
            </div>
            <div style={{ ...card, textAlign: "center", padding: "1.1rem" }}>
              <div style={{ fontSize: "1.5rem" }}>🗓️</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 700, color: "oklch(0.52 0.22 310)" }}>
                {report.attendanceDays}
              </div>
              <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "oklch(0.55 0.07 260)" }}>Jours de pointage</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginBottom: "1.25rem" }}>
            {payCards.map((p) => (
              <div key={p.key} style={{ ...card, textAlign: "center", padding: "1rem" }}>
                <div style={{ fontSize: "1.4rem" }}>{p.icon}</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 700, color: p.color }}>
                  {report.payments[p.key].count}
                </div>
                <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "oklch(0.55 0.07 260)" }}>{p.label}</div>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: p.color, marginTop: "0.2rem" }}>
                  {report.payments[p.key].total.toLocaleString("fr-FR")} €
                </div>
              </div>
            ))}
          </div>

          <div style={card}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.95rem", color: "oklch(0.40 0.10 270)", marginBottom: "0.75rem" }}>
              👶 Enfants par section
            </div>
            <div style={{ display: "grid", gap: "0.5rem" }}>
              {sectionRows.map(({ name, count }) => {
                const pct = children.length === 0 ? 0 : (count / children.length) * 100;
                return (
                  <div key={name}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", fontWeight: 600, color: "oklch(0.40 0.10 270)" }}>
                      <span>{name}</span>
                      <span>{count}</span>
                    </div>
                    <div style={{ height: "8px", borderRadius: "9999px", background: "oklch(0.52 0.22 260 / .12)", overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          background: "linear-gradient(135deg, oklch(0.60 0.22 310), oklch(0.52 0.22 260))",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      <style>{`@media print { .no-print { display: none !important; } }`}</style>
    </div>
  );
}
