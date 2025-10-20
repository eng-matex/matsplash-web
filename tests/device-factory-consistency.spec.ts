import { test, expect } from '@playwright/test';

const APP_URL = 'http://localhost:5173';

async function directorLogin(page) {
  await page.goto(APP_URL);
  await page.getByRole('textbox', { name: 'Email or Phone Number' }).fill('director@matsplash.com');
  await page.getByRole('textbox', { name: 'PIN' }).fill('1111');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForLoadState('networkidle');
}

async function logout(page) {
  const logout = page.getByRole('button', { name: 'Logout' });
  if (await logout.isVisible()) {
    await logout.click();
  }
}

test.describe('Device factory + MAC consistency (test device)', () => {
  test('Edit in Device Management reflects in Factory Management and vice versa', async ({ page }) => {
    await directorLogin(page);

    // Navigate to Device Management (Director)
    await page.getByRole('button', { name: /Device Management/i }).click();
    await page.waitForLoadState('networkidle');

    // Open Edit for device named 
test (ID LAPTOP-3404-16)
    const row = page.getByRole('row', { name: /test/i });
    await expect(row).toBeVisible();
    await row.getByRole('button', { name: /Edit/i }).click();

    // Select at least one factory chip card (click first two cards)
    const factoryCards = page.locator('div.MuiCard-root').filter({ hasText: /Factory|MatSplash/i });
    const count = await factoryCards.count();
    if (count > 0) {
      await factoryCards.nth(0).click();
    }
    if (count > 1) {
      await factoryCards.nth(1).click();
    }

    // Add a MAC address in Manage MAC dialog or inline field if present
    const macAddBtn = page.getByRole('button', { name: /Add MAC Address/i });
    if (await macAddBtn.isVisible()) {
      await macAddBtn.click();
      const macField = page.getByLabel(/MAC Address/i).last();
      await macField.fill('AA:BB:CC:DD:EE:16');
    }

    // Save changes
    await page.getByRole('button', { name: /Save|Update Device/i }).click();
    await page.waitForLoadState('networkidle');

    // Go to Factory Management → Device Management
    await page.getByRole('button', { name: /Global Overview/i }).click();
    await page.getByRole('button', { name: /Factory Management/i }).click();
    await page.getByRole('button', { name: /Device Management/i }).click();

    // Edit same device and verify factory selections persisted
    const fmCard = page.getByRole('heading', { name: /test/i }).locator('..');
    await fmCard.getByRole('button', { name: /Edit/i }).click();
    // Check a selected badge exists
    const selectedBadge = page.locator('svg[data-testid=CheckCircleIcon]');
    await expect(selectedBadge.first()).toBeVisible();

    // Assign to factories dialog: ensure at least one is selected
    await page.getByRole('button', { name: /Assign to Factories/i }).click();
    await expect(selectedBadge.first()).toBeVisible();
    // Toggle one factory selection
    if (count > 0) {
      await factoryCards.nth(0).click();
    }
    await page.getByRole('button', { name: /Close|Done|Save/i }).first().click({ timeout: 2000 }).catch(() => {});

    // Back to Edit Device in Factory Management - verify new selection state
    await fmCard.getByRole('button', { name: /Edit/i }).click();
    await expect(selectedBadge.first()).toBeVisible();

    // Back to main Device Management and verify
    await page.getByRole('button', { name: /Global Overview/i }).click();
    await page.getByRole('button', { name: /Device Management/i }).click();
    await row.getByRole('button', { name: /Edit/i }).click();
    await expect(selectedBadge.first()).toBeVisible();

    await logout(page);
  });
});
