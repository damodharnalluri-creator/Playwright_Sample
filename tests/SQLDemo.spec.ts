import { test, expect } from '@playwright/test';

test.describe('W3Schools SQL Demo Database', () => {
  test('Verify Demo Database elements on ORDER BY page', async ({ page }) => {
    await page.goto('https://www.w3schools.com/sql/sql_orderby.asp', { waitUntil: 'domcontentloaded' });

    const demoHeading = page.locator('text=Demo Database');
    await expect(demoHeading).toBeVisible();

    const demoTable = page.locator('xpath=//h2[contains(., "Demo Database")]/following::table[1]');
    await expect(demoTable).toBeVisible();

    const headers = demoTable.locator('th');
    const rows = demoTable.locator('tr');
    //await expect(headers).toHaveCountGreaterThan(0);
    //await expect(rows).toHaveCountGreaterThan(1);

    // Verify each data cell has non-empty text
    const dataCells = demoTable.locator('td');
    const cellCount = await dataCells.count();
    expect(cellCount).toBeGreaterThan(0);
    for (let i = 0; i < cellCount; i++) {
      const text = (await dataCells.nth(i).innerText()).trim();
      console.log(text);
      
      expect(text.length).toBeGreaterThan(0);
    }
  });
});
