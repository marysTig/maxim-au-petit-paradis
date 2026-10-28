import { describe, expect, it } from "vitest";

import {
  addDays,
  buildReport,
  localDateStr,
  paymentsToCsv,
  weekStartOf,
} from "@/lib/admin-helpers";

describe("date helpers", () => {
  it("localDateStr uses local date, not UTC", () => {
    expect(localDateStr(new Date(2026, 0, 5, 23, 30))).toBe("2026-01-05");
  });

  it("weekStartOf returns the local Monday", () => {
    expect(weekStartOf(new Date(2026, 9, 28))).toBe("2026-10-26");
    expect(weekStartOf(new Date(2026, 10, 1))).toBe("2026-10-26"); // Sunday
  });

  it("addDays crosses month and year boundaries", () => {
    expect(addDays("2026-12-30", 3)).toBe("2027-01-02");
    expect(addDays("2026-03-02", -7)).toBe("2026-02-23");
  });
});

describe("buildReport", () => {
  const children = [
    { id: "a", section: "Bébés" },
    { id: "b", section: "Grands" },
  ];

  it("computes attendance rate over distinct days of the month", () => {
    const r = buildReport({
      children,
      attendance: [
        { childId: "a", date: "2026-10-01", arrival: "08:00" },
        { childId: "b", date: "2026-10-01", arrival: "08:10" },
        { childId: "a", date: "2026-10-02", arrival: "08:05" },
        { childId: "b", date: "2026-10-03", arrival: null },
        { childId: "a", date: "2026-09-30", arrival: "08:00" },
      ],
      payments: [],
      month: "2026-10",
    });
    expect(r.attendanceDays).toBe(2);
    expect(r.attendanceRate).toBe(0.75);
    expect(r.sectionCounts).toEqual({ Bébés: 1, Grands: 1 });
  });

  it("never returns NaN on empty data", () => {
    const r = buildReport({ children: [], attendance: [], payments: [], month: "2026-10" });
    expect(r.attendanceRate).toBe(0);
    expect(r.attendanceDays).toBe(0);
    expect(r.payments.paid).toEqual({ count: 0, total: 0 });
    expect(r.payments.pending).toEqual({ count: 0, total: 0 });
    expect(r.payments.late).toEqual({ count: 0, total: 0 });
  });

  it("splits payments by status and filters by month", () => {
    const r = buildReport({
      children,
      attendance: [],
      payments: [
        { childId: "a", month: "2026-10", amount: 350, status: "paid" },
        { childId: "b", month: "2026-10", amount: 350, status: "late" },
        { childId: "a", month: "2026-09", amount: 350, status: "paid" },
        { childId: "b", month: "2026-10", amount: 100, status: "paid" },
      ],
      month: "2026-10",
    });
    expect(r.payments.paid).toEqual({ count: 2, total: 450 });
    expect(r.payments.late).toEqual({ count: 1, total: 350 });
    expect(r.payments.pending).toEqual({ count: 0, total: 0 });
  });
});

describe("paymentsToCsv", () => {
  it("quotes fields containing separator or quotes", () => {
    const csv = paymentsToCsv([
      { childName: 'Dupont; "Léa"', month: "2026-10", amount: 350, status: "paid" },
    ]);
    expect(csv).toBe('Enfant;Mois;Montant;Statut\n"Dupont; ""Léa""";2026-10;350;paid');
  });

  it("quotes fields containing a newline", () => {
    const csv = paymentsToCsv([{ childName: "A\nB", month: "2026-10", amount: 1, status: "late" }]);
    expect(csv.split("\n").length).toBe(3);
    expect(csv).toContain('"A\nB"');
  });
});
