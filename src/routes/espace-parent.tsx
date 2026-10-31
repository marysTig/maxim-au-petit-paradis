import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { getSavedLogoUrl } from "@/lib/cloudinary";
import logo from "@/assets/logo-maxim.jpeg.asset.json";
import { dbToAnnouncement, type Announcement } from "../lib/admin-extra";

export const Route = createFileRoute("/espace-parent")({
  head: () => ({
    meta: [{ title: "Espace Parent — Maxim au Petit Paradis" }],
  }),
  component: EspaceParent,
});

function EspaceParent() {
  const logoUrl = getSavedLogoUrl() ?? logo.url;
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
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
  }, []);

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
                      day: "numeric",
                      month: "long",
                      year: "numeric",
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
