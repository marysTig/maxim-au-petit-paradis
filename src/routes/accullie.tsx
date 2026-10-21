import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Lock, User, Eye, EyeOff, LogIn } from "lucide-react";

export const Route = createFileRoute("/accullie")({
  head: () => ({
    meta: [
      { title: "Connexion Admin — Maxim au Petit Paradis" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

// Hardcoded credentials
const ADMIN_USER = "sonia";
const ADMIN_PASSWORD = "sonia@";

export const AUTH_KEY = "maxim_admin_auth";

function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (sessionStorage.getItem(AUTH_KEY) === "true") {
      navigate({ to: "/admin" });
    }
  }, [navigate]);

  function triggerShake() {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Simulate a short loading delay for UX
    await new Promise((r) => setTimeout(r, 600));

    if (username.trim() === ADMIN_USER && password === ADMIN_PASSWORD) {
      sessionStorage.setItem(AUTH_KEY, "true");
      navigate({ to: "/admin" });
    } else {
      setError("Identifiant ou mot de passe incorrect.");
      setLoading(false);
      triggerShake();
    }
  }

  return (
    <div
      className="sky-bg"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative blobs */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "-120px",
          left: "-120px",
          width: "420px",
          height: "420px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, oklch(0.75 0.18 310 / .35), transparent 70%)",
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: "-100px",
          right: "-80px",
          width: "380px",
          height: "380px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, oklch(0.70 0.18 245 / .3), transparent 70%)",
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
      />

      {/* Card */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "420px",
          background: "oklch(1 0 0 / .72)",
          backdropFilter: "blur(22px)",
          WebkitBackdropFilter: "blur(22px)",
          border: "2px solid oklch(1 0 0 / .85)",
          borderRadius: "2rem",
          boxShadow:
            "0 12px 60px -10px oklch(0.55 0.18 300 / .25), 0 2px 8px oklch(0 0 0 / .08)",
          padding: "2.5rem 2rem",
          animation: shake ? "shake 0.45s ease" : undefined,
        }}
      >
        {/* Logo / icon */}
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background:
              "linear-gradient(135deg, oklch(0.60 0.22 310), oklch(0.55 0.22 260))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1.25rem",
            boxShadow: "0 4px 20px oklch(0.55 0.22 290 / .4)",
          }}
        >
          <Lock size={28} color="white" />
        </div>

        {/* Title */}
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.85rem",
            fontWeight: 700,
            textAlign: "center",
            marginBottom: "0.3rem",
            background:
              "linear-gradient(135deg, oklch(0.60 0.22 310), oklch(0.52 0.22 260))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Espace Admin
        </h1>
        <p
          style={{
            textAlign: "center",
            fontSize: "0.88rem",
            color: "oklch(0.50 0.06 260)",
            marginBottom: "2rem",
          }}
        >
          Connectez-vous pour accéder au tableau de bord
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Username */}
          <div style={{ marginBottom: "1rem" }}>
            <label
              htmlFor="login-username"
              style={{
                display: "block",
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "oklch(0.45 0.08 260)",
                marginBottom: "0.4rem",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              Identifiant
            </label>
            <div style={{ position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: "0.9rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "oklch(0.60 0.10 265)",
                  pointerEvents: "none",
                  display: "flex",
                }}
              >
                <User size={17} />
              </span>
              <input
                id="login-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError(null);
                }}
                placeholder="ex : sonia"
                required
                style={{
                  width: "100%",
                  padding: "0.72rem 1rem 0.72rem 2.5rem",
                  borderRadius: "0.85rem",
                  border: `1.5px solid ${error ? "oklch(0.577 0.245 27 / .6)" : "oklch(0.80 0.07 260 / .6)"}`,
                  background: "oklch(0.98 0.01 260 / .6)",
                  fontSize: "0.95rem",
                  color: "oklch(0.25 0.05 260)",
                  outline: "none",
                  transition: "border-color .2s, box-shadow .2s",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "oklch(0.60 0.22 285)";
                  e.target.style.boxShadow =
                    "0 0 0 3px oklch(0.60 0.22 285 / .18)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = error
                    ? "oklch(0.577 0.245 27 / .6)"
                    : "oklch(0.80 0.07 260 / .6)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label
              htmlFor="login-password"
              style={{
                display: "block",
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "oklch(0.45 0.08 260)",
                marginBottom: "0.4rem",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              Mot de passe
            </label>
            <div style={{ position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: "0.9rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "oklch(0.60 0.10 265)",
                  pointerEvents: "none",
                  display: "flex",
                }}
              >
                <Lock size={17} />
              </span>
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                placeholder="••••••"
                required
                style={{
                  width: "100%",
                  padding: "0.72rem 2.7rem 0.72rem 2.5rem",
                  borderRadius: "0.85rem",
                  border: `1.5px solid ${error ? "oklch(0.577 0.245 27 / .6)" : "oklch(0.80 0.07 260 / .6)"}`,
                  background: "oklch(0.98 0.01 260 / .6)",
                  fontSize: "0.95rem",
                  color: "oklch(0.25 0.05 260)",
                  outline: "none",
                  transition: "border-color .2s, box-shadow .2s",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "oklch(0.60 0.22 285)";
                  e.target.style.boxShadow =
                    "0 0 0 3px oklch(0.60 0.22 285 / .18)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = error
                    ? "oklch(0.577 0.245 27 / .6)"
                    : "oklch(0.80 0.07 260 / .6)";
                  e.target.style.boxShadow = "none";
                }}
              />
              <button
                type="button"
                id="toggle-password-visibility"
                aria-label={
                  showPassword
                    ? "Masquer le mot de passe"
                    : "Afficher le mot de passe"
                }
                onClick={() => setShowPassword((v) => !v)}
                style={{
                  position: "absolute",
                  right: "0.8rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "oklch(0.60 0.10 265)",
                  display: "flex",
                  padding: "0.2rem",
                }}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div
              role="alert"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "oklch(0.97 0.05 27 / .3)",
                border: "1.5px solid oklch(0.577 0.245 27 / .4)",
                borderRadius: "0.75rem",
                padding: "0.55rem 0.9rem",
                marginBottom: "1rem",
                color: "oklch(0.45 0.2 27)",
                fontSize: "0.85rem",
              }}
            >
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            id="login-submit"
            disabled={loading}
            className="kid-btn bg-kid-violet"
            style={{ opacity: loading ? 0.7 : 1 }}
          >
            <span className="relative z-10 flex items-center gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/25">
                {loading ? (
                  <svg
                    style={{ animation: "spin 1s linear infinite" }}
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                ) : (
                  <LogIn size={18} />
                )}
              </span>
              <span className="flex-1 text-left">
                {loading ? "Connexion…" : "Se connecter"}
              </span>
            </span>
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            marginTop: "1.5rem",
            fontSize: "0.8rem",
            color: "oklch(0.60 0.05 260)",
          }}
        >
          <a
            href="/"
            style={{ color: "oklch(0.55 0.12 260)", textDecoration: "underline" }}
          >
            ← Retour à l'accueil
          </a>
        </p>
      </div>

      {/* Keyframe animations via inline style tag */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          18%       { transform: translateX(-8px); }
          36%       { transform: translateX(8px); }
          54%       { transform: translateX(-6px); }
          72%       { transform: translateX(6px); }
          90%       { transform: translateX(-3px); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
