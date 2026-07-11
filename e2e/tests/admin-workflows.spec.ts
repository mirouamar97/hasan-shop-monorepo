import { test } from '../fixtures/test-fixtures';

test.describe('Admin workflows', () => {
  test.beforeEach(async ({ authenticatedAdminPage }) => {
    void authenticatedAdminPage;
  });

  test('dashboard shows welcome and navigation', async ({ adminDashboardPage }) => {
    await adminDashboardPage.expectLoaded();
  });

  test('orders list page loads with filters and table', async ({
    adminDashboardPage,
    adminOrdersPage,
  }) => {
    await adminDashboardPage.goToOrders();
    await adminOrdersPage.expectLoaded();
  });

  test('analytics page loads KPI cards', async ({
    adminDashboardPage,
    adminAnalyticsPage,
  }) => {
    await adminDashboardPage.goToAnalytics();
    await adminAnalyticsPage.expectLoaded();
  });

  test('inventory page loads low-stock table', async ({
    adminDashboardPage,
    adminInventoryPage,
  }) => {
    await adminDashboardPage.goToInventory();
    await adminInventoryPage.expectLoaded();
  });
});
