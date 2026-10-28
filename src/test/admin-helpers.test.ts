import { describe, expect, it } from "vitest";

import {
  addDays,
  buildReport,
  financeToCsv,
  localDateStr,
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
  const children = [{ section: "Bébés" }, { section: "Grands" }, { section: "Bébés" }];

  it("counts children per section", () => {
    const r = buildReport({ children, presences: {}, finance: [], month: "2026-10" });
    expect(r.childCount).toBe(3);
    expect(r.sectionCounts).toEqual({ Bébés: 2, Grands: 1 });
  });

  it("counts nani presence and absence days for the month only", () => {
    const r = buildReport({
      children: [],
      presences: {
        "n1::2026-10": { "2026-10-01": "present", "2026-10-02": "present", "2026-10-03": "absent" },
        "n2::2026-10": { "2026-10-01": "present" },
        "n1::2026-09": { "2026-09-30": "present" },
      },
      finance: [],
      month: "2026-10",
    });
    expect(r.naniPresentDays).toBe(3);
    expect(r.naniAbsentDays).toBe(1);
  });

  it("totals finance by kind for the month and computes the balance", () => {
    const r = buildReport({
      children: [],
      presences: {},
      finance: [
        { kind: "recette", amount: 500, date: "2026-10-02" },
        { kind: "subvention", amount: 300, date: "2026-10-10" },
        { kind: "depense", amount: 200, date: "2026-10-15" },
        { kind: "depense", amount: 999, date: "2026-09-15" },
      ],
      month: "2026-10",
    });
    expect(r.finance).toEqual({ recette: 500, subvention: 300, depense: 200 });
    expect(r.balance).toBe(600);
  });

  it("never returns NaN on empty data", () => {
    const r = buildReport({ children: [], presences: {}, finance: [], month: "2026-10" });
    expect(r.balance).toBe(0);
    expect(r.naniPresentDays).toBe(0);
  });
});

describe("financeToCsv", () => {
  it("writes a header and quotes fields containing the separator", () => {
    const csv = financeToCsv([{ date: "2026-10-05", kind: "depense", label: 'Jouets; "bois"', amount: 120 }]);
    expect(csv).toBe('Date;Type;Libellé;Montant\n2026-10-05;Dépense;"Jouets; ""bois""";120');
  });

  it("quotes fields containing a newline", () => {
    const csv = financeToCsv([{ date: "2026-10-05", kind: "recette", label: "A\nB", amount: 1 }]);
    expect(csv.split("\n").length).toBe(3);
  });
});
