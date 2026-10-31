import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { getSavedLogoUrl } from "@/lib/cloudinary";
import logo from "@/assets/logo-maxim.jpeg.asset.json";
import { dbToAnnouncement, type Announcement } from "../lib/admin-extra";
import { Lock } from "lucide-react";

export const Route = createFileRoute("/espace-parent")({
  head: () => ({
    meta: [{ title: "Espace Parent — Maxim au Petit Paradis" }],
  }),
  component: EspaceParent,
});

const SESSION_KEY = "parent_space_unlocked";

async function fetchSettings(): Promise<{ enabled: boolean; password: string }> {
  const { data } = await supabase
    .from("settings")
    .select("key,value")
    .in("key", ["parent_space_password_enabled", "parent_space_password"]);
  const rows = (data ?? []) as { key: string; value: string }[];
  const enabled = rows.find((r) => r.key === "parent_space_password_enabled")?.value === "true";
  const password = rows.find((r) => r.key === "parent_space_password")?.value ?? "";
  return { enabled, password };
}

function EspaceParent() {
  const logoUrl = getSavedLogoUrl() ?? logo.url;
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Password gate state
  const [pwdEnabled, setPwdEnabled] = useState(false);
  const [correctPwd, setCorrectPwd] = useState("");
  const [unlocked, setUnlocked] = useState(() =>
    typeof sessionStorage !== "undefined" && sessionStorage.getItem(SESSION_KEY) === "true"
  );
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Load settings first
  useEffect(() => {
    fetchSettings().then(({ enabled, password }) => {
      setPwdEnabled(enabled);
      setCorrectPwd(password);
      setSettingsLoaded(true);
    });
  }, []);

  // Load announcements once unlocked (or if no password needed)
  useEffect(() => {
    if (!settingsLoaded) return;
    if (pwdEnabled && !unlocked) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("published", true)
        .order("date", { ascending: false })
        .limit(10);
      if (cancelled) return;
      if (!error) setAnnouncements((data ?? []).map((r) => dbToAnnouncement(r as Record<string, unknown>)));
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [settingsLoaded, pwdEnabled, unlocked]);

  function handleUnlock() {
    if (input === correctPwd) {
      sessionStorage.setItem(SESSION_KEY, "true");
      setUnlocked(true);
      setError(false);
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  }

  // ── Loading initial ──
  if (!settingsLoaded) {
    return (
      <div className="sky-bg relative min-h-screen overflow-hidden flex items-center justify-center">
        <p style={{ color: "oklch(0.50 0.08 265)", fontSize: "0.95rem" }}>Chargement…</p>
      </div>
    );
  }

  // ── Password gate ──
  if (pwdEnabled && !unlocked) {
    return (
      <div
        className="sky-bg relative min-h-screen overflow-hidden"
        style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}
      >
        <div
          style={{
            width: "100%", maxWidth: 380,
            background: "oklch(1 0 0 / .75)", backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)", border: "2px solid oklch(1 0 0 / .85)",
            borderRadius: "2rem",
            boxShadow: "0 12px 60px -10px oklch(0.55 0.18 300 / .25)",
            padding: "2rem 1.75rem",
            animation: shake ? "shake 0.45s ease" : undefined,
          }}
        >
          {/* Icon */}
          <div style={{
            width: 60, height: 60, borderRadius: "50%",
            background: "linear-gradient(135deg, oklch(0.60 0.22 310), oklch(0.55 0.22 260))",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 1.25rem",
            boxShadow: "0 4px 20px oklch(0.55 0.22 290 / .4)",
          }}>
            <Lock size={26} color="white" />
          </div>

          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 700, textAlign: "center", marginBottom: "0.3rem", background: "linear-gradient(135deg, oklch(0.60 0.22 310), oklch(0.52 0.22 260))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Espace Parent
          </h1>
          <p style={{ textAlign: "center", fontSize: "0.85rem", color: "oklch(0.50 0.06 260)", marginBottom: "1.75rem" }}>
            Accès réservé aux familles de la crèche
          </p>

          <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "oklch(0.45 0.08 260)", marginBottom: "0.35rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Mot de passe
          </label>
          <input
            type="password"
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(false); }}
            onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
            placeholder="••••••"
            autoFocus
            style={{
              width: "100%", padding: "0.72rem 1rem", borderRadius: "0.85rem",
              border: `1.5px solid ${error ? "oklch(0.577 0.245 27 / .6)" : "oklch(0.80 0.07 260 / .6)"}`,
              background: "oklch(0.98 0.01 260 / .6)", fontSize: "0.95rem",
              color: "oklch(0.25 0.05 260)", outline: "none", boxSizing: "border-box",
              marginBottom: "0.5rem",
            }}
          />
          {error && (
            <div style={{ fontSize: "0.82rem", color: "oklch(0.50 0.22 27)", marginBottom: "0.75rem" }}>
              ⚠️ Mot de passe incorrect.
            </div>
          )}

          <button
            onClick={handleUnlock}
            style={{
              width: "100%", padding: "0.72rem", borderRadius: "0.85rem", border: "none",
              background: "linear-gradient(135deg, oklch(0.60 0.22 310), oklch(0.52 0.22 260))",
              color: "#fff", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer",
              boxShadow: "0 4px 16px oklch(0.55 0.20 290 / .35)",
            }}
          >
            Accéder →
          </button>

          <p style={{ textAlign: "center", marginTop: "1.25rem", fontSize: "0.78rem", color: "oklch(0.60 0.05 260)" }}>
            <a href="/" style={{ color: "oklch(0.55 0.12 260)", textDecoration: "underline" }}>
              ← Retour à l'accueil
            </a>
          </p>
        </div>

        <style>{`
          @keyframes shake {
            0%,100% { transform: translateX(0); }
            18%      { transform: translateX(-8px); }
            36%      { transform: translateX(8px); }
            54%      { transform: translateX(-6px); }
            72%      { transform: translateX(6px); }
            90%      { transform: translateX(-3px); }
          }
        `}</style>
      </div>
    );
  }

  // ── Content ──
  return (
    <div className="sky-bg relative min-h-screen overflow-hidden">
      <main className="relative z-10 mx-auto flex max-w-md flex-col gap-6 px-5 pb-20 pt-10">
        <img
          src={logoUrl}
          alt="Logo Maxim au Petit Paradis"
          className="mx-auto w-full max-w-[12rem] rounded-[2rem] border-4 border-card shadow-xl"
        />
        <h1 className="font-display text-center text-2xl font-bold text-foreground">Espace Parent</h1>

        <section className="section-card">
          <h2 className="section-title">📢 Annonces</h2>
          {!loaded ? (
            <p className="text-sm">Chargement…</p>
          ) : announcements.length === 0 ? (
            <p className="text-sm">Aucune annonce pour le moment.</p>
          ) : (
            <div className="grid gap-3">
              {announcements.map((a) => (
                <article key={a.id} className="rounded-2xl bg-white/70 p-3 text-left">
                  <div className="font-display font-bold">{a.title}</div>
                  <div className="mb-1 text-xs opacity-70">
                    {new Date(a.date + "T12:00:00").toLocaleDateString("fr-FR", {
                      day: "numeric", month: "long", year: "numeric",
                    })}
                  </div>
                  {a.body && <p className="whitespace-pre-wrap text-sm">{a.body}</p>}
                </article>
              ))}
            </div>
          )}
        </section>

        <a href="/" className="kid-btn bg-kid-blue">
          <span className="relative z-10 flex items-center justify-center">← Retour à l'accueil</span>
        </a>
      </main>
    </div>
  );
}
