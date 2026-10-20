import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Upload, CheckCircle, AlertCircle, Loader2, Image } from "lucide-react";
import {
  uploadToCloudinary,
  cloudinaryUrl,
  saveLogoUrl,
  getSavedLogoUrl,
} from "@/lib/cloudinary";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Maxim au Petit Paradis" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type UploadState = "idle" | "uploading" | "success" | "error";

function AdminPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [state, setState] = useState<UploadState>("idle");
  const [resultUrl, setResultUrl] = useState<string | null>(getSavedLogoUrl());
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    setState("idle");
    setError(null);
  }

  async function handleUpload() {
    const file = inputRef.current?.files?.[0];
    if (!file) return;

    setState("uploading");
    setProgress(0);
    setError(null);

    // Fake smooth progress while uploading
    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + Math.random() * 12, 88));
    }, 300);

    try {
      const result = await uploadToCloudinary(file);
      clearInterval(interval);
      setProgress(100);

      const optimisedUrl = cloudinaryUrl(result.public_id, { width: 600 });
      setResultUrl(optimisedUrl);
      saveLogoUrl(optimisedUrl);
      setState("success");
    } catch (err) {
      clearInterval(interval);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      setState("error");
    }
  }

  return (
    <div className="sky-bg relative min-h-screen flex items-center justify-center p-6">
      <div
        style={{
          background: "oklch(1 0 0 / .7)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          border: "2px solid oklch(1 0 0 / .8)",
          borderRadius: "2rem",
          boxShadow: "0 8px 40px -8px oklch(0 0 0 / .2)",
          padding: "2.5rem 2rem",
          width: "100%",
          maxWidth: "440px",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.8rem",
            fontWeight: 700,
            textAlign: "center",
            marginBottom: "0.25rem",
            background: "linear-gradient(135deg, oklch(0.60 0.22 310), oklch(0.52 0.22 260))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Admin — Logo
        </h1>
        <p
          style={{
            textAlign: "center",
            fontSize: "0.9rem",
            color: "oklch(0.45 0.05 260)",
            marginBottom: "2rem",
          }}
        >
          Uploadez un nouveau logo sur Cloudinary
        </p>

        {/* Drop zone */}
        <div
          onClick={() => inputRef.current?.click()}
          style={{
            border: "2.5px dashed oklch(0.65 0.17 245 / .5)",
            borderRadius: "1.25rem",
            padding: "2rem 1rem",
            cursor: "pointer",
            textAlign: "center",
            transition: "border-color .2s, background .2s",
            background: preview
              ? "oklch(0.97 0.01 245 / .4)"
              : "oklch(0.96 0.02 245 / .2)",
            marginBottom: "1.25rem",
          }}
        >
          {preview ? (
            <img
              src={preview}
              alt="Aperçu"
              style={{ maxHeight: 180, maxWidth: "100%", borderRadius: "0.75rem", margin: "0 auto" }}
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", color: "oklch(0.55 0.1 260)" }}>
              <Image size={40} />
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>
                Cliquer pour choisir une image
              </span>
              <span style={{ fontSize: "0.8rem" }}>JPG, PNG, WEBP — max 10 Mo</span>
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </div>

        {/* Progress bar */}
        {state === "uploading" && (
          <div style={{ marginBottom: "1rem" }}>
            <div style={{ height: 8, borderRadius: 9999, background: "oklch(0.9 0.05 245)", overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  borderRadius: 9999,
                  width: `${progress}%`,
                  background: "linear-gradient(90deg, oklch(0.65 0.17 245), oklch(0.60 0.22 310))",
                  transition: "width .3s ease",
                }}
              />
            </div>
            <p style={{ textAlign: "center", fontSize: "0.8rem", marginTop: "0.4rem", color: "oklch(0.5 0.1 260)" }}>
              Upload en cours… {Math.round(progress)}%
            </p>
          </div>
        )}

        {/* Success message */}
        {state === "success" && resultUrl && (
          <div style={{
            display: "flex", alignItems: "center", gap: "0.5rem",
            background: "oklch(0.95 0.08 142 / .3)", border: "1.5px solid oklch(0.67 0.21 142 / .5)",
            borderRadius: "0.75rem", padding: "0.6rem 1rem", marginBottom: "1rem",
            color: "oklch(0.42 0.18 142)", fontSize: "0.85rem", wordBreak: "break-all",
          }}>
            <CheckCircle size={18} style={{ shrink: 0, flexShrink: 0 }} />
            <span>Logo uploadé ! <a href={resultUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline" }}>Voir sur Cloudinary</a></span>
          </div>
        )}

        {/* Error message */}
        {state === "error" && error && (
          <div style={{
            display: "flex", alignItems: "center", gap: "0.5rem",
            background: "oklch(0.97 0.05 27 / .3)", border: "1.5px solid oklch(0.577 0.245 27 / .5)",
            borderRadius: "0.75rem", padding: "0.6rem 1rem", marginBottom: "1rem",
            color: "oklch(0.45 0.2 27)", fontSize: "0.85rem",
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Upload button */}
        <button
          onClick={handleUpload}
          disabled={!preview || state === "uploading"}
          className="kid-btn bg-kid-violet"
          style={{ opacity: (!preview || state === "uploading") ? 0.55 : 1 }}
        >
          <span className="relative z-10 flex items-center gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/25">
              {state === "uploading" ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
            </span>
            <span className="flex-1 text-left">
              {state === "uploading" ? "Upload en cours…" : "Uploader sur Cloudinary"}
            </span>
          </span>
        </button>

        {/* Current logo from Cloudinary */}
        {resultUrl && (
          <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
            <p style={{ fontSize: "0.8rem", color: "oklch(0.5 0.05 260)", marginBottom: "0.5rem" }}>
              Logo actuel (Cloudinary)
            </p>
            <img
              src={resultUrl}
              alt="Logo actuel"
              style={{ maxHeight: 120, maxWidth: "100%", borderRadius: "1rem", margin: "0 auto", border: "2px solid oklch(0.9 0.05 260)" }}
            />
          </div>
        )}

        <p style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <a href="/" style={{ fontSize: "0.85rem", color: "oklch(0.55 0.12 260)", textDecoration: "underline" }}>
            ← Retour à l'accueil
          </a>
        </p>
      </div>
    </div>
  );
}
