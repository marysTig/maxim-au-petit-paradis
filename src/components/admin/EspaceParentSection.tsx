import { useState, useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";
import { Plus, X, Search, Phone, ExternalLink, Copy, Check, Printer } from "lucide-react";
import type { Announcement } from "../../lib/admin-extra";
import { localDateStr } from "../../lib/admin-helpers";
import { card, EmptyState, Field, inputStyle, labelStyle, PageHeader, pillBtn, primaryBtn, softBtn, uid } from "./ui";

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
export interface ChildContact {
  id: string;
  firstName: string;
  lastName: string;
  section?: string;
  group?: string;
  fatherName?: string;
  fatherPhone?: string;
  motherName?: string;
  motherPhone?: string;
  parentIds?: string[];
  active?: boolean;
}

export interface ParentContact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  childIds: string[];
}

/* ─────────────────────────────────────────────
   HELPERS WHATSAPP & TÉLÉPHONE
───────────────────────────────────────────── */
/** Convertit un numéro de téléphone en identifiant international pour WhatsApp */
export function toWhatsAppIntl(phone: string): string {
  if (!phone) return "";
  let digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }
  // Format algérien local : commence par 0 (ex. 05, 06, 07) -> indicatif 213
  if (digits.startsWith("0")) {
    digits = "213" + digits.slice(1);
  } else if (!digits.startsWith("213") && digits.length === 9) {
    digits = "213" + digits;
  }
  return digits;
}

const WhatsAppIcon = ({ size = 15 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ flexShrink: 0 }}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.848L0 24l6.334-1.51A11.934 11.934 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.794 9.794 0 01-4.98-1.364l-.358-.212-3.758.896.952-3.656-.234-.374A9.793 9.793 0 012.182 12c0-5.422 4.396-9.818 9.818-9.818 5.422 0 9.818 4.396 9.818 9.818 0 5.422-4.396 9.818-9.818 9.818z"/>
  </svg>
);

