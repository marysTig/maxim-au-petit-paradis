import { useMemo, useState } from "react";
import type { FinanceEntry } from "../../lib/admin-extra";
import { buildReport, financeToCsv, localDateStr } from "../../lib/admin-helpers";
import type { DayStatus } from "../../lib/admin-helpers";
import { card, inputStyle, labelStyle, PageHeader, EmptyState, primaryBtn, softBtn } from "./ui";

export const CURRENCY = "€";

export function ReportsSection({
  children,
  parentsCount,
  nanisCount,
  presences,
  finance,
}: {
  children: { section: string }[];
  parentsCount: number;
  nanisCount: number;
  presences: Record<string, Record<string, DayStatus>>;
  finance: FinanceEntry[];
}) {
  const [month, setMonth] = useState(localDateStr().slice(0, 7));

  const report = useMemo(
    () => buildReport({ children, presences, finance, month }),
    [children, presences, finance, month]
  );

  const monthLabel = useMemo(() => {
    const [y, m] = month.split("-").map(Number);
    if (!y || !m) return month;
    const label = new Date(y, m - 1, 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }, [month]);

  function exportCsv() {
    const rows = finance.filter((e) => e.date.startsWith(month)).sort((a, b) => a.date.localeCompare(b.date));
    const blob = new Blob(["﻿" + financeToCsv(rows)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financement-${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const money = (n: number) => `${n.toLocaleString("fr-FR")} ${CURRENCY}`;
  const sectionRows = Object.entries(report.sectionCounts).sort(([a], [b]) => a.localeCompare(b, "fr"));

  const statCard = (icon: string, value: string | number, label: string, color: string) => (
    <div style={{ ...card, textAlign: "center", padding: "1.1rem" }}>
      <div style={{ fontSize: "1.5rem" }}>{icon}</div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: "1.7rem", fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "oklch(0.55 0.07 260)" }}>{label}</div>
    </div>
  );

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

      {children.length === 0 && nanisCount === 0 && finance.length === 0 ? (
        <EmptyState icon="📊" text="Ajoutez des enfants, des nanis ou des écritures de financement pour générer des rapports." />
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem", marginBottom: "1.25rem" }}>
            {statCard("👶", report.childCount, "Enfants", "oklch(0.52 0.22 260)")}
            {statCard("👨‍👩‍👧", parentsCount, "Parents", "oklch(0.52 0.22 310)")}
            {statCard("👩‍🍼", nanisCount, "Nanis", "oklch(0.55 0.20 340)")}
            {statCard("✅", report.naniPresentDays, "Jours de présence nanis", "oklch(0.55 0.22 142)")}
            {statCard("❌", report.naniAbsentDays, "Jours d'absence nanis", "oklch(0.55 0.20 27)")}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem", marginBottom: "1.25rem" }}>
            {statCard("💶", money(report.finance.recette), "Recettes", "oklch(0.55 0.22 142)")}
            {statCard("🏛️", money(report.finance.subvention), "Subventions", "oklch(0.52 0.22 260)")}
            {statCard("🧾", money(report.finance.depense), "Dépenses", "oklch(0.55 0.20 27)")}
            {statCard("⚖️", money(report.balance), "Solde du mois", report.balance >= 0 ? "oklch(0.45 0.20 142)" : "oklch(0.50 0.22 27)")}
          </div>

          {sectionRows.length > 0 && (
            <div style={card}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.95rem", color: "oklch(0.40 0.10 270)", marginBottom: "0.75rem" }}>
                👶 Enfants par section
              </div>
              <div style={{ display: "grid", gap: "0.5rem" }}>
                {sectionRows.map(([name, count]) => {
                  const pct = report.childCount === 0 ? 0 : (count / report.childCount) * 100;
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
          )}
        </>
      )}

      <style>{`@media print { .no-print { display: none !important; } }`}</style>
    </div>
  );
}
