import { test } from '@playwright/test';

test('sales and inventory navigation works', async ({ page }) => {
  await page.goto('https://sdm-steel.vercel.app/sales');
  await page.locator('form').filter({ hasText: 'AdminAccess to everything.' }).getByRole('button').click();
  await page.getByRole('link', { name: 'Create Set-Up' }).click();
  await page.getByRole('link', { name: 'Return to dashboard' }).click();
  await page.getByRole('button', { name: 'Sign Out' }).click();
  await page.locator('form').filter({ hasText: 'Saul DiazSales and inventory' }).getByRole('button').click();
  await page.getByRole('link', { name: 'Return to dashboard' }).click();
  await page.getByRole('link', { name: 'Inventory' }).click();
  await page.getByRole('link', { name: 'Finished Goods / FG' }).click();
  await page.getByRole('link', { name: 'Return to dashboard' }).click();
  await page.getByRole('button', { name: 'Sign Out' }).click();
});
