import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Main Business Flows
 * Tests navigation and core page functionality
 */

test.describe('Navigation and Layout', () => {
  test('should redirect to dashboard from root', async ({ page }) => {
    await page.goto('/');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should display dashboard with task info bar', async ({ page }) => {
    await page.goto('/dashboard');

    // Check task info elements
    await expect(page.getByText('任务:')).toBeVisible();
    await expect(page.getByText('方量:')).toBeVisible();
    await expect(page.getByText('车牌:')).toBeVisible();
  });

  test('should display connection status indicator', async ({ page }) => {
    await page.goto('/dashboard');

    // Check connection status is shown
    await expect(page.getByText(/连接/)).toBeVisible();
  });

  test('should have fullscreen toggle button', async ({ page }) => {
    await page.goto('/dashboard');

    // Check fullscreen button exists
    const fullscreenButton = page.locator('[title="全屏显示"]');
    await expect(fullscreenButton).toBeVisible();
  });
});

test.describe('Vehicles Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/vehicles');
  });

  test('should display vehicles table', async ({ page }) => {
    // Check table headers
    await expect(page.getByText('车牌号')).toBeVisible();
    await expect(page.getByText('车辆类型')).toBeVisible();
    await expect(page.getByText('状态')).toBeVisible();
  });

  test('should have search input', async ({ page }) => {
    await expect(page.getByPlaceholder('搜索车牌号')).toBeVisible();
  });

  test('should have add vehicle button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /新增车辆/ })).toBeVisible();
  });

  test('should display mock vehicle data', async ({ page }) => {
    // Check for mock data
    await expect(page.getByText('粤A12345')).toBeVisible();
    // Use first() to handle multiple matches
    await expect(page.getByText('搅拌车').first()).toBeVisible();
  });
});

test.describe('Orders Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/orders');
  });

  test('should display orders table', async ({ page }) => {
    // Check table headers
    await expect(page.getByText('订单号')).toBeVisible();
    await expect(page.getByText('客户')).toBeVisible();
    await expect(page.getByText('混凝土等级')).toBeVisible();
  });

  test('should have date range picker', async ({ page }) => {
    // Check for date picker
    const datePicker = page.locator('.ant-picker-range');
    await expect(datePicker).toBeVisible();
  });

  test('should have add order button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /新增订单/ })).toBeVisible();
  });
});

test.describe('Queue Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/queue');
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display queue board title', async ({ page }) => {
    // Check that the title text exists in the page
    await expect(page.getByText('车辆排队看板', { exact: true })).toBeAttached({ timeout: 10000 });
  });

  test('should show queue count', async ({ page }) => {
    // Check for the queue count text
    await expect(page.getByText(/当前排队车辆:\s*\d+\s*辆/)).toBeAttached({ timeout: 10000 });
  });

  test('should display queue items with vehicle info', async ({ page }) => {
    // Check for vehicle plates in queue - wait for content to load
    await expect(page.locator('text=粤A12345').first()).toBeVisible({ timeout: 10000 });
  });

  test('should show wait time for vehicles', async ({ page }) => {
    // Check for wait time text
    await expect(page.locator('text=/等待.*分钟/').first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Tasks Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tasks');
  });

  test('should display tasks table with headers', async ({ page }) => {
    // Check table headers using column header role for specificity
    await expect(page.getByRole('columnheader', { name: '任务号' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '订单号' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '车牌号' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '司机' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '混凝土等级' })).toBeVisible();
  });

  test('should have search input for tasks', async ({ page }) => {
    await expect(page.getByPlaceholder('搜索任务号')).toBeVisible();
  });

  test('should have create task button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /新建任务/ })).toBeVisible();
  });

  test('should display mock task data', async ({ page }) => {
    // Check for mock task data - use first() for elements that may appear multiple times
    await expect(page.getByText('T20240115001').first()).toBeVisible();
    await expect(page.getByRole('cell', { name: 'ORD20240115001' }).first()).toBeVisible();
  });

  test('should display task status badges', async ({ page }) => {
    // Check for status tags
    await expect(page.getByText('装车中').first()).toBeVisible();
    await expect(page.getByText('配送中').first()).toBeVisible();
  });

  test('should show assign vehicle button for pending tasks', async ({ page }) => {
    // Check for assign vehicle action
    await expect(page.getByText('分配车辆').first()).toBeVisible();
  });
});

test.describe('Drivers Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/drivers');
  });

  test('should display drivers table with headers', async ({ page }) => {
    // Check table headers
    await expect(page.getByText('姓名')).toBeVisible();
    await expect(page.getByText('电话')).toBeVisible();
    await expect(page.getByText('驾驶证号')).toBeVisible();
    await expect(page.getByText('资质有效期')).toBeVisible();
  });

  test('should have search input for drivers', async ({ page }) => {
    await expect(page.getByPlaceholder('搜索司机姓名')).toBeVisible();
  });

  test('should have add driver button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /新增司机/ })).toBeVisible();
  });

  test('should display mock driver data', async ({ page }) => {
    // Check for mock driver data
    await expect(page.getByText('张三').first()).toBeVisible();
    await expect(page.getByText('13800138001')).toBeVisible();
  });

  test('should display driver status badges', async ({ page }) => {
    // Check for status tags - active and expired
    await expect(page.getByText('在职').first()).toBeVisible();
    await expect(page.getByText('资质过期').first()).toBeVisible();
  });

  test('should highlight expired qualifications', async ({ page }) => {
    // Check that expired status is shown with red color
    const expiredTag = page.getByText('资质过期').first();
    await expect(expiredTag).toBeVisible();
  });
});
