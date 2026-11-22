import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockFetch, refresh } from "../../test/router-mock";
import { GoalList } from "./goal-list";
import type { GoalView } from "./goal-view";

const goals: GoalView[] = [
  {
    id: "cjld2cjxh0000qzrmn831i7rn",
    title: "Finish thesis",
    description: "Chapter 3",
    targetDate: "2026-12-01",
    progress: 40,
    status: "in_progress",
  },
  {
    id: "cjld2cjxh0001qzrmn831i7rn",
    title: "<b>Not HTML</b>",
    description: null,
    targetDate: "2027-01-10",
    progress: 0,
    status: "not_started",
  },
];

const item = (title: string) =>
  screen.getAllByRole("listitem").find((li) => li.textContent?.includes(title))!;

beforeEach(() => refresh.mockClear());

describe("GoalList", () => {
  it("renders each goal's title, due date, status, description and progress", () => {
    render(<GoalList goals={goals} />);

    expect(screen.getByRole("list", { name: "Goals" })).toBeTruthy();
    const thesis = item("Finish thesis");
    expect(thesis.textContent).toContain("Due Dec 1, 2026 · In progress");
    expect(thesis.textContent).toContain("Chapter 3");
    expect(thesis.textContent).toContain("40%");
    expect(within(thesis).getByRole("progressbar").getAttribute("aria-valuenow")).toBe("40");
  });

  it("renders titles as plain text", () => {
    render(<GoalList goals={goals} />);
    expect(screen.getByText("<b>Not HTML</b>")).toBeTruthy();
  });

  it("switches a row into an edit form and back", async () => {
    const user = userEvent.setup();
    render(<GoalList goals={goals} />);

    await user.click(within(item("Finish thesis")).getByRole("button", { name: "Edit" }));
    const form = screen.getByRole("form", { name: "Edit goal" });
    expect(within(form).getByLabelText("Title")).toHaveProperty("value", "Finish thesis");

    await user.click(within(form).getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("form", { name: "Edit goal" })).toBeNull();
  });

  it("does nothing when the delete confirmation is dismissed", async () => {
    const fetchMock = mockFetch(204);
    vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<GoalList goals={goals} />);

    await userEvent.setup().click(within(item("Finish thesis")).getByRole("button", { name: "Delete" }));

    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('"Finish thesis"'));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([204, 404])("DELETEs after confirming and refreshes (status %i)", async (status) => {
    const fetchMock = mockFetch(status);
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<GoalList goals={goals} />);

    await userEvent.setup().click(within(item("Finish thesis")).getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
    expect(fetchMock).toHaveBeenCalledWith(`/api/goals/${goals[0].id}`, { method: "DELETE" });
  });

  it("shows an error when the delete fails", async () => {
    mockFetch(500, { error: "Something went wrong" });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<GoalList goals={goals} />);

    await userEvent.setup().click(within(item("Finish thesis")).getByRole("button", { name: "Delete" }));

    expect((await screen.findByRole("alert")).textContent).toBe("Could not delete the goal");
    expect(refresh).not.toHaveBeenCalled();
  });
});
