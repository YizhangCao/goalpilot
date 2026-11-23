import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockFetch, refresh } from "../../test/router-mock";
import { GoalForm } from "./goal-form";
import type { GoalView } from "./goal-view";

const goal: GoalView = {
  id: "cjld2cjxh0000qzrmn831i7rn",
  title: "Apply to jobs",
  description: "Five a week",
  targetDate: "2026-12-20",
  progress: 20,
  status: "in_progress",
};

function sentBody(fetchMock: ReturnType<typeof mockFetch>) {
  const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
  return JSON.parse(String(init.body));
}

beforeEach(() => refresh.mockClear());

describe("GoalForm (create)", () => {
  it("POSTs the goal, resets the form and refreshes the page", async () => {
    const fetchMock = mockFetch(201, { id: goal.id });
    const user = userEvent.setup();
    render(<GoalForm mode="create" />);

    await user.type(screen.getByLabelText("Title"), "Ship MVP");
    await user.type(screen.getByLabelText(/Description/), "v1");
    await user.type(screen.getByLabelText("Target date"), "2026-12-20");
    await user.clear(screen.getByLabelText("Progress"));
    await user.type(screen.getByLabelText("Progress"), "15");
    await user.click(screen.getByRole("button", { name: "Add goal" }));

    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
    expect(fetchMock).toHaveBeenCalledWith("/api/goals", expect.objectContaining({ method: "POST" }));
    expect(sentBody(fetchMock)).toEqual({
      title: "Ship MVP",
      description: "v1",
      targetDate: "2026-12-20",
      progress: 15,
    });
    expect(screen.getByLabelText("Title")).toHaveProperty("value", "");
    expect(screen.queryByLabelText("Status")).toBeNull();
  });

  it("omits progress when the field is empty", async () => {
    const fetchMock = mockFetch(201, { id: goal.id });
    const user = userEvent.setup();
    render(<GoalForm mode="create" />);

    await user.type(screen.getByLabelText("Title"), "No progress");
    await user.clear(screen.getByLabelText("Progress"));
    await user.click(screen.getByRole("button", { name: "Add goal" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(sentBody(fetchMock)).not.toHaveProperty("progress");
  });

  it("shows field errors from the API next to the fields", async () => {
    mockFetch(400, { error: "Invalid input", fields: { title: ["Title is required"], targetDate: ["Bad date"] } });
    const user = userEvent.setup();
    render(<GoalForm mode="create" />);

    await user.click(screen.getByRole("button", { name: "Add goal" }));

    expect(await screen.findByText("Title is required")).toBeTruthy();
    expect(screen.getByText("Bad date")).toBeTruthy();
    expect(screen.getByLabelText("Title").getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByLabelText("Title").getAttribute("aria-describedby")).toMatch(/title-error$/);
    expect(refresh).not.toHaveBeenCalled();
  });

  it("shows a form-level error when the API fails without field errors", async () => {
    mockFetch(500, { error: "Something went wrong" });
    const user = userEvent.setup();
    render(<GoalForm mode="create" />);

    await user.type(screen.getByLabelText("Title"), "Ship MVP");
    await user.click(screen.getByRole("button", { name: "Add goal" }));

    expect((await screen.findByRole("alert")).textContent).toBe("Something went wrong");
  });

  it("falls back to a generic message when the error body isn't JSON", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("<html>", { status: 502 })));
    const user = userEvent.setup();
    render(<GoalForm mode="create" />);

    await user.click(screen.getByRole("button", { name: "Add goal" }));

    expect((await screen.findByRole("alert")).textContent).toBe("Could not save the goal");
  });
});

describe("GoalForm (edit)", () => {
  it("is prefilled and PATCHes the goal with its status, then calls onDone", async () => {
    const fetchMock = mockFetch(200, goal);
    const onDone = vi.fn();
    const user = userEvent.setup();
    render(<GoalForm mode="edit" goal={goal} onDone={onDone} />);

    expect(screen.getByLabelText("Title")).toHaveProperty("value", "Apply to jobs");
    expect(screen.getByLabelText("Progress")).toHaveProperty("value", "20");
    await user.selectOptions(screen.getByLabelText("Status"), "done");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(onDone).toHaveBeenCalledOnce());
    expect(fetchMock).toHaveBeenCalledWith(`/api/goals/${goal.id}`, expect.objectContaining({ method: "PATCH" }));
    expect(sentBody(fetchMock)).toMatchObject({ title: "Apply to jobs", status: "done", progress: 20 });
    expect(refresh).toHaveBeenCalledOnce();
  });

  it("Cancel calls onDone without saving", async () => {
    const fetchMock = mockFetch(200, goal);
    const onDone = vi.fn();
    render(<GoalForm mode="edit" goal={goal} onDone={onDone} />);

    await userEvent.setup().click(screen.getByRole("button", { name: "Cancel" }));

    expect(onDone).toHaveBeenCalledOnce();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
