import { describe, expect, it } from "vitest";

import {
  activityToDb,
  announcementToDb,
  dbToActivity,
  dbToAnnouncement,
  dbToMenu,
  menuToDb,
  type Activity,
  type Announcement,
  type MenuDay,
} from "@/lib/admin-extra";

describe("menu mappers", () => {
  const menu: MenuDay = { weekStart: "2026-10-26", day: 0, breakfast: "Lait", lunch: "Riz", snack: "" };

  it("builds the id from week start and day", () => {
    expect(menuToDb(menu).id).toBe("2026-10-26_0");
  });

  it("round-trips a menu day", () => {
    expect(dbToMenu(menuToDb(menu))).toEqual(menu);
  });
});

describe("activity mappers", () => {
  it("round-trips an activity with null notes", () => {
    const a: Activity = { id: "a1", day: 2, startTime: "09:00", endTime: "10:00", title: "Peinture", section: "Grands", notes: "" };
    const db = activityToDb(a);
    expect(db.notes).toBeNull();
    expect(dbToActivity(db)).toEqual(a);
  });

  it("defaults a missing section to Toutes", () => {
    const a = dbToActivity({ id: "a2", day: 1, start_time: null, end_time: null, title: "Jeux", section: null, notes: null });
    expect(a.section).toBe("Toutes");
    expect(a.startTime).toBe("");
  });
});

describe("announcement mappers", () => {
  it("round-trips an announcement", () => {
    const a: Announcement = { id: "n1", title: "Sortie au parc", body: "Jeudi à 10h", date: "2026-10-28" };
    expect(dbToAnnouncement(announcementToDb(a))).toEqual(a);
  });

  it("stores an empty body as null", () => {
    expect(announcementToDb({ id: "n2", title: "Fermeture", body: "", date: "2026-11-01" }).body).toBeNull();
  });
});
