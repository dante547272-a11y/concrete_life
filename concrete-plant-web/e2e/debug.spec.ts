import { test } from '@playwright/test';

test('debug queue page', async ({ page }) => {
  // Capture console errors
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    errors.push(err.message);
  });

  await page.goto('/queue');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'queue-debug.png', fullPage: true });
  
  // Log the page content
  const content = await page.content();
  console.log('Page content length:', content.length);
  console.log('Page URL:', page.url());
  console.log('Errors:', errors);
  
  // Check what's on the page
  const body = await page.locator('body').textContent();
  console.log('Body text:', body?.substring(0, 1000));
  
  // Check for React root
  const root = await page.locator('#root').innerHTML();
  console.log('Root innerHTML:', root?.substring(0, 500));
});
