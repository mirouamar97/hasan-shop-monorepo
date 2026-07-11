import { expect, type Locator, type Page } from '@playwright/test';

export class StorefrontHomePage {
  readonly brandLink: Locator;

  constructor(private readonly page: Page) {
    this.brandLink = page.getByRole('link', { name: 'HASAN SHOP' });
  }

  async goto(locale = 'ar'): Promise<void> {
    await this.page.goto(`/${locale}`);
  }

  async expectLoaded(): Promise<void> {
    await expect(this.brandLink).toBeVisible();
  }
}
