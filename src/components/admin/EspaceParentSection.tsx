import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { Plus, X } from "lucide-react";
import type { Announcement } from "../../lib/admin-extra";
import { localDateStr } from "../../lib/admin-helpers";
import { card, EmptyState, Field, inputStyle, PageHeader, pillBtn, primaryBtn, uid } from "./ui";

export function EspaceParentSection({
  announcements,
  setAnnouncements,
  onAnnouncementUpsert,
  onAnnouncementDelete,
}: {
  announcements: Announcement[];
  setAnnouncements: Dispatch<SetStateAction<Announcement[]>>;
  onAnnouncementUpsert: (a: Announcement) => void;
  onAnnouncementDelete: (id: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", body: "" });
  const [copied, setCopied] = useState(false);

  const publicUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/espace-parent`;
  const sorted = [...announcements].sort((a, b) => b.date.localeCompare(a.date));

  function addAnnouncement() {
    if (!form.title.trim()) return;
    const a: Announcement = { id: uid(), title: form.title.trim(), body: form.body.trim(), date: localDateStr(), published: true };
    setAnnouncements((prev) => [...prev, a]);
    onAnnouncementUpsert(a);
    setForm({ title: "", body: "" });
    setShowForm(false);
  }

  function togglePublish(a: Announcement) {
    const updated: Announcement = { ...a, published: !a.published };
    setAnnouncements((prev) => prev.map((x) => (x.id === a.id ? updated : x)));
    onAnnouncementUpsert(updated);
  }

  function removeAnnouncement(id: string) {
    if (!confirm("Supprimer cette annonce ?")) return;
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    onAnnouncementDelete(id);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copiez ce lien :", publicUrl);
    }
  }

  return (
    <div>
      <PageHeader
        icon="🏠"
        title="Espace Parent"
        count={announcements.length}
        subtitle="Annonces visibles par les familles, sans connexion"
        action={
          <button onClick={() => setShowForm((v) => !v)} style={primaryBtn}>
            <Plus size={16} /> Nouvelle annonce
          </button>
        }
      />

      {/* Lien public */}
      <div style={{ ...card, marginBottom: "1.25rem" }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.95rem", color: "oklch(0.40 0.10 270)", marginBottom: "0.4rem" }}>
          🔗 Page publique pour les parents
        </div>
        <p style={{ margin: "0 0 0.75rem", fontSize: "0.85rem", color: "oklch(0.50 0.08 265)" }}>
          Les parents consultent vos annonces directement, sans mot de passe.
        </p>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
          <code style={{ ...inputStyle, flex: 1, minWidth: "200px", width: "auto", display: "block", overflowX: "auto" }}>{publicUrl}</code>
          <button onClick={copyLink} style={pillBtn(copied)}>
            {copied ? "✓ Copié" : "Copier le lien"}
          </button>
          <a href="/espace-parent" target="_blank" rel="noopener noreferrer" style={{ ...pillBtn(false), textDecoration: "none" }}>
            Ouvrir ↗
          </a>
        </div>
      </div>

      {/* Formulaire nouvelle annonce */}
      {showForm && (
        <div style={{ ...card, marginBottom: "1.25rem" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.05rem", color: "oklch(0.35 0.1 270)", marginBottom: "1rem" }}>
            📢 Nouvelle annonce
          </div>
          <div style={{ display: "grid", gap: "0.75rem" }}>
            <Field label="Titre *">
              <input
                style={inputStyle}
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Sortie au parc jeudi"
              />
            </Field>
            <Field label="Message">
              <textarea
                style={{ ...inputStyle, minHeight: "90px", resize: "vertical" }}
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                placeholder="Merci d'apporter une casquette et une bouteille d'eau."
              />
            </Field>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
            <button
              onClick={addAnnouncement}
              disabled={!form.title.trim()}
              style={{ ...primaryBtn, flex: 1, justifyContent: "center", opacity: form.title.trim() ? 1 : 0.5 }}
            >
              Publier
            </button>
            <button onClick={() => setShowForm(false)} style={{ ...pillBtn(false), padding: "0.6rem 1.2rem" }}>
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Liste des annonces */}
      {sorted.length === 0 ? (
        <EmptyState icon="📢" text="Aucune annonce. Cliquez sur « Nouvelle annonce » pour en ajouter une." />
      ) : (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {sorted.map((a) => (
            <div key={a.id} style={{ ...card, display: "flex", justifyContent: "space-between", gap: "0.75rem", opacity: a.published ? 1 : 0.6 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem" }}>
                  <span style={{
                    fontSize: "0.7rem", fontWeight: 700, padding: "0.15rem 0.55rem", borderRadius: "9999px",
                    background: a.published ? "oklch(0.72 0.22 142)" : "oklch(0.65 0.08 260)",
                    color: "#fff",
                  }}>
                    {a.published ? "✓ Publiée" : "Brouillon"}
                  </span>
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "oklch(0.28 0.08 270)" }}>{a.title}</span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "oklch(0.55 0.07 260)", marginBottom: "0.3rem" }}>
                  {new Date(a.date + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                </div>
                {a.body && <div style={{ fontSize: "0.88rem", color: "oklch(0.40 0.06 265)", whiteSpace: "pre-wrap" }}>{a.body}</div>}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", alignItems: "flex-end" }}>
                <button
                  onClick={() => removeAnnouncement(a.id)}
                  title="Supprimer"
                  style={{ background: "none", border: "none", cursor: "pointer", color: "oklch(0.60 0.15 27)", padding: "0.1rem" }}
                >
                  <X size={16} />
                </button>
                <button
                  onClick={() => togglePublish(a)}
                  title={a.published ? "Masquer aux parents" : "Publier pour les parents"}
                  style={{
                    fontSize: "0.72rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "9999px", border: "none",
                    cursor: "pointer",
                    background: a.published ? "oklch(0.65 0.08 260 / 0.12)" : "oklch(0.72 0.22 142)",
                    color: a.published ? "oklch(0.45 0.08 260)" : "#fff",
                  }}
                >
                  {a.published ? "Masquer" : "Publier"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
