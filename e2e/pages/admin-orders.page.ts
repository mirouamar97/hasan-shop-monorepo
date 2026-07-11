import { expect, type Locator, type Page } from '@playwright/test';

export class AdminOrdersPage {
  readonly heading: Locator;
  readonly searchInput: Locator;
  readonly applyButton: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Orders', level: 2 });
    this.searchInput = page.getByPlaceholder('Order #, phone, name...');
    this.applyButton = page.getByRole('button', { name: 'Apply' });
  }

  async expectLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible();
    await expect(this.searchInput).toBeVisible();
    await expect(this.applyButton).toBeVisible();
    await expect(this.page.getByRole('columnheader', { name: 'Order #' })).toBeVisible();
    await expect(this.page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
  }
}
