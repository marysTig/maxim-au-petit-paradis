import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it } from "vitest";
import { AUTH_KEY } from "../routes/accullie";
import type { NaniPayment } from "../lib/admin-extra";

describe("Admin page rendering", () => {
  it("renders NanisSection directly with mock payments", async () => {
    const adminModule = await import("../routes/admin");
    // We can test if NanisSection crashes when naniPayments is empty or has items
    const mockPayments: NaniPayment[] = [
      {
        id: "p1",
        naniId: "n1",
        periodeType: "mois",
        periodeRef: "2026-11",
        montantDu: 100000,
        montantVerse: 50000,
        statut: "partiel",
        remarque: "test",
        datePaiement: "2026-11-05",
      },
      {
        id: "p2",
        naniId: "n1",
        periodeType: "jour",
        periodeRef: "2026-11-02",
        montantDu: 5000,
        montantVerse: 5000,
        statut: "paye",
        remarque: "",
        datePaiement: "",
      },
    ];

    // Let's render the AdminDashboard
    sessionStorage.setItem(AUTH_KEY, "true");
    const Route = adminModule.Route;
    const Component = Route.options.component;
    if (!Component) throw new Error("No component");

    render(<Component />);
  });
});
