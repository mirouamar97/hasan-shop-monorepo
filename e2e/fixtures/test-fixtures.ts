import { test as base, type Page } from '@playwright/test';
import { AdminLoginPage } from '../pages/admin-login.page';
import { AdminDashboardPage } from '../pages/admin-dashboard.page';
import { AdminOrdersPage } from '../pages/admin-orders.page';
import { AdminAnalyticsPage } from '../pages/admin-analytics.page';
import { AdminInventoryPage } from '../pages/admin-inventory.page';
import { AdminFulfillmentPage } from '../pages/admin-fulfillment.page';
import { StorefrontHomePage } from '../pages/storefront-home.page';
import { StorefrontProductPage } from '../pages/storefront-product.page';
import { StorefrontCartPage } from '../pages/storefront-cart.page';
import { StorefrontCheckoutPage } from '../pages/storefront-checkout.page';
import { StorefrontTrackPage } from '../pages/storefront-track.page';

export type AppFixtures = {
  adminLoginPage: AdminLoginPage;
  adminDashboardPage: AdminDashboardPage;
  adminOrdersPage: AdminOrdersPage;
  adminAnalyticsPage: AdminAnalyticsPage;
  adminInventoryPage: AdminInventoryPage;
  adminFulfillmentPage: AdminFulfillmentPage;
  storefrontHomePage: StorefrontHomePage;
  storefrontProductPage: StorefrontProductPage;
  storefrontCartPage: StorefrontCartPage;
  storefrontCheckoutPage: StorefrontCheckoutPage;
  storefrontTrackPage: StorefrontTrackPage;
  authenticatedAdminPage: Page;
};

export const test = base.extend<AppFixtures>({
  adminLoginPage: async ({ page }, use) => {
    await use(new AdminLoginPage(page));
  },
  adminDashboardPage: async ({ page }, use) => {
    await use(new AdminDashboardPage(page));
  },
  adminOrdersPage: async ({ page }, use) => {
    await use(new AdminOrdersPage(page));
  },
  adminAnalyticsPage: async ({ page }, use) => {
    await use(new AdminAnalyticsPage(page));
  },
  adminInventoryPage: async ({ page }, use) => {
    await use(new AdminInventoryPage(page));
  },
  adminFulfillmentPage: async ({ page }, use) => {
    await use(new AdminFulfillmentPage(page));
  },
  storefrontHomePage: async ({ page }, use) => {
    await use(new StorefrontHomePage(page));
  },
  storefrontProductPage: async ({ page }, use) => {
    await use(new StorefrontProductPage(page));
  },
  storefrontCartPage: async ({ page }, use) => {
    await use(new StorefrontCartPage(page));
  },
  storefrontCheckoutPage: async ({ page }, use) => {
    await use(new StorefrontCheckoutPage(page));
  },
  storefrontTrackPage: async ({ page }, use) => {
    await use(new StorefrontTrackPage(page));
  },
  authenticatedAdminPage: async ({ page, adminLoginPage }, use) => {
    await adminLoginPage.goto();
    await adminLoginPage.login();
    await use(page);
  },
});

export { expect } from '@playwright/test';
