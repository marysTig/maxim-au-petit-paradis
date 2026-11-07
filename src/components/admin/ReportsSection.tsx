import { useMemo, useState } from "react";
import { buildReport, localDateStr } from "../../lib/admin-helpers";
import type { DayStatus } from "../../lib/admin-helpers";
import type { Payment, FinanceEntry, NaniPayment } from "../../lib/admin-extra";
import type { PreInscrit } from "./PreInscriptionSection";
import { card, inputStyle, labelStyle, PageHeader, EmptyState, softBtn } from "./ui";

export const CURRENCY = "DA";

function money(n: number) {
  return `${(Number(n) || 0).toLocaleString("fr-FR")} ${CURRENCY}`;
}

interface CrecheSection { id: string; name: string }

export function ReportsSection({
  children,
  parentsCount,
  nanisCount,
  presences,
  crecheSections = [],
  payments = [],
  preInscrits = [],
  naniPayments = [],
  finance = [],
}: {
  children: { section: string; active?: boolean }[];
  parentsCount: number;
  nanisCount: number;
  presences: Record<string, Record<string, DayStatus>>;
  crecheSections?: CrecheSection[];
  payments?: Payment[];
  preInscrits?: PreInscrit[];
  naniPayments?: NaniPayment[];
  finance?: FinanceEntry[];
}) {
  const [month, setMonth] = useState(localDateStr().slice(0, 7));

  // Enfants actifs uniquement (les inactifs ne sont pas comptabilisés dans les sections)
  const activeChildren = useMemo(() => {
    return children.filter((c) => c.active !== false);
  }, [children]);

  const report = useMemo(
    () => buildReport({ children: activeChildren, presences, finance: [], month }),
    [activeChildren, presences, month]
  );

  const monthLabel = useMemo(() => {
    const [y, m] = month.split("-").map(Number);
    if (!y || !m) return month;
    const label = new Date(y, m - 1, 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }, [month]);

  /* ── 1. Calcul des Gains (Paiements enfants + Pré-inscriptions du mois) ── */
  const gainsData = useMemo(() => {
    // Paiements des enfants pour ce mois (status "paid")
    // Note : parenthèses explicites pour éviter le bug de priorité || vs &&
    const childPays = (payments ?? []).filter(
      (p) => p.status === "paid" && (p.month === month || (p.paidAt && p.paidAt.startsWith(month)))
    );
    const childPaysTotal = childPays.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    // Montant payé dans pré-inscription pour le mois sélectionné
    const preInscPays = (preInscrits ?? []).filter(
      (p) => p.datePaiement && p.datePaiement.startsWith(month)
    );
    const preInscTotal = preInscPays.reduce((sum, p) => sum + (Number(p.montant) || 0), 0);

    const total = childPaysTotal + preInscTotal;

    return {
      childPaysTotal,
      childPaysCount: childPays.length,
      preInscTotal,
      preInscCount: preInscPays.length,
      total,
    };
  }, [payments, preInscrits, month]);

  /* ── 2. Calcul des Dépenses (Salaires des nanis + Dépenses financement du mois) ── */
  const depensesData = useMemo(() => {
    // Salaires des nanis versés pour ce mois
    const naniPays = (naniPayments ?? []).filter(
      (p) => (p.periodeRef && p.periodeRef.startsWith(month)) || (p.datePaiement && p.datePaiement.startsWith(month))
    );
    const naniSalairesTotal = naniPays.reduce((sum, p) => {
      const verse = Number(p.montantVerse) || 0;
      if (verse > 0) return sum + verse;
      if (p.statut === "paye") return sum + (Number(p.montantDu) || 0);
      return sum;
    }, 0);

    // Dépenses de fonctionnement (table finance_entries, kind === 'depense')
    const finDepenses = (finance ?? []).filter(
      (f) => f.kind === "depense" && f.date && f.date.startsWith(month)
    );
    const finDepensesTotal = finDepenses.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

    const total = naniSalairesTotal + finDepensesTotal;

    return {
      naniSalairesTotal,
      naniSalairesCount: naniPays.length,
      finDepensesTotal,
      finDepensesCount: finDepenses.length,
      total,
    };
  }, [naniPayments, finance, month]);

  const soldeNet = gainsData.total - depensesData.total;
  const maxBarTotal = Math.max(gainsData.total, depensesData.total, 1);
  const gainsBarPct = Math.min(100, Math.round((gainsData.total / maxBarTotal) * 100));
  const depensesBarPct = Math.min(100, Math.round((depensesData.total / maxBarTotal) * 100));

  /**
   * Si on connaît les sections officielles, on regroupe les enfants selon
   * la liste de référence (Section & Groupe). Les enfants dont la section
   * ne correspond plus à aucune section officielle sont comptés dans "Autre".
   * Sinon on conserve le comportement historique (valeurs distinctes).
   */
  const sectionRows = useMemo(() => {
    if (crecheSections.length > 0) {
      const officialNames = new Set(crecheSections.map((s) => s.name));
      const counts: Record<string, number> = {};
      for (const s of crecheSections) counts[s.name] = 0;

      let autreCount = 0;
      for (const c of activeChildren) {
        if (officialNames.has(c.section)) {
          counts[c.section] = (counts[c.section] ?? 0) + 1;
        } else {
          autreCount++;
        }
      }

      const rows = Object.entries(counts).sort(([a], [b]) => a.localeCompare(b, "fr"));
      if (autreCount > 0) rows.push(["Autre", autreCount]);
      return rows;
    }
    // Fallback : valeurs distinctes issues des enfants actifs
    return Object.entries(report.sectionCounts).sort(([a], [b]) => a.localeCompare(b, "fr"));
  }, [activeChildren, crecheSections, report.sectionCounts]);

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

          {/* ── BARS MENSUELLES : GAINS & DÉPENSES ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
            {/* ── BARRE GAINS ── */}
            <div style={{
              ...card,
              border: "1.5px solid oklch(0.55 0.22 142 / .35)",
              background: "linear-gradient(160deg, oklch(1 0 0 / .85), oklch(0.97 0.03 142 / .45))",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.6rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: "oklch(0.32 0.16 142)" }}>
                  <span>📈</span>
                  <span>Gains du mois</span>
                </div>
                <span style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  padding: "0.2rem 0.6rem",
                  borderRadius: "9999px",
                  background: "oklch(0.55 0.22 142 / .15)",
                  color: "oklch(0.30 0.18 142)",
                }}>
                  Total : {money(gainsData.total)}
                </span>
              </div>

              {/* Barre visuelle Gains */}
              <div style={{ height: "10px", borderRadius: "9999px", background: "oklch(0.55 0.22 142 / .15)", overflow: "hidden", marginBottom: "0.85rem" }}>
                <div
                  style={{
                    width: `${gainsBarPct}%`,
                    height: "100%",
                    borderRadius: "9999px",
                    background: "linear-gradient(135deg, oklch(0.60 0.22 142), oklch(0.48 0.22 155))",
                    transition: "width .3s ease",
                  }}
                />
              </div>

              {/* Détails Gains */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem", padding: "0.45rem 0.65rem", background: "oklch(1 0 0 / .6)", borderRadius: "0.65rem", border: "1px solid oklch(0.55 0.22 142 / .2)" }}>
                  <div>
                    <div style={{ fontWeight: 700, color: "oklch(0.30 0.08 270)" }}>👶 Paiements des enfants</div>
                    <div style={{ fontSize: "0.72rem", color: "oklch(0.55 0.07 260)" }}>{gainsData.childPaysCount} paiement{gainsData.childPaysCount > 1 ? "s" : ""} validé{gainsData.childPaysCount > 1 ? "s" : ""}</div>
                  </div>
                  <div style={{ fontWeight: 800, color: "oklch(0.35 0.18 142)" }}>{money(gainsData.childPaysTotal)}</div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem", padding: "0.45rem 0.65rem", background: "oklch(1 0 0 / .6)", borderRadius: "0.65rem", border: "1px solid oklch(0.55 0.22 142 / .2)" }}>
                  <div>
                    <div style={{ fontWeight: 700, color: "oklch(0.30 0.08 270)" }}>📝 Pré-inscriptions</div>
                    <div style={{ fontSize: "0.72rem", color: "oklch(0.55 0.07 260)" }}>{gainsData.preInscCount} inscription{gainsData.preInscCount > 1 ? "s" : ""} pour ce mois</div>
                  </div>
                  <div style={{ fontWeight: 800, color: "oklch(0.35 0.18 142)" }}>{money(gainsData.preInscTotal)}</div>
                </div>
              </div>
            </div>

            {/* ── BARRE DÉPENSES ── */}
            <div style={{
              ...card,
              border: "1.5px solid oklch(0.577 0.245 27 / .35)",
              background: "linear-gradient(160deg, oklch(1 0 0 / .85), oklch(0.97 0.04 27 / .45))",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.6rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: "oklch(0.45 0.22 27)" }}>
                  <span>📉</span>
                  <span>Dépenses du mois</span>
                </div>
                <span style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  padding: "0.2rem 0.6rem",
                  borderRadius: "9999px",
                  background: "oklch(0.577 0.245 27 / .15)",
                  color: "oklch(0.50 0.22 27)",
                }}>
                  Total : {money(depensesData.total)}
                </span>
              </div>

              {/* Barre visuelle Dépenses */}
              <div style={{ height: "10px", borderRadius: "9999px", background: "oklch(0.577 0.245 27 / .15)", overflow: "hidden", marginBottom: "0.85rem" }}>
                <div
                  style={{
                    width: `${depensesBarPct}%`,
                    height: "100%",
                    borderRadius: "9999px",
                    background: "linear-gradient(135deg, oklch(0.60 0.22 27), oklch(0.50 0.22 20))",
                    transition: "width .3s ease",
                  }}
                />
              </div>

              {/* Détails Dépenses */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem", padding: "0.45rem 0.65rem", background: "oklch(1 0 0 / .6)", borderRadius: "0.65rem", border: "1px solid oklch(0.577 0.245 27 / .2)" }}>
                  <div>
                    <div style={{ fontWeight: 700, color: "oklch(0.30 0.08 270)" }}>👩‍🍼 Salaires des nanis</div>
                    <div style={{ fontSize: "0.72rem", color: "oklch(0.55 0.07 260)" }}>{depensesData.naniSalairesCount} versement{depensesData.naniSalairesCount > 1 ? "s" : ""} enregistré{depensesData.naniSalairesCount > 1 ? "s" : ""}</div>
                  </div>
                  <div style={{ fontWeight: 800, color: "oklch(0.50 0.22 27)" }}>{money(depensesData.naniSalairesTotal)}</div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem", padding: "0.45rem 0.65rem", background: "oklch(1 0 0 / .6)", borderRadius: "0.65rem", border: "1px solid oklch(0.577 0.245 27 / .2)" }}>
                  <div>
                    <div style={{ fontWeight: 700, color: "oklch(0.30 0.08 270)" }}>🏢 Dépenses (Financement)</div>
                    <div style={{ fontSize: "0.72rem", color: "oklch(0.55 0.07 260)" }}>{depensesData.finDepensesCount} dépense{depensesData.finDepensesCount > 1 ? "s" : ""} de fonctionnement</div>
                  </div>
                  <div style={{ fontWeight: 800, color: "oklch(0.50 0.22 27)" }}>{money(depensesData.finDepensesTotal)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Solde net du mois */}
          <div style={{
            ...card,
            padding: "0.75rem 1.25rem",
            marginBottom: "1.25rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.5rem",
            background: soldeNet >= 0
              ? "linear-gradient(135deg, oklch(0.55 0.22 142 / .10), oklch(0.48 0.22 155 / .10))"
              : "linear-gradient(135deg, oklch(0.577 0.245 27 / .10), oklch(0.50 0.22 20 / .10))",
            border: `1.5px solid ${soldeNet >= 0 ? "oklch(0.55 0.22 142 / .3)" : "oklch(0.577 0.245 27 / .3)"}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "1.2rem" }}>{soldeNet >= 0 ? "✨" : "⚠️"}</span>
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.92rem", color: "oklch(0.28 0.08 270)" }}>
                  Solde net du mois ({monthLabel})
                </div>
                <div style={{ fontSize: "0.75rem", color: "oklch(0.50 0.08 265)" }}>
                  Gains ({money(gainsData.total)}) − Dépenses ({money(depensesData.total)})
                </div>
              </div>
            </div>
            <div style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: "1.15rem",
              color: soldeNet >= 0 ? "oklch(0.35 0.18 142)" : "oklch(0.50 0.22 27)",
            }}>
              {soldeNet >= 0 ? `+${money(soldeNet)}` : `-${money(Math.abs(soldeNet))}`}
            </div>
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
