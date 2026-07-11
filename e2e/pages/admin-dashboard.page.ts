import { expect, type Locator, type Page } from '@playwright/test';

export class AdminDashboardPage {
  readonly heading: Locator;
  readonly ordersLink: Locator;
  readonly analyticsLink: Locator;
  readonly inventoryLink: Locator;
  readonly fulfillmentLink: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Dashboard', level: 2 });
    this.ordersLink = page.getByRole('link', { name: 'Orders' });
    this.analyticsLink = page.getByRole('link', { name: 'Analytics' });
    this.inventoryLink = page.getByRole('link', { name: 'Inventory' });
    this.fulfillmentLink = page.getByRole('link', { name: 'Fulfillment' });
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page.getByText(/Welcome,/)).toBeVisible();
    await expect(this.ordersLink).toBeVisible();
    await expect(this.analyticsLink).toBeVisible();
    await expect(this.inventoryLink).toBeVisible();
    await expect(this.fulfillmentLink).toBeVisible();
    await expect(this.heading).toBeVisible();
  }

  async goToOrders(): Promise<void> {
    await this.ordersLink.click();
    await this.page.waitForURL('**/dashboard/orders**');
  }

  async goToAnalytics(): Promise<void> {
    await this.analyticsLink.click();
    await this.page.waitForURL('**/dashboard/analytics**');
  }

  async goToInventory(): Promise<void> {
    await this.inventoryLink.click();
    await this.page.waitForURL('**/dashboard/inventory**');
  }

  async goToFulfillment(): Promise<void> {
    await this.fulfillmentLink.click();
    await this.page.waitForURL('**/dashboard/fulfillment**');
  }
}
