import SectionsView from "./SectionsView";

import { screen, fireEvent, render } from "@testing-library/react";

describe("SectionsView tests", () => {
  const sampleSections = ["3", "A", "B"];

  test("SectionsView displays all sections", async () => {
    render(
      <SectionsView sections={sampleSections} selectSection={jest.fn()} />
    );
    sampleSections.forEach((section) => {
      expect(screen.getByText(section)).toBeVisible();
    });
  });

  test("SectionsView displays only the requested sections", async () => {
    render(
      <SectionsView sections={sampleSections} selectSection={jest.fn()} />
    );
    const items = await screen.findAllByRole("listitem");
    expect(items).toHaveLength(sampleSections.length);
  });

  test("Clicking on a section selects it", async () => {
    const handler = jest.fn();
    render(<SectionsView sections={sampleSections} selectSection={handler} />);

    for (let i = 0; i < sampleSections.length; i++) {
      const section = await screen.findByText(sampleSections[i]);
      fireEvent.click(section);
      expect(handler).toHaveBeenCalledWith(sampleSections[i]);
    }
  });

  test("Sections are displayed in alphabetical order", async () => {
    const scrambledSections = ["G", "Z", "A", "2", "1"];
    render(
      <SectionsView
        sections={[...scrambledSections]}
        selectSection={jest.fn()}
      />
    );

    const sortedSections = [...scrambledSections];

    sortedSections.sort((t1, t2) => t1.localeCompare(t2));

    const items = await screen.findAllByRole("listitem");
    const displayedSections = items.map((item) => item.innerHTML);

    expect(displayedSections).toEqual(sortedSections);
  });

  test("Props are not mutated", () => {
    const originalSections = ["G", "Z", "A", "2", "1"];
    const inputSections = [...originalSections];
    render(<SectionsView sections={inputSections} selectSection={jest.fn()} />);

    expect(inputSections).toEqual(originalSections);
  });
});
