import { useState, useRef, useMemo } from "react";
import { Search, X, Printer, CheckSquare, Square } from "lucide-react";
import type { Payment } from "../../lib/admin-extra";
import { PageHeader } from "./ui";

/* ── Mois de l'année scolaire Sep → Juil ── */
const SCHOOL_MONTHS = [
  { label: "Sep", fullLabel: "Septembre", m: 9 },
  { label: "Oct", fullLabel: "Octobre", m: 10 },
  { label: "Nov", fullLabel: "Novembre", m: 11 },
  { label: "Déc", fullLabel: "Décembre", m: 12 },
  { label: "Jan", fullLabel: "Janvier", m: 1 },
  { label: "Fév", fullLabel: "Février", m: 2 },
  { label: "Mar", fullLabel: "Mars", m: 3 },
  { label: "Avr", fullLabel: "Avril", m: 4 },
  { label: "Mai", fullLabel: "Mai", m: 5 },
  { label: "Juin", fullLabel: "Juin", m: 6 },
  { label: "Juil", fullLabel: "Juillet", m: 7 },
];

function currentSchoolYear(): number {
  const now = new Date();
  return now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
}

function monthKey(schoolYear: number, m: number): string {
  const year = m >= 9 ? schoolYear : schoolYear + 1;
  return `${year}-${String(m).padStart(2, "0")}`;
}

function payId(childId: string, mk: string) {
  return `pay_${childId}_${mk}`;
}

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  section?: string;
  active?: boolean;
}

interface Props {
  children: Child[];
  payments: Payment[];
  onRecord: (p: Payment) => void;
  crecheSections?: { id: string; name: string }[];
}

type StatusFilter = "all" | "paid" | "pending" | "late";

const STATUS_FILTERS: { id: StatusFilter; label: string; color: string; text: string }[] = [
  { id: "all",     label: "Tout",       color: "oklch(0.88 0.04 265)", text: "oklch(0.35 0.10 270)" },
  { id: "paid",    label: "Payé",       color: "oklch(0.88 0.14 142)", text: "oklch(0.28 0.12 142)" },
  { id: "pending", label: "En attente", color: "oklch(0.93 0.06 70)",  text: "oklch(0.45 0.12 70)"  },
  { id: "late",    label: "En retard",  color: "oklch(0.92 0.14 27)",  text: "oklch(0.40 0.18 27)"  },
];

