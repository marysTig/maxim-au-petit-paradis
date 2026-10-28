import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MenusSection } from "@/components/admin/MenusSection";
import { weekStartOf } from "@/lib/admin-helpers";
import { ParentsSection } from "@/routes/admin";

describe("ParentsSection", () => {
  it("links the child back to a newly added parent", () => {
    const onChildLinkChange = vi.fn();
    const onParentAdded = vi.fn();
    render(
      <ParentsSection
        parents={[]}
        setParents={() => {}}
        children={[
          {
            id: "c1", firstName: "Lina", lastName: "Test", birthDate: "", gender: "", nationality: "",
            section: "Bébés", group: "", motherName: "", motherProfession: "", motherPhone: "",
            fatherName: "", fatherProfession: "", fatherPhone: "", siblingsCount: 0, familySituation: "",
            authorizedPersons: [], parentIds: [], allergies: "", notes: "",
          },
        ]}
        onParentAdded={onParentAdded}
        onParentRemoved={() => {}}
        onChildLinkChange={onChildLinkChange}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Ajouter/ }));
    fireEvent.change(screen.getByPlaceholderText("Marie Dupont"), { target: { value: "Marie Dupont" } });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /Enregistrer/ }));

    const newParentId = onParentAdded.mock.calls[0]?.[0].id;
    expect(onChildLinkChange).toHaveBeenCalledWith("c1", newParentId, true);
  });
});

describe("MenusSection", () => {
  it("shows menus that arrive after the first render", () => {
    const noop = () => {};
    const weekStart = weekStartOf(new Date());
    const { rerender } = render(<MenusSection menus={[]} setMenus={noop} onMenuUpsert={noop} />);

    rerender(
      <MenusSection
        menus={[{ weekStart, day: 0, breakfast: "", lunch: "Riz", snack: "" }]}
        setMenus={noop}
        onMenuUpsert={noop}
      />
    );

    expect(screen.getByDisplayValue("Riz")).toBeInTheDocument();
  });
});
