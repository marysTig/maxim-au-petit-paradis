import { describe, expect, it } from "vitest";

import {
  activityToDb,
  dbToActivity,
  dbToMenu,
  dbToStaff,
  dbToStaffAttendance,
  menuToDb,
  staffAttendanceToDb,
  staffToDb,
  type Activity,
  type MenuDay,
  type Staff,
} from "@/lib/admin-extra";

const staff: Staff = {
  id: "s1",
  name: "Amel Benali",
  role: "Éducatrice",
  phone: "0555000000",
  email: "amel@example.com",
  section: "Bébés",
  hireDate: "2025-09-01",
  notes: "Titulaire CAP",
};

describe("staff mappers", () => {
  it("round-trips a staff member", () => {
    expect(dbToStaff(staffToDb(staff))).toEqual(staff);
  });

  it("turns empty strings into null for the database", () => {
    const db = staffToDb({ ...staff, email: "", hireDate: "" });
    expect(db.email).toBeNull();
    expect(db.hire_date).toBeNull();
  });

  it("turns null columns into empty strings", () => {
    const s = dbToStaff({ id: "s2", name: "X", role: null, phone: null, email: null, section: null, hire_date: null, notes: null });
    expect(s.role).toBe("");
    expect(s.section).toBe("Toutes");
  });
});

describe("staff attendance mappers", () => {
  it("builds the id from staff id and date", () => {
    const db = staffAttendanceToDb({ staffId: "s1", date: "2026-10-28", arrival: "08:00", departure: null });
    expect(db.id).toBe("s1_2026-10-28");
    expect(db.staff_id).toBe("s1");
    expect(db.departure).toBeNull();
  });

  it("reads a row back", () => {
    const rec = dbToStaffAttendance({ staff_id: "s1", date: "2026-10-28", arrival: "08:00", departure: "17:00" });
    expect(rec).toEqual({ staffId: "s1", date: "2026-10-28", arrival: "08:00", departure: "17:00" });
  });
});

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
});
