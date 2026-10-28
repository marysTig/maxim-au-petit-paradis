import type { CSSProperties, ReactNode } from "react";
import { localDateStr } from "../../lib/admin-helpers";

export function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function todayStr() {
  return localDateStr();
}

export function nowStr() {
  return new Date().toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ─────────────────────────────────────────────
   STYLES SHARED
───────────────────────────────────────────── */
export const card: CSSProperties = {
  background: "oklch(1 0 0 / .72)",
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  border: "2px solid oklch(1 0 0 / .85)",
  borderRadius: "1.5rem",
  boxShadow: "0 6px 32px -8px oklch(0 0 0 / .12)",
  padding: "1.5rem",
};

export const inputStyle: CSSProperties = {
  width: "100%",
  padding: "0.6rem 0.9rem",
  borderRadius: "0.75rem",
  border: "1.5px solid oklch(0.80 0.07 260 / .5)",
  background: "oklch(0.98 0.01 260 / .7)",
  fontSize: "0.9rem",
  color: "oklch(0.25 0.05 260)",
  outline: "none",
  boxSizing: "border-box" as const,
  fontFamily: "var(--font-sans)",
};

export const labelStyle: CSSProperties = {
  display: "block",
  fontSize: "0.75rem",
  fontWeight: 600,
  color: "oklch(0.45 0.08 260)",
  marginBottom: "0.3rem",
  letterSpacing: "0.04em",
  textTransform: "uppercase" as const,
};

export const badge = (color: string): CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  gap: "0.3rem",
  padding: "0.2rem 0.65rem",
  borderRadius: "9999px",
  fontSize: "0.75rem",
  fontWeight: 700,
  background: color,
  color: "#fff",
  fontFamily: "var(--font-display)",
  letterSpacing: "0.03em",
});

export const primaryBtn: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.4rem",
  padding: "0.55rem 1.25rem",
  borderRadius: "9999px",
  border: "none",
  background: "linear-gradient(135deg, oklch(0.60 0.22 310), oklch(0.52 0.22 260))",
  color: "#fff",
  fontWeight: 700,
  fontSize: "0.88rem",
  cursor: "pointer",
  fontFamily: "var(--font-display)",
};

export const dangerBtn: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "0.35rem 0.8rem",
  borderRadius: "9999px",
  border: "none",
  background: "oklch(0.577 0.245 27 / .12)",
  color: "oklch(0.50 0.20 27)",
  fontWeight: 600,
  fontSize: "0.8rem",
  cursor: "pointer",
};

export const softBtn: CSSProperties = {
  ...dangerBtn,
  background: "oklch(0.52 0.22 260 / .12)",
  color: "oklch(0.45 0.18 260)",
};

export const pillBtn = (active: boolean): CSSProperties => ({
  padding: "0.4rem 1.1rem",
  borderRadius: "9999px",
  border: "1.5px solid oklch(0.80 0.07 260 / .5)",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: "0.85rem",
  fontFamily: "var(--font-display)",
  background: active
    ? "linear-gradient(135deg, oklch(0.60 0.22 310), oklch(0.52 0.22 260))"
    : "oklch(1 0 0 / .6)",
  color: active ? "#fff" : "oklch(0.45 0.10 270)",
});

/* ─────────────────────────────────────────────
   SHARED UI COMPONENTS
───────────────────────────────────────────── */
export function PageHeader({
  icon,
  title,
  count,
  subtitle,
  action,
}: {
  icon: string;
  title: string;
  count?: number;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
      <div>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.5rem",
            fontWeight: 700,
            margin: 0,
            background: "linear-gradient(135deg, oklch(0.60 0.22 310), oklch(0.52 0.22 260))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          {icon} {title}
          {count !== undefined && (
            <span style={{ fontSize: "1rem", background: "oklch(0.52 0.22 280 / .15)", WebkitTextFillColor: "oklch(0.52 0.22 280)", padding: "0.1rem 0.55rem", borderRadius: "9999px" }}>
              {count}
            </span>
          )}
        </h1>
        {subtitle && <p style={{ margin: "0.15rem 0 0", fontSize: "0.85rem", color: "oklch(0.50 0.08 265)" }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.95rem", color: "oklch(0.40 0.10 270)", marginBottom: "0.25rem" }}>
      {children}
    </div>
  );
}

export function Field({
  label,
  children,
  span,
}: {
  label: string;
  children: ReactNode;
  span?: boolean;
}) {
  return (
    <div style={span ? { gridColumn: "1 / -1" } : {}}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

export function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{ ...card, textAlign: "center", padding: "3rem 1.5rem" }}>
      <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>{icon}</div>
      <p style={{ color: "oklch(0.55 0.07 260)", fontSize: "0.92rem" }}>{text}</p>
    </div>
  );
}

export function ErrorBanner({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div
      role="alert"
      style={{
        ...card,
        padding: "0.75rem 1rem",
        marginBottom: "1rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "0.75rem",
        background: "oklch(0.95 0.04 27 / .85)",
        borderColor: "oklch(0.80 0.12 27 / .6)",
        color: "oklch(0.45 0.18 27)",
        fontSize: "0.88rem",
        fontWeight: 600,
      }}
    >
      <span>⚠️ {message}</span>
      <button
        onClick={onClose}
        aria-label="Fermer"
        style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "1rem", color: "inherit" }}
      >
        ✕
      </button>
    </div>
  );
}
