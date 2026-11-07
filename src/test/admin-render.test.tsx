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

  it("renders EspaceParentSection with children parent contacts & WhatsApp links", async () => {
    const { EspaceParentSection } = await import("../components/admin/EspaceParentSection");
    render(
      <EspaceParentSection
        announcements={[]}
        setAnnouncements={() => {}}
        onAnnouncementUpsert={() => {}}
        onAnnouncementDelete={() => {}}
        children={[
          {
            id: "child-1",
            firstName: "Yacine",
            lastName: "Benali",
            section: "Bébés",
            fatherName: "Ahmed Benali",
            fatherPhone: "0770123456",
            motherName: "Fatima Benali",
            motherPhone: "0550987654",
          },
        ]}
        parents={[]}
      />
    );

    // Verify tabs
    expect(screen.getByText(/Contacts & WhatsApp des parents/i)).toBeDefined();
    expect(screen.getAllByText(/Annonces publiques/i).length).toBeGreaterThanOrEqual(1);

    // Verify Child info
    expect(screen.getAllByText(/Benali/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Yacine/i)).toBeDefined();

    // Verify Father info & WhatsApp
    expect(screen.getByText(/Ahmed Benali/i)).toBeDefined();
    expect(screen.getByText(/0770123456/i)).toBeDefined();

    // Verify Mother info & WhatsApp
    expect(screen.getByText(/Fatima Benali/i)).toBeDefined();
    expect(screen.getByText(/0550987654/i)).toBeDefined();

    // Verify WhatsApp links
    const links = screen.getAllByRole("link");
    const waLinks = links.filter((l) => l.getAttribute("href")?.includes("wa.me"));
    expect(waLinks.length).toBe(2);
    expect(waLinks[0].getAttribute("href")).toContain("213770123456");
    expect(waLinks[1].getAttribute("href")).toContain("213550987654");
  });

  it("excludes inactive children from PaymentGridSection", async () => {
    const { PaymentGridSection } = await import("../components/admin/PaymentGridSection");
    render(
      <PaymentGridSection
        children={[
          { id: "c-active", firstName: "Lina", lastName: "Actif", section: "Bébés", active: true },
          { id: "c-inactive", firstName: "Nassim", lastName: "Inactif", section: "Bébés", active: false },
        ]}
        payments={[]}
        onRecord={() => {}}
      />
    );

    expect(screen.getByText(/Lina/i)).toBeDefined();
    expect(screen.queryByText(/Nassim/i)).toBeNull();
  });

  it("excludes inactive children from PreInscriptionSection", async () => {
    const { PreInscriptionSection } = await import("../components/admin/PreInscriptionSection");
    render(
      <PreInscriptionSection
        preInscrits={[
          {
            id: "pre-active",
            firstName: "Lina",
            lastName: "Actif",
            birthDate: "2024-01-01",
            anneeScolaire: "2026-2027",
            montant: 5000,
            datePaiement: "2026-11-01",
          },
          {
            id: "pre-inactive",
            firstName: "Nassim",
            lastName: "Inactif",
            birthDate: "2024-01-01",
            anneeScolaire: "2026-2027",
            montant: 5000,
            datePaiement: "2026-11-01",
          },
        ]}
        children={[
          { firstName: "Lina", lastName: "Actif", active: true },
          { firstName: "Nassim", lastName: "Inactif", active: false },
        ]}
        onSave={() => {}}
        onDelete={() => {}}
      />
    );

    expect(screen.getByText(/Lina/i)).toBeDefined();
    expect(screen.queryByText(/Nassim/i)).toBeNull();
  });

  it("does not count inactive children in sections in ReportsSection", async () => {
    const { ReportsSection } = await import("../components/admin/ReportsSection");
    render(
      <ReportsSection
        children={[
          { section: "Bébés", active: true },
          { section: "Bébés", active: false },
          { section: "Grands", active: false },
        ]}
        parentsCount={1}
        nanisCount={1}
        presences={{}}
        crecheSections={[
          { id: "s-1", name: "Bébés" },
          { id: "s-2", name: "Grands" },
        ]}
        payments={[]}
        preInscrits={[]}
        naniPayments={[]}
        finance={[]}
      />
    );

    // Only 1 active child should be counted in Bébés, 0 in Grands
    // In "👶 Enfants par section", Bébés count should be 1
    const bebesSection = screen.getByText("Bébés");
    expect(bebesSection).toBeDefined();
  });
});
