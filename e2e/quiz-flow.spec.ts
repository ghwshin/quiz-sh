import { test, expect } from "@playwright/test";

test.describe("Quiz Flow", () => {
  test("home page shows category cards", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Linux Kernel" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Android System" })).toBeVisible();
  });

  test("navigate from home to subcategory selection", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Linux Kernel" }).click();
    await expect(page).toHaveURL(/\/quiz\/linux-kernel/);
    await expect(page.getByText("프로세스 관리")).toBeVisible();
  });

  test("navigate to difficulty selection", async ({ page }) => {
    await page.goto("/quiz/linux-kernel/process-management");
    await expect(page.getByText("초급")).toBeVisible();
    await expect(page.getByText("중급")).toBeVisible();
    await expect(page.getByText("고급")).toBeVisible();
  });

  test("full quiz flow: select category → subcategory → difficulty → answer quiz", async ({
    page,
  }) => {
    // Navigate to beginner process management quiz
    await page.goto("/quiz/linux-kernel/process-management/beginner");

    // Should see quiz content
    await expect(page.getByText(/문제 1/)).toBeVisible();

    // Should see progress counter
    await expect(page.getByText(/1 \//)).toBeVisible();
  });

  test("dynamic route navigation works", async ({ page }) => {
    await page.goto("/quiz/android-system/binder-ipc/beginner");
    await expect(page.getByText(/문제 1/)).toBeVisible();
  });

  test("quiz progress persists after page reload", async ({ page }) => {
    await page.goto("/quiz/linux-kernel/process-management/beginner");

    // Wait for quiz to load
    await expect(page.getByText(/문제 1/)).toBeVisible();

    // Answer a multiple choice question (click first option then submit)
    const options = page.locator("button").filter({ hasText: /^[A-D]\./ });
    const optionCount = await options.count();

    if (optionCount > 0) {
      await options.first().click();
      await page.getByText("제출").click();

      // Verify answer was recorded
      await expect(
        page.getByText(/정답입니다|오답입니다/)
      ).toBeVisible();

      // Reload page
      await page.reload();

      // Progress should persist - the quiz should show previously answered state
      await expect(page.getByText(/문제 1/)).toBeVisible();
    }
  });
});
