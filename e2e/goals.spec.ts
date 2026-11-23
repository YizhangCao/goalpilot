import { expect, test } from "@playwright/test";

// Start each test with no goals for the E2E owner (test database only).
test.beforeEach(async ({ request }) => {
  const res = await request.get("/api/goals");
  expect(res.ok()).toBe(true);
  for (const goal of (await res.json()) as { id: string }[]) {
    expect((await request.delete(`/api/goals/${goal.id}`)).status()).toBe(204);
  }
});

test("create, list, edit and delete goals", async ({ page }) => {
  await page.goto("/goals");
  await expect(page.getByRole("heading", { name: "Goals" })).toBeVisible();
  await expect(page.getByText("No goals yet")).toBeVisible();

  const form = page.getByRole("form", { name: "New goal" });

  // A title is required.
  await form.getByLabel("Target date").fill("2027-01-10");
  await form.getByRole("button", { name: "Add goal" }).click();
  await expect(form.getByText("Title is required")).toBeVisible();

  // Create two goals out of date order.
  await form.getByLabel("Title").fill("Later goal");
  await form.getByRole("button", { name: "Add goal" }).click();
  const goals = page.getByRole("list", { name: "Goals" }).getByRole("listitem");
  await expect(goals).toHaveCount(1);

  await form.getByLabel("Title").fill("Sooner goal");
  await form.getByLabel("Description").fill("Draft and send");
  await form.getByLabel("Target date").fill("2026-12-01");
  await form.getByRole("button", { name: "Add goal" }).click();

  // The list is sorted by target date.
  await expect(goals).toHaveCount(2);
  await expect(goals.nth(0)).toContainText("Sooner goal");
  await expect(goals.nth(0)).toContainText("Draft and send");
  await expect(goals.nth(1)).toContainText("Later goal");

  // Edit progress, status and title; the list updates right away.
  const sooner = goals.filter({ hasText: "Sooner goal" });
  await sooner.getByRole("button", { name: "Edit" }).click();
  const edit = sooner.getByRole("form", { name: "Edit goal" });
  await edit.getByLabel("Title").fill("Sooner goal (v2)");
  await edit.getByLabel("Progress").fill("50");
  await edit.getByLabel("Status").selectOption("in_progress");
  await edit.getByRole("button", { name: "Save" }).click();

  const updated = goals.filter({ hasText: "Sooner goal (v2)" });
  await expect(updated).toContainText("50%");
  await expect(updated).toContainText("In progress");

  // Moving the date past the other goal re-sorts the list.
  await updated.getByRole("button", { name: "Edit" }).click();
  await updated.getByRole("form", { name: "Edit goal" }).getByLabel("Target date").fill("2027-02-01");
  await updated.getByRole("button", { name: "Save" }).click();
  await expect(goals.nth(0)).toContainText("Later goal");
  await expect(goals.nth(1)).toContainText("Sooner goal (v2)");

  // Dismissing the confirmation keeps the goal; accepting deletes it.
  const later = goals.filter({ hasText: "Later goal" });
  page.once("dialog", (dialog) => dialog.dismiss());
  await later.getByRole("button", { name: "Delete" }).click();
  await expect(goals).toHaveCount(2);

  page.once("dialog", (dialog) => dialog.accept());
  await later.getByRole("button", { name: "Delete" }).click();
  await expect(goals).toHaveCount(1);
  await expect(page.getByText("Later goal")).toHaveCount(0);

  // Goals persist across reloads.
  await page.reload();
  await expect(goals).toHaveCount(1);
  await expect(goals.first()).toContainText("Sooner goal (v2)");
});
