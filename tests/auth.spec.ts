import { test, expect } from "../playwright-fixture";

test.describe("Authentication Smoke Test", () => {
  test("should login successfully as admin", async ({ page }) => {
    // Navigate to the login page
    await page.goto("/");

    // Use actual working credentials
    await page.fill('input[type="email"]', "admin11@abc.com");
    await page.fill('input[type="password"]', "password123");

    // Click login button
    await page.click('button[type="submit"]');

    // Wait for redirection to dashboard (which is '/' for admin)
    // We wait for the URL to NOT be /login anymore
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
    
    // Verify redirection - for admin, default route is '/'
    const url = page.url();
    expect(url).toContain("http://localhost:8080/");

    // Handle the "Welcome Tour" modal if it appears
    const welcomeModal = page.locator('text=Welcome to School Admin');
    if (await welcomeModal.isVisible({ timeout: 5000 })) {
      const gotItButton = page.locator('button:has-text("Got it")');
      if (await gotItButton.isVisible()) {
        await gotItButton.click();
      }
    }

    // Verify dashboard elements are loaded
    // Check for specific text that appears in the admin dashboard
    await expect(page.locator("text=Total Students")).toBeVisible({ timeout: 10000 });
  });

  test("should show error on invalid credentials", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[type="email"]', "wrong@abc.com");
    await page.fill('input[type="password"]', "wrongpassword");
    await page.click('button[type="submit"]');

    // Verify error toast or message contains "Invalid"
    // sonner/toast often takes a moment to animate
    // We check for 'Error' or 'Invalid'
    const errorToast = page.locator('text=Invalid').or(page.locator('text=Error'));
    await expect(errorToast.first()).toBeVisible({ timeout: 10000 });
  });
});