/* ─────────────────────────────────────────────
   COMPOSANT PRINCIPAL
───────────────────────────────────────────── */
export function EspaceParentSection({
  announcements,
  setAnnouncements,
  onAnnouncementUpsert,
  onAnnouncementDelete,
  children = [],
  parents = [],
  crecheSections = [],
}: {
  announcements: Announcement[];
  setAnnouncements: Dispatch<SetStateAction<Announcement[]>>;
  onAnnouncementUpsert: (a: Announcement) => void;
  onAnnouncementDelete: (id: string) => void;
  children?: ChildContact[];
  parents?: ParentContact[];
  crecheSections?: { id: string; name: string }[];
}) {
  // Onglets : "parents" (Contacts WhatsApp) ou "annonces" (Annonces publiques)
  const [activeTab, setActiveTab] = useState<"parents" | "annonces">("parents");

  // Filtre et recherche pour la liste des parents
  const [search, setSearch] = useState("");
  const [selectedSection, setSelectedSection] = useState("all");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("active");
  const [copiedAll, setCopiedAll] = useState(false);

  // Annonces
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", body: "" });
  const [copiedLink, setCopiedLink] = useState(false);

  const publicUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/espace-parent`;
  const sortedAnnouncements = useMemo(() => {
    return [...announcements].sort((a, b) => b.date.localeCompare(a.date));
  }, [announcements]);

  // Sections : priorité aux sections définies dans "Section & Groupe", complétées par celles présentes chez les enfants
  const availableSections = useMemo(() => {
    const list: string[] = [];
    (crecheSections || []).forEach((s) => {
      const name = s.name.trim();
      if (name && !list.includes(name)) list.push(name);
    });
    children.forEach((c) => {
      const name = c.section?.trim() || "";
      if (name && !list.includes(name)) list.push(name);
    });
    return list;
  }, [crecheSections, children]);

  // Normalisation des contacts parents pour chaque enfant
  const resolvedContacts = useMemo(() => {
    return children.map((c) => {
      // Trouver les parents liés via childIds ou parentIds
      const linked = parents.filter(
        (p) => p.childIds?.includes(c.id) || (c.parentIds && c.parentIds.includes(p.id))
      );

      // Nom et téléphone du père
      const fatherName = c.fatherName?.trim() || "";
      const fatherPhone = c.fatherPhone?.trim() || "";
      const fatherWa = toWhatsAppIntl(fatherPhone);

      // Nom et téléphone de la mère
      const motherName = c.motherName?.trim() || "";
      const motherPhone = c.motherPhone?.trim() || "";
      const motherWa = toWhatsAppIntl(motherPhone);

      // Si le nom du père/mère n'est pas renseigné mais qu'un parent lié existe
      const fallbackParent = linked.length > 0 ? linked[0] : null;

      return {
        childId: c.id,
        childLastName: c.lastName?.trim() || "",
        childFirstName: c.firstName?.trim() || "",
        active: c.active !== false,
        section: c.section || "Non défini",
        group: c.group || "",
        fatherName,
        fatherPhone,
        fatherWa,
        motherName,
        motherPhone,
        motherWa,
        fallbackParent,
      };
    }).sort((a, b) => {
      const cmp = a.childLastName.localeCompare(b.childLastName, "fr");
      if (cmp !== 0) return cmp;
      return a.childFirstName.localeCompare(b.childFirstName, "fr");
    });
  }, [children, parents]);

  // Filtrage recherche, statut actif & section
  const filteredContacts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return resolvedContacts.filter((item) => {
      if (filterActive === "active" && !item.active) return false;
      if (filterActive === "inactive" && item.active) return false;
      if (selectedSection !== "all" && item.section !== selectedSection) {
        return false;
      }
      if (!q) return true;
      const matchChild = `${item.childLastName} ${item.childFirstName}`.toLowerCase().includes(q);
      const matchFather = item.fatherName.toLowerCase().includes(q) || item.fatherPhone.includes(q);
      const matchMother = item.motherName.toLowerCase().includes(q) || item.motherPhone.includes(q);
      const matchSection = item.section.toLowerCase().includes(q);
      return matchChild || matchFather || matchMother || matchSection;
    });
  }, [resolvedContacts, search, selectedSection, filterActive]);

  // Statistiques contacts
  const stats = useMemo(() => {
    let fathersWithPhone = 0;
    let mothersWithPhone = 0;
    resolvedContacts.forEach((c) => {
      if (c.fatherPhone) fathersWithPhone++;
      if (c.motherPhone) mothersWithPhone++;
    });
    return {
      totalChildren: resolvedContacts.length,
      fathersWithPhone,
      mothersWithPhone,
    };
  }, [resolvedContacts]);

  // Copier tous les numéros WhatsApp valides
  function copyAllWhatsApp() {
    const phones: string[] = [];
    filteredContacts.forEach((c) => {
      if (c.fatherWa) phones.push(c.fatherWa);
      if (c.motherWa) phones.push(c.motherWa);
    });
    const unique = Array.from(new Set(phones));
    if (unique.length === 0) return;
    navigator.clipboard.writeText(unique.join("\n"));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2200);
  }

  // Fonctions Annonces
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

  async function copyPublicLink() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      window.prompt("Copiez ce lien :", publicUrl);
    }
  }

  return (
    <div>
      <PageHeader
        icon="👨‍👩‍👧"
        title="Espace Parent"
        subtitle="Contacts WhatsApp des familles & annonces publiques"
        action={
          activeTab === "parents" ? (
            <div style={{ display: "flex", gap: "0.5rem" }} className="no-print">
              <button onClick={() => window.print()} style={softBtn}>
                <Printer size={15} /> Imprimer la liste
              </button>
            </div>
          ) : (
            <button onClick={() => setShowForm((v) => !v)} style={primaryBtn} className="no-print">
              <Plus size={16} /> Nouvelle annonce
            </button>
          )
        }
      />

      {/* ── BARRE D'ONGLETS ── */}
      <div className="no-print" style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <button
          onClick={() => setActiveTab("parents")}
          style={{
            ...pillBtn(activeTab === "parents"),
            display: "inline-flex",
            alignItems: "center",
            gap: "0.45rem",
          }}
        >
          <span>👨‍👩‍👧</span>
          <span>Contacts & WhatsApp des parents ({resolvedContacts.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("annonces")}
          style={{
            ...pillBtn(activeTab === "annonces"),
            display: "inline-flex",
            alignItems: "center",
            gap: "0.45rem",
          }}
        >
          <span>📢</span>
          <span>Annonces publiques ({announcements.length})</span>
        </button>
      </div>

      {/* ══════════════════════════════════════════════
          ONGLET 1 : RÉPERTOIRE DES PARENTS & WHATSAPP
      ══════════════════════════════════════════════ */}
      {activeTab === "parents" && (
        <div>
          {/* Cartes résumé */}
          <div className="no-print" style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "0.75rem",
            marginBottom: "1rem",
          }}>
            <div style={{ ...card, padding: "0.9rem 1.1rem" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "oklch(0.50 0.08 265)", textTransform: "uppercase" }}>👶 Enfants enregistrés</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "1.45rem", fontWeight: 800, color: "oklch(0.35 0.16 260)", marginTop: "0.2rem" }}>
                {stats.totalChildren}
              </div>
            </div>

            <div style={{ ...card, padding: "0.9rem 1.1rem" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "oklch(0.50 0.08 265)", textTransform: "uppercase" }}>👨 Pères avec WhatsApp</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "1.45rem", fontWeight: 800, color: "oklch(0.40 0.18 142)", marginTop: "0.2rem" }}>
                {stats.fathersWithPhone} / {stats.totalChildren}
              </div>
            </div>

            <div style={{ ...card, padding: "0.9rem 1.1rem" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "oklch(0.50 0.08 265)", textTransform: "uppercase" }}>👩 Mères avec WhatsApp</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "1.45rem", fontWeight: 800, color: "oklch(0.45 0.18 310)", marginTop: "0.2rem" }}>
                {stats.mothersWithPhone} / {stats.totalChildren}
              </div>
            </div>
          </div>

          {/* Filtres & Recherche */}
          <div className="no-print" style={{
            ...card,
            padding: "1rem 1.25rem",
            marginBottom: "1rem",
            display: "flex",
            gap: "0.75rem",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", gap: "0.6rem", flex: 1, minWidth: "260px", flexWrap: "wrap" }}>
              <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
                <Search size={16} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "oklch(0.60 0.07 260)" }} />
                <input
                  type="text"
                  style={{ ...inputStyle, paddingLeft: "2.2rem" }}
                  placeholder="Rechercher par enfant, père, mère, numéro..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {availableSections.length > 0 && (
                <select
                  style={{ ...inputStyle, width: "auto", minWidth: "150px" }}
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                >
                  <option value="all">Toutes les sections</option>
                  {availableSections.map((sec) => (
                    <option key={sec} value={sec}>{sec}</option>
                  ))}
                </select>
              )}

              <div style={{ display: "flex", gap: "0.3rem", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={() => setFilterActive("active")}
                  style={pillBtn(filterActive === "active")}
                  title="Afficher uniquement les enfants actifs"
                >
                  Actifs
                </button>
                <button
                  type="button"
                  onClick={() => setFilterActive("all")}
                  style={pillBtn(filterActive === "all")}
                  title="Afficher tous les enfants (y compris inactifs)"
                >
                  Tous
                </button>
              </div>
            </div>

            <button
              onClick={copyAllWhatsApp}
              style={{
                ...softBtn,
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.55rem 1rem",
                fontSize: "0.82rem",
                background: copiedAll ? "oklch(0.65 0.20 142 / .15)" : undefined,
                color: copiedAll ? "oklch(0.35 0.18 142)" : undefined,
              }}
              title="Copier les numéros WhatsApp des résultats filtrés"
            >
              {copiedAll ? <Check size={15} /> : <Copy size={15} />}
              <span>{copiedAll ? "Numéros copiés !" : "Copier les numéros WhatsApp"}</span>
            </button>
          </div>

          {/* Tableau / Liste des contacts */}
          {filteredContacts.length === 0 ? (
            <EmptyState
              icon="👨‍👩‍👧"
              text={
                resolvedContacts.length === 0
                  ? "Aucun enfant enregistré dans la base de données."
                  : "Aucun résultat ne correspond à votre recherche."
              }
            />
          ) : (
            <div style={{ ...card, padding: 0, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.86rem" }}>
                  <thead>
                    <tr style={{
                      background: "oklch(0.96 0.02 260 / .85)",
                      borderBottom: "1.5px solid oklch(0.85 0.05 260 / .5)",
                      color: "oklch(0.40 0.08 260)",
                      fontFamily: "var(--font-display)",
                      fontSize: "0.76rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}>
                      <th style={{ padding: "0.85rem 1.1rem" }}>Enfant</th>
                      <th style={{ padding: "0.85rem 1.1rem" }}>Père</th>
                      <th style={{ padding: "0.85rem 1.1rem" }}>WhatsApp / Tél. Père</th>
                      <th style={{ padding: "0.85rem 1.1rem" }}>Mère</th>
                      <th style={{ padding: "0.85rem 1.1rem" }}>WhatsApp / Tél. Mère</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContacts.map((c, idx) => (
                      <tr
                        key={c.childId}
                        style={{
                          borderBottom: idx < filteredContacts.length - 1 ? "1px solid oklch(0.90 0.03 260 / .5)" : "none",
                          background: idx % 2 === 0 ? "oklch(1 0 0 / .4)" : "oklch(0.985 0.01 260 / .35)",
                          transition: "background .15s ease",
                        }}
                      >
                        {/* 1. NOM PRÉNOM ENFANT */}
                        <td style={{ padding: "0.85rem 1.1rem", verticalAlign: "middle" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                            <span style={{ fontSize: "1.1rem" }}>👶</span>
                            <div>
                              <div style={{
                                fontFamily: "var(--font-display)",
                                fontWeight: 700,
                                color: "oklch(0.25 0.08 270)",
                                fontSize: "0.92rem",
                              }}>
                                <span style={{ textTransform: "uppercase" }}>{c.childLastName}</span> {c.childFirstName}
                              </div>
                              <div style={{ display: "flex", gap: "0.35rem", alignItems: "center", marginTop: "0.15rem" }}>
                                <span style={{
                                  fontSize: "0.7rem",
                                  fontWeight: 600,
                                  padding: "0.1rem 0.5rem",
                                  borderRadius: "9999px",
                                  background: "oklch(0.55 0.22 260 / .12)",
                                  color: "oklch(0.40 0.18 260)",
                                }}>
                                  {c.section}
                                </span>
                                {c.group && (
                                  <span style={{ fontSize: "0.7rem", color: "oklch(0.55 0.07 260)" }}>
                                    • {c.group}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. NOM PRÉNOM DU PÈRE */}
                        <td style={{ padding: "0.85rem 1.1rem", verticalAlign: "middle" }}>
                          {c.fatherName ? (
                            <div style={{ fontWeight: 600, color: "oklch(0.30 0.07 270)" }}>
                              👨 {c.fatherName}
                            </div>
                          ) : (
                            <span style={{ color: "oklch(0.60 0.05 260)", fontStyle: "italic", fontSize: "0.8rem" }}>
                              Non renseigné
                            </span>
                          )}
                        </td>

                        {/* 3. WHATSAPP DU PÈRE S'IL EXISTE */}
                        <td style={{ padding: "0.85rem 1.1rem", verticalAlign: "middle" }}>
                          {c.fatherPhone ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", flexWrap: "wrap" }}>
                              <a
                                href={`https://wa.me/${c.fatherWa}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.35rem",
                                  padding: "0.28rem 0.65rem",
                                  borderRadius: "9999px",
                                  background: "#25D366",
                                  color: "#ffffff",
                                  fontSize: "0.75rem",
                                  fontWeight: 700,
                                  textDecoration: "none",
                                  boxShadow: "0 2px 6px -1px rgba(37,211,102,0.35)",
                                  transition: "transform .15s ease",
                                }}
                                title={`Ouvrir WhatsApp avec le père (${c.fatherPhone})`}
                              >
                                <WhatsAppIcon size={14} />
                                <span>WhatsApp</span>
                              </a>
                              <a
                                href={`tel:${c.fatherPhone.replace(/\s+/g, "")}`}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.25rem",
                                  fontSize: "0.8rem",
                                  fontWeight: 600,
                                  color: "oklch(0.35 0.10 260)",
                                  textDecoration: "none",
                                  padding: "0.25rem 0.5rem",
                                  borderRadius: "0.4rem",
                                  background: "oklch(0.92 0.03 260 / .6)",
                                }}
                                title="Appeler directement"
                              >
                                <Phone size={12} />
                                <span>{c.fatherPhone}</span>
                              </a>
                            </div>
                          ) : (
                            <span style={{ color: "oklch(0.65 0.04 260)", fontSize: "0.82rem" }}>
                              —
                            </span>
                          )}
                        </td>

                        {/* 4. NOM PRÉNOM DE LA MÈRE */}
                        <td style={{ padding: "0.85rem 1.1rem", verticalAlign: "middle" }}>
                          {c.motherName ? (
                            <div style={{ fontWeight: 600, color: "oklch(0.30 0.07 270)" }}>
                              👩 {c.motherName}
                            </div>
                          ) : (
                            <span style={{ color: "oklch(0.60 0.05 260)", fontStyle: "italic", fontSize: "0.8rem" }}>
                              Non renseigné
                            </span>
                          )}
                        </td>

                        {/* 5. WHATSAPP DE LA MÈRE S'IL EXISTE */}
                        <td style={{ padding: "0.85rem 1.1rem", verticalAlign: "middle" }}>
                          {c.motherPhone ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", flexWrap: "wrap" }}>
                              <a
                                href={`https://wa.me/${c.motherWa}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.35rem",
                                  padding: "0.28rem 0.65rem",
                                  borderRadius: "9999px",
                                  background: "#25D366",
                                  color: "#ffffff",
                                  fontSize: "0.75rem",
                                  fontWeight: 700,
                                  textDecoration: "none",
                                  boxShadow: "0 2px 6px -1px rgba(37,211,102,0.35)",
                                  transition: "transform .15s ease",
                                }}
                                title={`Ouvrir WhatsApp avec la mère (${c.motherPhone})`}
                              >
                                <WhatsAppIcon size={14} />
                                <span>WhatsApp</span>
                              </a>
                              <a
                                href={`tel:${c.motherPhone.replace(/\s+/g, "")}`}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.25rem",
                                  fontSize: "0.8rem",
                                  fontWeight: 600,
                                  color: "oklch(0.35 0.10 260)",
                                  textDecoration: "none",
                                  padding: "0.25rem 0.5rem",
                                  borderRadius: "0.4rem",
                                  background: "oklch(0.92 0.03 260 / .6)",
                                }}
                                title="Appeler directement"
                              >
                                <Phone size={12} />
                                <span>{c.motherPhone}</span>
                              </a>
                            </div>
                          ) : (
                            <span style={{ color: "oklch(0.65 0.04 260)", fontSize: "0.82rem" }}>
                              —
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════
          ONGLET 2 : GESTION DES ANNONCES PUBLIQUES
      ══════════════════════════════════════════════ */}
      {activeTab === "annonces" && (
        <div>
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
              <button onClick={copyPublicLink} style={pillBtn(copiedLink)}>
                {copiedLink ? "✓ Copié" : "Copier le lien"}
              </button>
              <a href="/espace-parent" target="_blank" rel="noopener noreferrer" style={{ ...pillBtn(false), textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                <span>Ouvrir</span>
                <ExternalLink size={14} />
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
          {sortedAnnouncements.length === 0 ? (
            <EmptyState icon="📢" text="Aucune annonce. Cliquez sur « Nouvelle annonce » pour en ajouter une." />
          ) : (
            <div style={{ display: "grid", gap: "0.75rem" }}>
              {sortedAnnouncements.map((a) => (
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
      )}

      <style>{`@media print { .no-print { display: none !important; } }`}</style>
    </div>
  );
}
