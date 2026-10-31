import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { card, inputStyle, PageHeader, primaryBtn, pillBtn } from "./ui";
import { Eye, EyeOff, Save, RefreshCw } from "lucide-react";

const KEY_ENABLED  = "parent_space_password_enabled";
const KEY_PASSWORD = "parent_space_password";

async function getSetting(key: string): Promise<string | null> {
  const { data } = await supabase.from("settings").select("value").eq("key", key).maybeSingle();
  return (data as { value: string } | null)?.value ?? null;
}

async function setSetting(key: string, value: string) {
  await supabase.from("settings").upsert({ key, value }, { onConflict: "key" });
}

export function SettingsSection() {
  const [enabled, setEnabled] = useState(false);
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [en, pw] = await Promise.all([getSetting(KEY_ENABLED), getSetting(KEY_PASSWORD)]);
      setEnabled(en === "true");
      setPassword(pw ?? "");
      setLoading(false);
    })();
  }, []);

  async function handleSave() {
    setSaving(true);
    await Promise.all([
      setSetting(KEY_ENABLED, enabled ? "true" : "false"),
      setSetting(KEY_PASSWORD, password.trim()),
    ]);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div>
      <PageHeader
        icon="⚙️"
        title="Paramètres"
        subtitle="Configuration générale de l'application"
        action={undefined}
      />

      {/* Bloc Espace Parent */}
      <div style={{ ...card, maxWidth: 520 }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: "oklch(0.35 0.10 270)", marginBottom: "1rem" }}>
          🔒 Protection de l'Espace Parent
        </div>

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "oklch(0.55 0.07 260)", fontSize: "0.9rem" }}>
            <RefreshCw size={15} style={{ animation: "spin 1s linear infinite" }} /> Chargement…
          </div>
        ) : (
          <>
            {/* Toggle activer/désactiver */}
            <label style={{ display: "flex", alignItems: "center", gap: "0.9rem", cursor: "pointer", marginBottom: "1.25rem" }}>
              <div
                onClick={() => setEnabled((v) => !v)}
                style={{
                  position: "relative", width: 46, height: 26, borderRadius: 9999,
                  background: enabled ? "oklch(0.60 0.22 142)" : "oklch(0.80 0.04 260)",
                  transition: "background 0.2s", cursor: "pointer", flexShrink: 0,
                }}
              >
                <div style={{
                  position: "absolute", top: 3, left: enabled ? 23 : 3,
                  width: 20, height: 20, borderRadius: "50%", background: "#fff",
                  boxShadow: "0 1px 4px oklch(0 0 0 / .25)",
                  transition: "left 0.2s",
                }} />
              </div>
              <span style={{ fontSize: "0.92rem", fontWeight: 600, color: "oklch(0.35 0.08 265)" }}>
                {enabled ? "Mot de passe activé" : "Accès libre (sans mot de passe)"}
              </span>
            </label>

            {/* Champ mot de passe */}
            {enabled && (
              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "oklch(0.45 0.08 265)", marginBottom: "0.35rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Mot de passe parents
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Entrez un mot de passe…"
                    style={{ ...inputStyle, paddingRight: "2.8rem" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "oklch(0.55 0.08 265)", display: "flex" }}
                  >
                    {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                <p style={{ fontSize: "0.75rem", color: "oklch(0.55 0.07 260)", marginTop: "0.35rem" }}>
                  Les parents devront saisir ce mot de passe pour accéder à l'Espace Parent.
                </p>
              </div>
            )}

            {/* Bouton sauvegarder */}
            <button
              onClick={handleSave}
              disabled={saving || (enabled && !password.trim())}
              style={{
                ...primaryBtn,
                opacity: saving || (enabled && !password.trim()) ? 0.6 : 1,
                justifyContent: "center",
              }}
            >
              {saving ? (
                <><RefreshCw size={15} style={{ animation: "spin 1s linear infinite" }} /> Enregistrement…</>
              ) : saved ? (
                <>✓ Paramètres sauvegardés</>
              ) : (
                <><Save size={15} /> Sauvegarder</>
              )}
            </button>
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
