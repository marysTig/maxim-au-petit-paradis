import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { getSavedLogoUrl } from "@/lib/cloudinary";
import logo from "@/assets/logo-maxim.jpeg.asset.json";
import {
  dbToActivity,
  dbToAnnouncement,
  dbToMenu,
  type Activity,
  type Announcement,
  type MenuDay,
} from "../lib/admin-extra";
import { weekStartOf } from "../lib/admin-helpers";

export const Route = createFileRoute("/espace-parent")({
  head: () => ({
    meta: [{ title: "Espace Parent — Maxim au Petit Paradis" }],
  }),
  component: EspaceParent,
});

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];

function EspaceParent() {
  const logoUrl = getSavedLogoUrl() ?? logo.url;
  const weekStart = weekStartOf(new Date());
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [menus, setMenus] = useState<MenuDay[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Each table is read on its own: one missing table never hides the others.
      const [n, m, a] = await Promise.all([
        supabase.from("announcements").select("*").eq("published", true).order("date", { ascending: false }).limit(10),
        supabase.from("menus").select("*").eq("week_start", weekStart),
        supabase.from("activities").select("*"),
      ]);
      if (cancelled) return;
      if (!n.error) setAnnouncements((n.data ?? []).map((r) => dbToAnnouncement(r as Record<string, unknown>)));
      if (!m.error) setMenus((m.data ?? []).map((r) => dbToMenu(r as Record<string, unknown>)));
      if (!a.error) setActivities((a.data ?? []).map((r) => dbToActivity(r as Record<string, unknown>)));
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [weekStart]);

  const menuByDay = (day: number) => menus.find((m) => m.day === day);
  const activitiesByDay = (day: number) =>
    activities.filter((a) => a.day === day).sort((x, y) => x.startTime.localeCompare(y.startTime));
  const hasMenu = menus.some((m) => m.breakfast || m.lunch || m.snack);
  const today = (new Date().getDay() + 6) % 7; // Monday = 0

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

        <section className="section-card">
          <h2 className="section-title">🍽️ Menu de la semaine</h2>
          {!hasMenu ? (
            <p className="text-sm">Le menu de cette semaine n'est pas encore publié.</p>
          ) : (
            <div className="grid gap-2">
              {DAYS.map((name, day) => {
                const m = menuByDay(day);
                if (!m || (!m.breakfast && !m.lunch && !m.snack)) return null;
                return (
                  <div
                    key={day}
                    className="rounded-2xl bg-white/70 p-3 text-left"
                    style={day === today ? { outline: "2px solid currentColor" } : undefined}
                  >
                    <div className="font-display font-bold">{name}</div>
                    {m.breakfast && <div className="text-sm">🥣 {m.breakfast}</div>}
                    {m.lunch && <div className="text-sm">🍽️ {m.lunch}</div>}
                    {m.snack && <div className="text-sm">🍎 {m.snack}</div>}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="section-card">
          <h2 className="section-title">🎨 Activités de la semaine</h2>
          {activities.length === 0 ? (
            <p className="text-sm">Aucune activité planifiée pour le moment.</p>
          ) : (
            <div className="grid gap-2">
              {DAYS.map((name, day) => {
                const list = activitiesByDay(day);
                if (list.length === 0) return null;
                return (
                  <div key={day} className="rounded-2xl bg-white/70 p-3 text-left">
                    <div className="font-display font-bold">{name}</div>
                    {list.map((a) => (
                      <div key={a.id} className="text-sm">
                        {a.startTime && `${a.startTime}${a.endTime ? `–${a.endTime}` : ""} · `}
                        {a.title}
                        {a.section !== "Toutes" && ` (${a.section})`}
                      </div>
                    ))}
                  </div>
                );
              })}
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
