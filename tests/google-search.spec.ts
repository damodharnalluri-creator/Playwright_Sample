import { test, expect } from '@playwright/test';
import * as assert_auto from './Play_assertion/play_assertion.ts';
test('1.Signup verification - FreeCRM', async ({ page }) => {
  // Navigate to FreeCRM
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  // Click on SIGN UP button
  await page.click('a[href*="register"]');

  // Wait for the registration page to load
  await page.waitForLoadState('networkidle');

  // Generate random email
  const randomEmail = `testuser${Math.floor(Math.random() * 100000)}@example.com`;

  // Enter email address in the email input field
  await page.fill('input[name="email"]', randomEmail);

  // Click on SIGN UP button
  await page.click('button:has-text("SIGN UP"), a:has-text("SIGN UP")');

  // Wait for response
  await page.waitForLoadState('networkidle');

  // Verify we're on the next step or confirmation page
  await page.close();
});




test('2.Sign in to Free CRM using Google', async ({ page }, testinfo) => {
  // Navigate to FreeCRM homepage
  await page.goto('/');

  // Click on the login button
  await page.click("//*[text()='Log In']");

  // Fill login credentials
  await page.getByRole('textbox', { name: 'Email' }).pressSequentially('damodharnalluri@gmail.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('Naga@123');
  await page.getByRole('textbox', { name: 'Password' }).press('Enter');

  await page.waitForLoadState('networkidle');

  // Verify login success and user name
  await expect(page.locator('b')).toContainText('Damodhar Nalluri');

  // Verify key Free CRM page elements after login
  const expectedPageElements = [
'a[href="/home"]',        // Home
    'a[href="/contacts"]',    // Contacts
    'a[href="/companies"]',   // Companies
    'a[href="/deals"]',       // Deals
    'a[href="/tasks"]',       // Tasks
    'a[href="/calendar"]',    // Calendar
    'a[href="/reports"]',     // Reports
    

  ];

  for (const locator of expectedPageElements) {
    //await page.locator(locator).click();
    await expect(page.locator(locator)).toBeVisible({ timeout: 15000 });
  }
  page.locator(".settings").first().click();
  await page.getByRole('option', { name: 'Settings' }).click();
  await page.getByText('Accounts', { exact: true }).click();
  //await page.locator('input[name="image"]').click();
  // await page.locator('input[name="image"]').setInputFiles('134182386691373312.jpg');
  // await page.locator('input[name="image"]').setInputFiles('134182386691373312.jpg');
});