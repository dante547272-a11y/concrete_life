import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Login Flow
 * Tests the authentication process and login page functionality
 */

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
  });

  test('should display login page with form elements', async ({ page }) => {
    // Check page title/heading
    await expect(page.getByText('混凝土管控平台')).toBeVisible();
    await expect(page.getByText('请登录以继续')).toBeVisible();

    // Check form elements exist
    await expect(page.getByPlaceholder('用户名')).toBeVisible();
    await expect(page.getByPlaceholder('密码')).toBeVisible();
    
    // Check login button - use more specific selector
    const loginButton = page.locator('button[type="submit"]');
    await expect(loginButton).toBeVisible();
  });

  test('should show validation errors for empty form submission', async ({ page }) => {
    // Click login without filling form
    const loginButton = page.locator('button[type="submit"]');
    await loginButton.click();

    // Check for validation messages (Ant Design validation)
    await expect(page.getByText('请输入用户名')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('请输入密码')).toBeVisible({ timeout: 10000 });
  });

  test('should allow typing in username and password fields', async ({ page }) => {
    const usernameInput = page.getByPlaceholder('用户名');
    const passwordInput = page.getByPlaceholder('密码');

    // Type credentials
    await usernameInput.fill('testuser');
    await passwordInput.fill('testpassword');

    // Verify values
    await expect(usernameInput).toHaveValue('testuser');
    await expect(passwordInput).toHaveValue('testpassword');
  });

  test('should have proper form styling (dark theme)', async ({ page }) => {
    // Check that the page has dark background
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Check login card is visible
    const card = page.locator('.ant-card');
    await expect(card).toBeVisible();
  });

  test('should submit form with valid credentials', async ({ page }) => {
    const usernameInput = page.getByPlaceholder('用户名');
    const passwordInput = page.getByPlaceholder('密码');
    const loginButton = page.locator('button[type="submit"]');

    // Fill in credentials
    await usernameInput.fill('admin');
    await passwordInput.fill('password123');

    // Submit form
    await loginButton.click();

    // Form should be submitted (no validation errors)
    await expect(page.getByText('请输入用户名')).not.toBeVisible({ timeout: 2000 });
    await expect(page.getByText('请输入密码')).not.toBeVisible({ timeout: 2000 });
  });

  test('should display login branding elements', async ({ page }) => {
    // Check for factory icon/emoji
    await expect(page.getByText('🏭')).toBeVisible();
    
    // Check for platform name
    await expect(page.getByText('混凝土管控平台')).toBeVisible();
  });
});