export function PaymentGridSection({ children, payments, onRecord, crecheSections = [] }: Props) {
  const [schoolYear,   setSchoolYear]   = useState(currentSchoolYear);
  const [activeCell,   setActiveCell]   = useState<{ childId: string; mk: string } | null>(null);
  const [dateInput,    setDateInput]    = useState("");
  const [amountInput,  setAmountInput]  = useState("");
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null); // null = tous les mois

  /* ── Sélection pour l'impression de bon de paiement (un seul enfant à la fois) ── */
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]); // liste des mk (ex: ["2026-09", "2026-10"])

  /* ── Filtres ── */
  const [search,        setSearch]        = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [filterStatus,  setFilterStatus]  = useState<StatusFilter>("all");

  const popRef = useRef<HTMLDivElement>(null);

  /* Sections issues de "Section & Groupe" (si configurées), ou des sections des enfants */
  const sections = useMemo(() => {
    if (crecheSections && crecheSections.length > 0) {
      const names = crecheSections.map((s) => s.name.trim()).filter(Boolean);
      return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b, "fr"));
    }
    const s = new Set(children.filter((c) => c.active !== false).map((c) => c.section?.trim() ?? "").filter(Boolean));
    return Array.from(s).sort((a, b) => a.localeCompare(b, "fr"));
  }, [crecheSections, children]);

  /* Liste filtrée : les enfants inactifs sont exclus */
  const filtered = useMemo(() => {
    const monthKeys = SCHOOL_MONTHS.map(({ m }) => monthKey(schoolYear, m));

    return [...children]
      .filter((c) => {
        // Enfant actif uniquement
        if (c.active === false) return false;
        // Recherche nom
        const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
        if (search && !fullName.includes(search.toLowerCase())) return false;
        // Section
        if (filterSection && (c.section ?? "") !== filterSection) return false;
        // Statut — au moins un mois avec ce statut dans l'année en cours
        if (filterStatus !== "all") {
          const hasStatus = monthKeys.some((mk) => {
            const p = payments.find((p) => p.childId === c.id && p.month === mk);
            if (filterStatus === "paid")    return p?.status === "paid";
            if (filterStatus === "pending") return !p || p.status === "pending";
            if (filterStatus === "late")    return p?.status === "late";
            return false;
          });
          if (!hasStatus) return false;
        }
        return true;
      })
      .sort((a, b) =>
        `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`)
      );
  }, [children, payments, search, filterSection, filterStatus, schoolYear]);

  function getPayment(childId: string, mk: string): Payment | undefined {
    return payments.find((p) => p.childId === childId && p.month === mk);
  }

  /* ── Gestion de la sélection d'un mois payé pour le bon d'impression ── */
  function toggleMonthSelection(childId: string, mk: string, e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    const p = getPayment(childId, mk);
    if (!p || p.status !== "paid") return; // Uniquement les mois payés

    // Si on clique sur un enfant différent, on réinitialise la sélection pour cet enfant
    if (selectedChildId !== childId) {
      setSelectedChildId(childId);
      setSelectedMonths([mk]);
      return;
    }

    // Même enfant : toggle
    if (selectedMonths.includes(mk)) {
      const next = selectedMonths.filter((m) => m !== mk);
      setSelectedMonths(next);
      if (next.length === 0) {
        setSelectedChildId(null);
      }
    } else {
      setSelectedMonths([...selectedMonths, mk]);
    }
  }

  function clearMonthSelection() {
    setSelectedChildId(null);
    setSelectedMonths([]);
  }

  /* ── Génération et impression du bon de paiement ── */
  function printPaymentReceipt() {
    if (!selectedChildId || selectedMonths.length === 0) return;
    const child = children.find((c) => c.id === selectedChildId);
    if (!child) return;

    // Trier les mois par ordre chronologique
    const sortedMks = [...selectedMonths].sort();
    const receiptRows = sortedMks.map((mk) => {
      const pay = getPayment(selectedChildId, mk);
      const [y, mStr] = mk.split("-");
      const mNum = Number(mStr);
      const mInfo = SCHOOL_MONTHS.find((sm) => sm.m === mNum);
      const monthLabel = mInfo ? `${mInfo.fullLabel} ${y}` : mk;
      const amount = pay?.amount ?? 0;
      const paidDate = pay?.paidAt
        ? new Date(pay.paidAt).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })
        : "—";
      return { mk, monthLabel, amount, paidDate, rawDate: pay?.paidAt || "" };
    });

    const totalAmount = receiptRows.reduce((acc, r) => acc + r.amount, 0);
    const printedOn = new Date().toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    const receiptNum = `BON-${schoolYear}-${Date.now().toString().slice(-6)}`;

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8"/>
<title>Bon de paiement - ${child.lastName} ${child.firstName}</title>
<style>
  @page {
    size: A4 portrait;
    margin: 12mm 15mm;
  }
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #1e1b4b;
    background: #fff;
    margin: 0;
    padding: 20px;
    font-size: 13px;
    line-height: 1.45;
  }
  .receipt-container {
    max-width: 780px;
    margin: 0 auto;
    border: 2px solid #4338ca;
    border-radius: 14px;
    padding: 28px 32px;
    background: #ffffff;
    box-shadow: 0 4px 20px rgba(67, 56, 202, 0.08);
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 2px solid #e0e7ff;
    padding-bottom: 18px;
    margin-bottom: 22px;
  }
  .brand h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 800;
    color: #3730a3;
    letter-spacing: -0.02em;
  }
  .brand p {
    margin: 3px 0 0;
    font-size: 12px;
    color: #6366f1;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .receipt-meta {
    text-align: right;
  }
  .receipt-badge {
    display: inline-block;
    background: #e0e7ff;
    color: #3730a3;
    padding: 5px 12px;
    border-radius: 9999px;
    font-weight: 700;
    font-size: 12px;
    margin-bottom: 6px;
  }
  .receipt-meta p {
    margin: 2px 0;
    font-size: 11px;
    color: #64748b;
  }
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 24px;
  }
  .info-box {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 14px 16px;
  }
  .info-title {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #475569;
    margin-bottom: 8px;
    border-bottom: 1px dashed #cbd5e1;
    padding-bottom: 4px;
  }
  .info-row {
    display: flex;
    justify-content: space-between;
    margin: 4px 0;
    font-size: 12.5px;
  }
  .info-label { color: #64748b; }
  .info-val { font-weight: 700; color: #0f172a; }
  table.items-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
  }
  table.items-table th {
    background: #4338ca;
    color: #ffffff;
    text-align: left;
    padding: 10px 14px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  table.items-table th:first-child { border-top-left-radius: 8px; }
  table.items-table th:last-child { border-top-right-radius: 8px; text-align: right; }
  table.items-table td {
    padding: 10px 14px;
    border-bottom: 1px solid #e2e8f0;
    font-size: 12.5px;
  }
  table.items-table td:last-child {
    text-align: right;
    font-weight: 700;
  }
  table.items-table tr:nth-child(even) {
    background: #f8fafc;
  }
  .status-paid {
    display: inline-block;
    background: #dcfce7;
    color: #15803d;
    padding: 3px 8px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 700;
  }
  .total-card {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 30px;
  }
  .total-box {
    background: #eef2ff;
    border: 2px solid #c7d2fe;
    border-radius: 10px;
    padding: 12px 24px;
    min-width: 260px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .total-label {
    font-size: 14px;
    font-weight: 700;
    color: #3730a3;
  }
  .total-val {
    font-size: 20px;
    font-weight: 800;
    color: #312e81;
  }
  .signatures-section {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
    margin-top: 25px;
    padding-top: 15px;
  }
  .signature-block {
    border: 1.5px dashed #cbd5e1;
    border-radius: 10px;
    padding: 14px;
    height: 125px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background: #fafafa;
  }
  .sig-title {
    font-size: 11.5px;
    font-weight: 700;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .sig-sub {
    font-size: 10px;
    color: #94a3b8;
    font-style: italic;
  }
  .footer-note {
    margin-top: 25px;
    text-align: center;
    font-size: 10.5px;
    color: #64748b;
    border-top: 1px solid #e2e8f0;
    padding-top: 12px;
  }
  @media print {
    body { padding: 0; background: none; }
    .receipt-container {
      border: 1.5px solid #000;
      box-shadow: none;
      padding: 18px 22px;
      page-break-inside: avoid;
    }
    .no-print { display: none !important; }
    table.items-table th { background: #2d1f6e !important; color: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .status-paid { background: #dcfce7 !important; color: #15803d !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .total-box { background: #f1f5f9 !important; border: 1.5px solid #000 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
<div class="receipt-container">
  <div class="header">
    <div class="brand">
      <h1>🌈 Crèche Maxim au Petit Paradis</h1>
      <p>Reçu officiel de paiement des frais de garde</p>
    </div>
    <div class="receipt-meta">
      <div class="receipt-badge">BON DE PAIEMENT</div>
      <p><strong>N° :</strong> ${receiptNum}</p>
      <p><strong>Date d'émission :</strong> ${printedOn}</p>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-box">
      <div class="info-title">Informations Enfant</div>
      <div class="info-row"><span class="info-label">Nom & Prénom :</span><span class="info-val">${child.lastName.toUpperCase()} ${child.firstName}</span></div>
      <div class="info-row"><span class="info-label">Section :</span><span class="info-val">${child.section || "Non définie"}</span></div>
      <div class="info-row"><span class="info-label">Année scolaire :</span><span class="info-val">${schoolYear}–${schoolYear + 1}</span></div>
    </div>
    <div class="info-box">
      <div class="info-title">Détails de Règlement</div>
      <div class="info-row"><span class="info-label">Nombre de mois :</span><span class="info-val">${receiptRows.length} mois</span></div>
      <div class="info-row"><span class="info-label">Statut global :</span><span class="info-val" style="color: #15803d;">✓ Réglé intégralement</span></div>
      <div class="info-row"><span class="info-label">Devise :</span><span class="info-val">Dinars Algériens (DA)</span></div>
    </div>
  </div>

  <table class="items-table">
    <thead>
      <tr>
        <th style="width: 35%;">Mois concerné</th>
        <th style="width: 25%;">Date de règlement</th>
        <th style="width: 20%; text-align: center;">Statut</th>
        <th style="width: 20%;">Montant payé</th>
      </tr>
    </thead>
    <tbody>
      ${receiptRows.map((r) => `
        <tr>
          <td><strong>${r.monthLabel}</strong></td>
          <td>${r.paidDate}</td>
          <td style="text-align: center;"><span class="status-paid">Payé</span></td>
          <td>${r.amount > 0 ? r.amount.toLocaleString("fr-FR") + " DA" : "0 DA"}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>

  <div class="total-card">
    <div class="total-box">
      <span class="total-label">MONTANT TOTAL REÇU :</span>
      <span class="total-val">${totalAmount.toLocaleString("fr-FR")} DA</span>
    </div>
  </div>

  <div class="signatures-section">
    <div class="signature-block">
      <span class="sig-title">Cachet et Signature de l'Établissement</span>
      <span class="sig-sub">Direction de la crèche Maxim au Petit Paradis</span>
    </div>
    <div class="signature-block">
      <span class="sig-title">Signature du Parent / Tuteur</span>
      <span class="sig-sub">Pour acquit et prise de connaissance</span>
    </div>
  </div>

  <div class="footer-note">
    Ce reçu atteste du règlement des cotisations mentionnées ci-dessus. Document valable pour valoir ce que de droit.<br/>
    Crèche Maxim au Petit Paradis &bull; Émis le ${printedOn}
  </div>
</div>

<script>
  window.onload = function() {
    window.print();
    window.onafterprint = function() {
      // Optionnel : ne pas fermer automatiquement si l'utilisateur souhaite enregistrer en PDF
    };
  };
</script>
</body>
</html>`;

    const printWin = window.open("", "_blank", "width=900,height=800");
    if (printWin) {
      printWin.document.write(html);
      printWin.document.close();
    }
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

  /* ── Statistiques : filtrées sur l'année scolaire sélectionnée + mois choisi ── */
  const schoolMonthKeys = useMemo(
    () => SCHOOL_MONTHS.map(({ m }) => monthKey(schoolYear, m)),
    [schoolYear]
  );

  const statsForMonth = useMemo(() => {
    const keys = selectedMonth !== null
      ? [monthKey(schoolYear, selectedMonth)]
      : schoolMonthKeys;
    const scope = payments.filter((p) => keys.includes(p.month));
    return {
      paid:    scope.filter((p) => p.status === "paid").length,
      pending: scope.filter((p) => p.status === "pending").length,
      late:    scope.filter((p) => p.status === "late").length,
    };
  }, [payments, schoolYear, schoolMonthKeys, selectedMonth]);

  function cellColor(p: Payment | undefined) {
    if (!p || p.status === "pending") return { bg: "oklch(0.94 0.02 260)", color: "oklch(0.55 0.06 260)" };
    if (p.status === "paid")          return { bg: "oklch(0.88 0.14 142)", color: "oklch(0.32 0.12 142)" };
    return { bg: "oklch(0.92 0.14 27)", color: "oklch(0.40 0.18 27)" };
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

  const inputBase: React.CSSProperties = {
    padding: "0.5rem 0.85rem",
    borderRadius: "0.75rem",
    border: "1.5px solid oklch(0.82 0.06 265 / .7)",
    background: "oklch(0.98 0.01 265 / .5)",
    fontSize: "0.85rem",
    color: "oklch(0.28 0.08 270)",
    outline: "none",
    fontFamily: "var(--font-display)",
  };

  const hasFilters = search || filterSection || filterStatus !== "all";
  const activeTotal = useMemo(() => children.filter((c) => c.active !== false).length, [children]);

  /* ── Méta de la sélection courante pour le bon ── */
  const selectedChild = useMemo(() => {
    if (!selectedChildId) return null;
    return children.find((c) => c.id === selectedChildId) ?? null;
  }, [selectedChildId, children]);

  const selectedMonthsLabels = useMemo(() => {
    return [...selectedMonths].sort().map((mk) => {
      const [y, mStr] = mk.split("-");
      const mNum = Number(mStr);
      const mInfo = SCHOOL_MONTHS.find((sm) => sm.m === mNum);
      return mInfo ? `${mInfo.label} ${y}` : mk;
    });
  }, [selectedMonths]);

  const selectedMonthsTotal = useMemo(() => {
    if (!selectedChildId) return 0;
    return selectedMonths.reduce((acc, mk) => {
      const pay = getPayment(selectedChildId, mk);
      return acc + (pay?.amount || 0);
    }, 0);
  }, [selectedChildId, selectedMonths, payments]);

  return (
    <div>
      <PageHeader
        icon="💳"
        title="Paiements"
        count={filtered.length}
        subtitle={`Suivi mensuel — ${filtered.length} enfant${filtered.length > 1 ? "s" : ""} actif${filtered.length > 1 ? "s" : ""} sur ${activeTotal}`}
        action={undefined}
      />

      {/* Sélecteur de mois pour les stats */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem", alignItems: "center" }}>
        <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "oklch(0.45 0.08 260)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Stats du mois :</span>
        <button
          onClick={() => setSelectedMonth(null)}
          style={{
            padding: "0.3rem 0.75rem", borderRadius: "9999px", border: "none", cursor: "pointer",
            fontWeight: selectedMonth === null ? 700 : 500, fontSize: "0.78rem",
            background: selectedMonth === null ? "linear-gradient(135deg, oklch(0.60 0.22 310), oklch(0.52 0.22 260))" : "oklch(0.90 0.03 265)",
            color: selectedMonth === null ? "#fff" : "oklch(0.45 0.08 265)",
          }}
        >
          Toute l'année
        </button>
        {SCHOOL_MONTHS.map(({ label, m }) => (
          <button
            key={m}
            onClick={() => setSelectedMonth(m)}
            style={{
              padding: "0.3rem 0.65rem", borderRadius: "9999px", border: "none", cursor: "pointer",
              fontWeight: selectedMonth === m ? 700 : 500, fontSize: "0.78rem",
              background: selectedMonth === m ? "linear-gradient(135deg, oklch(0.60 0.22 310), oklch(0.52 0.22 260))" : "oklch(0.90 0.03 265)",
              color: selectedMonth === m ? "#fff" : "oklch(0.45 0.08 265)",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Statistiques */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
        {[
          { label: "Payés",       value: statsForMonth.paid,    color: "oklch(0.88 0.14 142)", text: "oklch(0.28 0.12 142)" },
          { label: "En attente",  value: statsForMonth.pending, color: "oklch(0.93 0.06 70)",  text: "oklch(0.45 0.12 70)"  },
          { label: "En retard",   value: statsForMonth.late,    color: "oklch(0.92 0.14 27)",  text: "oklch(0.40 0.18 27)"  },
        ].map((s) => (
          <div key={s.label} style={{ flex: 1, minWidth: "110px", background: s.color, borderRadius: "1rem", padding: "0.75rem 1rem", display: "flex", flexDirection: "column", gap: "0.1rem" }}>
            <span style={{ fontSize: "1.5rem", fontWeight: 800, color: s.text, lineHeight: 1 }}>{s.value}</span>
            <span style={{ fontSize: "0.78rem", fontWeight: 600, color: s.text, opacity: 0.8 }}>
              {s.label}{selectedMonth !== null ? ` — ${SCHOOL_MONTHS.find(x => x.m === selectedMonth)?.label}` : " — Toute l'année"}
            </span>
          </div>
        ))}
      </div>

      {/* ── Barre de filtres ── */}
      <div style={{
        background: "oklch(0.97 0.02 265 / .5)",
        borderRadius: "1rem",
        border: "1.5px solid oklch(0.88 0.05 265 / .5)",
        padding: "0.85rem 1rem",
        marginBottom: "1rem",
        display: "flex",
        flexWrap: "wrap",
        gap: "0.65rem",
        alignItems: "center",
      }}>
        {/* Recherche */}
        <div style={{ position: "relative", flex: "1 1 180px", minWidth: "160px" }}>
          <Search size={15} style={{ position: "absolute", left: "0.7rem", top: "50%", transform: "translateY(-50%)", color: "oklch(0.55 0.07 260)", pointerEvents: "none" }} />
          <input
            type="text"
            placeholder="Rechercher un enfant…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...inputBase, width: "100%", paddingLeft: "2.2rem", boxSizing: "border-box" }}
          />
        </div>

        {/* Filtre section */}
        <select
          value={filterSection}
          onChange={(e) => setFilterSection(e.target.value)}
          style={{ ...inputBase, flex: "0 1 160px", minWidth: "130px", cursor: "pointer" }}
        >
          <option value="">Toutes les sections</option>
          {sections.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* Filtre statut */}
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {STATUS_FILTERS.map((sf) => (
            <button
              key={sf.id}
              onClick={() => setFilterStatus(sf.id)}
              style={{
                padding: "0.42rem 0.85rem",
                borderRadius: "9999px",
                border: filterStatus === sf.id ? "2px solid oklch(0.55 0.18 270)" : "1.5px solid transparent",
                background: filterStatus === sf.id ? sf.color : "oklch(0.93 0.02 265)",
                color: filterStatus === sf.id ? sf.text : "oklch(0.50 0.07 265)",
                fontWeight: filterStatus === sf.id ? 700 : 500,
                fontSize: "0.8rem",
                cursor: "pointer",
                transition: "all 0.15s",
                fontFamily: "var(--font-display)",
              }}
            >
              {sf.label}
            </button>
          ))}
        </div>

        {/* Effacer filtres */}
        {hasFilters && (
          <button
            onClick={() => { setSearch(""); setFilterSection(""); setFilterStatus("all"); }}
            style={{
              display: "flex", alignItems: "center", gap: "0.25rem",
              padding: "0.42rem 0.75rem", borderRadius: "9999px",
              border: "1.5px solid oklch(0.577 0.245 27 / .3)",
              background: "oklch(0.577 0.245 27 / .07)",
              color: "oklch(0.50 0.22 27)", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer",
            }}
          >
            <X size={13} /> Effacer
          </button>
        )}
      </div>

      {/* ── Bandeau flottant d'action d'impression si des mois sont sélectionnés ── */}
      {selectedChild && selectedMonths.length > 0 && (
        <div style={{
          position: "sticky",
          top: "1rem",
          zIndex: 30,
          background: "linear-gradient(135deg, oklch(0.35 0.18 275), oklch(0.28 0.16 295))",
          color: "#ffffff",
          borderRadius: "1rem",
          padding: "0.85rem 1.25rem",
          marginBottom: "1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.75rem",
          boxShadow: "0 10px 30px -5px oklch(0.30 0.18 280 / .4)",
          border: "1px solid oklch(0.55 0.20 280 / .4)",
          animation: "fadeIn .2s ease-in-out",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "1.3rem" }}>🧾</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.95rem", letterSpacing: "0.01em" }}>
                Bon de paiement — <span style={{ color: "oklch(0.88 0.15 95)" }}>{selectedChild.lastName} {selectedChild.firstName}</span>
              </div>
              <div style={{ fontSize: "0.78rem", opacity: 0.88 }}>
                {selectedMonths.length} mois sélectionné{selectedMonths.length > 1 ? "s" : ""} : <strong>{selectedMonthsLabels.join(", ")}</strong>
                {selectedMonthsTotal > 0 && (
                  <span style={{ marginLeft: "0.6rem", padding: "0.1rem 0.5rem", borderRadius: "9999px", background: "oklch(1 0 0 / .18)", fontWeight: 700 }}>
                    Total : {selectedMonthsTotal.toLocaleString("fr-FR")} DA
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <button
              onClick={printPaymentReceipt}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.45rem",
                padding: "0.55rem 1.15rem",
                borderRadius: "9999px",
                border: "none",
                background: "linear-gradient(135deg, oklch(0.72 0.22 142), oklch(0.62 0.20 142))",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "0.88rem",
                cursor: "pointer",
                boxShadow: "0 4px 14px oklch(0.62 0.20 142 / .4)",
                transition: "transform .12s, box-shadow .12s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <Printer size={16} /> Imprimer le bon ({selectedMonths.length})
            </button>
            <button
              onClick={clearMonthSelection}
              style={{
                padding: "0.55rem 0.9rem",
                borderRadius: "9999px",
                border: "1px solid oklch(1 0 0 / .25)",
                background: "oklch(1 0 0 / .12)",
                color: "#ffffff",
                fontWeight: 600,
                fontSize: "0.82rem",
                cursor: "pointer",
              }}
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Sélecteur d'année scolaire */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
        <button onClick={() => setSchoolYear((y) => y - 1)} style={{ background: "oklch(0.90 0.04 265)", border: "none", borderRadius: "0.5rem", padding: "0.35rem 0.7rem", cursor: "pointer", fontWeight: 700, fontSize: "1rem" }}>←</button>
        <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "oklch(0.35 0.10 270)" }}>
          Année scolaire {schoolYear}–{schoolYear + 1}
        </span>
        <button onClick={() => setSchoolYear((y) => y + 1)} style={{ background: "oklch(0.90 0.04 265)", border: "none", borderRadius: "0.5rem", padding: "0.35rem 0.7rem", cursor: "pointer", fontWeight: 700, fontSize: "1rem" }}>→</button>
      </div>

      {children.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "oklch(0.55 0.07 260)", fontSize: "0.95rem" }}>
          👶 Aucun enfant enregistré. Ajoutez des enfants dans la section <strong>Enfants</strong>.
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "2.5rem", color: "oklch(0.55 0.07 260)", fontSize: "0.92rem", background: "oklch(0.97 0.02 265 / .4)", borderRadius: "1rem" }}>
          🔍 Aucun enfant ne correspond aux filtres. <button onClick={() => { setSearch(""); setFilterSection(""); setFilterStatus("all"); }} style={{ background: "none", border: "none", color: "oklch(0.52 0.18 260)", cursor: "pointer", fontWeight: 700, textDecoration: "underline" }}>Effacer les filtres</button>
        </div>
      ) : (
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
              {filtered.map((child, rowIdx) => (
                <tr key={child.id} style={{ background: rowIdx % 2 === 0 ? "white" : "oklch(0.97 0.02 260)" }}>
                  <td style={{
                    ...cellBase, cursor: "default", textAlign: "left", padding: "0.5rem 0.8rem",
                    fontWeight: 600, fontSize: "0.84rem", color: "oklch(0.28 0.08 270)",
                    position: "sticky", left: 0, background: rowIdx % 2 === 0 ? "white" : "oklch(0.97 0.02 260)",
                    borderRight: "2px solid oklch(0.85 0.06 265)",
                  }}>
                    <div>{child.lastName} {child.firstName}</div>
                    {child.section && (
                      <div style={{ fontSize: "0.68rem", color: "oklch(0.55 0.08 265)", fontWeight: 500, marginTop: "0.05rem" }}>
                        {child.section}
                      </div>
                    )}
                  </td>
                  {SCHOOL_MONTHS.map(({ m }) => {
                    const mk = monthKey(schoolYear, m);
                    const pay = getPayment(child.id, mk);
                    const isPaid = pay?.status === "paid";
                    const isSelected = selectedChildId === child.id && selectedMonths.includes(mk);
                    const { bg, color } = cellColor(pay);
                    const isActive = activeCell?.childId === child.id && activeCell?.mk === mk;
                    return (
                      <td
                        key={m}
                        onClick={() => openCell(child.id, mk)}
                        style={{
                          ...cellBase,
                          background: isSelected
                            ? "oklch(0.72 0.22 142)"
                            : isActive
                            ? "oklch(0.75 0.20 290)"
                            : bg,
                          color: isSelected || isActive ? "#fff" : color,
                          fontWeight: isPaid ? 700 : 400,
                          outline: isSelected
                            ? "2px solid oklch(0.40 0.18 142)"
                            : isActive
                            ? "2px solid oklch(0.55 0.22 290)"
                            : undefined,
                          position: "relative",
                        }}
                        title={
                          isPaid
                            ? `Payé${pay.amount ? ` (${pay.amount} DA)` : ""}${pay.paidAt ? ` le ${pay.paidAt}` : ""} — Cliquer sur la case à cocher pour ajouter au bon`
                            : "Cliquer pour enregistrer"
                        }
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.2rem" }}>
                          {/* Case de sélection : visible uniquement si le statut est payé */}
                          {isPaid && (
                            <button
                              type="button"
                              onClick={(e) => toggleMonthSelection(child.id, mk, e)}
                              title={isSelected ? "Désélectionner ce mois du bon" : "Sélectionner ce mois pour le bon de paiement"}
                              style={{
                                background: "none",
                                border: "none",
                                padding: 0,
                                margin: 0,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: isSelected ? "#ffffff" : "oklch(0.35 0.14 142)",
                                opacity: isSelected ? 1 : 0.75,
                                transition: "transform .1s, opacity .1s",
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.2)"; e.currentTarget.style.opacity = "1"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.opacity = isSelected ? "1" : "0.75"; }}
                            >
                              {isSelected ? <CheckSquare size={13} strokeWidth={2.5} /> : <Square size={13} strokeWidth={2} />}
                            </button>
                          )}
                          <span>{isPaid ? "✓" : pay?.status === "late" ? "!" : "·"}</span>
                        </div>
                        {pay?.paidAt && (
                          <div style={{ fontSize: "0.62rem", opacity: isSelected ? 0.95 : 0.85, lineHeight: 1.1 }}>
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
          <div onClick={() => setActiveCell(null)} style={{ position: "fixed", inset: 0, zIndex: 40, background: "oklch(0 0 0 / .25)" }} />
          <div ref={popRef} style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 50, background: "white", borderRadius: "1.25rem", boxShadow: "0 16px 60px oklch(0 0 0 / .22)", padding: "1.5rem", minWidth: "280px", maxWidth: "340px", width: "90vw" }}>
            <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "oklch(0.35 0.10 270)", marginBottom: "1rem" }}>
              💳 Enregistrer le paiement
              <div style={{ fontSize: "0.78rem", fontWeight: 500, color: "oklch(0.55 0.07 260)", marginTop: "0.2rem" }}>
                {(() => { const c = children.find((x) => x.id === activeCell.childId); return c ? `${c.lastName} ${c.firstName}` : ""; })()} · {activeCell.mk}
              </div>
            </div>

            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "oklch(0.45 0.08 265)", marginBottom: "0.3rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Date de paiement</label>
            <input type="date" value={dateInput} onChange={(e) => setDateInput(e.target.value)} style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "0.75rem", border: "1.5px solid oklch(0.80 0.07 260)", fontSize: "0.92rem", marginBottom: "0.75rem", boxSizing: "border-box", outline: "none" }} />

            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "oklch(0.45 0.08 265)", marginBottom: "0.3rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Montant (DA)</label>
            <input type="number" min="0" value={amountInput} onChange={(e) => setAmountInput(e.target.value)} placeholder="ex : 8000" style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "0.75rem", border: "1.5px solid oklch(0.80 0.07 260)", fontSize: "0.92rem", marginBottom: "1rem", boxSizing: "border-box", outline: "none" }} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <button onClick={() => savePayment("paid")}    style={{ padding: "0.6rem", borderRadius: "0.75rem", border: "none", cursor: "pointer", background: "oklch(0.72 0.22 142)", color: "#fff", fontWeight: 700, fontSize: "0.88rem" }}>✓ Payé</button>
              <button onClick={() => savePayment("late")}    style={{ padding: "0.6rem", borderRadius: "0.75rem", border: "none", cursor: "pointer", background: "oklch(0.80 0.20 27)",  color: "#fff", fontWeight: 700, fontSize: "0.88rem" }}>! En retard</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              <button onClick={() => savePayment("pending")} style={{ padding: "0.6rem", borderRadius: "0.75rem", border: "1.5px solid oklch(0.80 0.07 260)", background: "white", color: "oklch(0.45 0.08 265)", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}>· En attente</button>
              <button onClick={() => setActiveCell(null)}    style={{ padding: "0.6rem", borderRadius: "0.75rem", border: "1.5px solid oklch(0.80 0.07 260)", background: "white", color: "oklch(0.55 0.07 260)", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}>Annuler</button>
            </div>
          </div>
        </>
      )}

      {/* Légende */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "1rem", fontSize: "0.78rem", color: "oklch(0.50 0.07 260)" }}>
        <span><span style={{ background: "oklch(0.88 0.14 142)", borderRadius: "50%", display: "inline-block", width: 10, height: 10, marginRight: 4 }} />Payé</span>
        <span><span style={{ background: "oklch(0.92 0.14 27)",  borderRadius: "50%", display: "inline-block", width: 10, height: 10, marginRight: 4 }} />En retard</span>
        <span><span style={{ background: "oklch(0.94 0.02 260)", borderRadius: "50%", display: "inline-block", width: 10, height: 10, marginRight: 4 }} />En attente</span>
      </div>
    </div>
  );
}
