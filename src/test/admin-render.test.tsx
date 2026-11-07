import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it } from "vitest";
import { AUTH_KEY } from "../routes/accullie";
import type { NaniPayment } from "../lib/admin-extra";

describe("Admin page rendering", () => {
  it("renders ReportsSection with financial bars (Gains & Dépenses)", async () => {
    const { ReportsSection } = await import("../components/admin/ReportsSection");
    render(
      <ReportsSection
        children={[{ section: "Bébés" }]}
        parentsCount={2}
        nanisCount={1}
        presences={{}}
        payments={[
          {
            id: "pay-1",
            childId: "c-1",
            month: new Date().toISOString().slice(0, 7),
            amount: 15000,
            status: "paid",
            paidAt: new Date().toISOString().slice(0, 10),
          },
        ]}
        preInscrits={[
          {
            id: "pre-1",
            firstName: "Karim",
            lastName: "Ben",
            birthDate: "2024-01-01",
            anneeScolaire: "2026-2027",
            montant: 5000,
            datePaiement: new Date().toISOString().slice(0, 10),
          },
        ]}
        naniPayments={[
          {
            id: "np-1",
            naniId: "n-1",
            periodeType: "mois",
            periodeRef: new Date().toISOString().slice(0, 7),
            montantDu: 12000,
            montantVerse: 12000,
            statut: "paye",
            remarque: "Salaire",
            datePaiement: new Date().toISOString().slice(0, 10),
          },
        ]}
        finance={[
          {
            id: "fin-1",
            kind: "depense",
            label: "Électricité",
            amount: 8000,
            date: new Date().toISOString().slice(0, 10),
          },
        ]}
      />
    );

    // Verify Gains card and details
    expect(screen.getByText(/Gains du mois/i)).toBeDefined();
    expect(screen.getByText(/Paiements des enfants/i)).toBeDefined();
    expect(screen.getByText(/Pré-inscriptions/i)).toBeDefined();

    // Verify Dépenses card and details
    expect(screen.getByText(/Dépenses du mois/i)).toBeDefined();
    expect(screen.getByText(/Salaires des nanis/i)).toBeDefined();
    expect(screen.getByText(/Dépenses \(Financement\)/i)).toBeDefined();

    // Verify "Enfants par section" is rendered below
    expect(screen.getByText(/Enfants par section/i)).toBeDefined();
  });
});
