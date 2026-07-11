import { expect, type Locator, type Page } from '@playwright/test';

export class AdminAnalyticsPage {
  readonly heading: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Analytics', level: 2 });
  }

  async expectLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible();
    await expect(this.page.getByText('Revenue')).toBeVisible();
    await expect(this.page.getByText('Orders')).toBeVisible();
    await expect(this.page.getByText('Avg. order value')).toBeVisible();
    await expect(this.page.getByText('Top products')).toBeVisible();
  }
}
