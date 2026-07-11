import { test } from '../fixtures/test-fixtures';

test.describe('Shipping & fulfillment', () => {
  test.beforeEach(async ({ authenticatedAdminPage }) => {
    void authenticatedAdminPage;
  });

  test('fulfillment page smoke — search form and stage labels', async ({
    adminDashboardPage,
    adminFulfillmentPage,
  }) => {
    await adminDashboardPage.goToFulfillment();
    await adminFulfillmentPage.expectSmokeLoaded();
  });

  test('fulfillment page shows error for unknown order', async ({ adminFulfillmentPage }) => {
    await adminFulfillmentPage.goto();
    await adminFulfillmentPage.loadWorkflow('00000000-0000-4000-8000-000000000000');
    await adminFulfillmentPage.expectWorkflowLoadError();
  });
});
