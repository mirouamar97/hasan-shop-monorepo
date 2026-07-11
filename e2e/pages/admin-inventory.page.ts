import { expect, type Locator, type Page } from '@playwright/test';

export class AdminInventoryPage {
  readonly heading: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Inventory', level: 2 });
  }

  async expectLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible();
    await expect(
      this.page.getByText('Products at or below their low-stock threshold.'),
    ).toBeVisible();
    await expect(this.page.getByRole('columnheader', { name: 'Product' })).toBeVisible();
    await expect(this.page.getByRole('columnheader', { name: 'Available' })).toBeVisible();
    await expect(this.page.getByRole('columnheader', { name: 'Threshold' })).toBeVisible();
  }
}
