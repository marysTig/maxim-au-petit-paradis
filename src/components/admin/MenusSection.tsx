import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { MenuDay } from "../../lib/admin-extra";
import { addDays, weekStartOf } from "../../lib/admin-helpers";
import { card, inputStyle, labelStyle, PageHeader, softBtn } from "./ui";

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];

const MEALS: { key: "breakfast" | "lunch" | "snack"; label: string; icon: string }[] = [
  { key: "breakfast", label: "Petit-déjeuner", icon: "🥣" },
  { key: "lunch", label: "Déjeuner", icon: "🍽️" },
  { key: "snack", label: "Goûter", icon: "🍎" },
];

function parseLocal(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y as number, (m as number) - 1, d as number);
}

function rangeLabel(weekStart: string) {
  const fmt = (s: string) =>
    parseLocal(s).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  const end = addDays(weekStart, 4);
  return `${fmt(weekStart)} – ${fmt(end)} ${parseLocal(end).getFullYear()}`;
}

export function MenusSection({
  menus,
  setMenus,
  onMenuUpsert,
}: {
  menus: MenuDay[];
  setMenus: Dispatch<SetStateAction<MenuDay[]>>;
  onMenuUpsert: (m: MenuDay) => void;
}) {
  const [weekStart, setWeekStart] = useState(() => weekStartOf(new Date()));
  const currentWeek = weekStartOf(new Date());

  function getMenu(day: number): MenuDay {
    return (
      menus.find((m) => m.weekStart === weekStart && m.day === day) ?? {
        weekStart,
        day,
        breakfast: "",
        lunch: "",
        snack: "",
      }
    );
  }

  function saveField(day: number, key: "breakfast" | "lunch" | "snack", value: string) {
    const current = getMenu(day);
    if (current[key] === value) return;
    const updated: MenuDay = { ...current, [key]: value };
    setMenus((prev) => {
      const exists = prev.some((m) => m.weekStart === weekStart && m.day === day);
      return exists
        ? prev.map((m) => (m.weekStart === weekStart && m.day === day ? updated : m))
        : [...prev, updated];
    });
    onMenuUpsert(updated);
  }

  return (
    <div>
      <PageHeader icon="🍽️" title="Menus de la semaine" subtitle={rangeLabel(weekStart)} />

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <button style={softBtn} onClick={() => setWeekStart(addDays(weekStart, -7))}>
          ← Semaine précédente
        </button>
        <button
          style={{ ...softBtn, opacity: weekStart === currentWeek ? 0.5 : 1 }}
          onClick={() => setWeekStart(currentWeek)}
        >
          Aujourd'hui
        </button>
        <button style={softBtn} onClick={() => setWeekStart(addDays(weekStart, 7))}>
          Semaine suivante →
        </button>
      </div>

      <div style={{ display: "grid", gap: "0.9rem" }}>
        {DAYS.map((dayName, day) => {
          const menu = getMenu(day);
          const dateLabel = parseLocal(addDays(weekStart, day)).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
          });
          return (
            <div key={`${weekStart}-${day}`} style={card}>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: "1rem",
                  color: "oklch(0.40 0.10 270)",
                  marginBottom: "0.75rem",
                }}
              >
                {dayName} <span style={{ fontWeight: 500, fontSize: "0.85rem", color: "oklch(0.55 0.07 260)" }}>· {dateLabel}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                {MEALS.map((meal) => (
                  <div key={meal.key}>
                    <label style={labelStyle}>
                      {meal.icon} {meal.label}
                    </label>
                    <input
                      style={inputStyle}
                      defaultValue={menu[meal.key]}
                      placeholder="—"
                      onBlur={(e) => saveField(day, meal.key, e.target.value.trim())}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
