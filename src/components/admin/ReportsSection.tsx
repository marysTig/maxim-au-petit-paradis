import { useMemo, useState } from "react";
import { buildReport, localDateStr } from "../../lib/admin-helpers";
import type { DayStatus } from "../../lib/admin-helpers";
import { card, inputStyle, labelStyle, PageHeader, EmptyState, softBtn } from "./ui";

export const CURRENCY = "DA";

export function ReportsSection({
  children,
  parentsCount,
  nanisCount,
  presences,
}: {
  children: { section: string }[];
  parentsCount: number;
  nanisCount: number;
  presences: Record<string, Record<string, DayStatus>>;
}) {
  const [month, setMonth] = useState(localDateStr().slice(0, 7));

  const report = useMemo(
    () => buildReport({ children, presences, finance: [], month }),
    [children, presences, month]
  );

  const monthLabel = useMemo(() => {
    const [y, m] = month.split("-").map(Number);
    if (!y || !m) return month;
    const label = new Date(y, m - 1, 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }, [month]);

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
          <div className="no-print">
            <button onClick={() => window.print()} style={softBtn}>
              🖨️ Imprimer
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

      {children.length === 0 && nanisCount === 0 ? (
        <EmptyState icon="📊" text="Ajoutez des enfants ou des nanis pour générer des rapports." />
      ) : (
        <>
          {/* Stat cards : enfants, parents, nanis */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem", marginBottom: "1.25rem" }}>
            {statCard("👶", report.childCount, "Enfants", "oklch(0.52 0.22 260)")}
            {statCard("👨‍👩‍👧", parentsCount, "Parents", "oklch(0.52 0.22 310)")}
            {statCard("👩‍🍼", nanisCount, "Nanis", "oklch(0.55 0.20 340)")}
          </div>

          {/* Enfants par section */}
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
