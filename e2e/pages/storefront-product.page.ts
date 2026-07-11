import { expect, type Locator, type Page } from '@playwright/test';
import { SAMPLE_PRODUCT_SLUG } from '../helpers/config';

export class StorefrontProductPage {
  readonly title: Locator;
  readonly addToCartButton: Locator;

  constructor(private readonly page: Page) {
    this.title = page.getByRole('heading', { level: 1 });
    this.addToCartButton = page.getByRole('button', { name: 'أضف إلى السلة' });
  }

  async goto(slug = SAMPLE_PRODUCT_SLUG, locale = 'ar'): Promise<void> {
    await this.page.goto(`/${locale}/products/${slug}`);
  }

  async addToCart(): Promise<void> {
    await expect(this.title).toBeVisible();
    await this.addToCartButton.click();
    await this.page.waitForURL('**/ar/cart**', { timeout: 30_000 });
  }
}
