import { test, expect } from '@playwright/test';

test('Sign in to Free CRM using Google', async ({ page }) => {
  // Navigate to Free CRM
  await page.goto('https://www.freecrm.com');

  // Click on the login button
  await page.click('text=Login');

  // Click on 'Sign in with Google'
  await page.click('text=Sign in with Google');

  // Wait for the Google sign-in popup
  const [popup] = await Promise.all([
    page.waitForEvent('popup'),
    page.click('text=Sign in with Google')
  ]);

  // Fill in the email
  await popup.fill('input[type="email"]', 'damodharnalluri@gmail.com');

  // Click Next
  await popup.click('text=Next');

  // Fill in the password
  await popup.fill('input[type="password"]', 'Naga@123');

  // Click Next
  await popup.click('text=Next');

  // Wait for navigation back to Free CRM
  await page.waitForLoadState('networkidle');

  // Verify the Free CRM page (check for a specific element or URL)
  await expect(page).toHaveURL(/freecrm\.com/);
  await expect(page.locator('text=Dashboard')).toBeVisible(); // Assuming there's a Dashboard text on the logged-in page
});