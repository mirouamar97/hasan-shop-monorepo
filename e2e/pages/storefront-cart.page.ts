import { expect, type Locator, type Page } from '@playwright/test';

export class StorefrontCartPage {
  readonly heading: Locator;
  readonly emptyMessage: Locator;
  readonly continueShoppingLink: Locator;
  readonly checkoutLink: Locator;
  readonly orderSummary: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'سلة التسوق', level: 1 });
    this.emptyMessage = page.getByText('سلتك فارغة');
    this.continueShoppingLink = page.getByRole('link', { name: 'متابعة التسوق' });
    this.checkoutLink = page.getByRole('link', { name: 'إتمام الطلب' });
    this.orderSummary = page.getByText('ملخص الطلب');
  }

  async goto(locale = 'ar'): Promise<void> {
    await this.page.goto(`/${locale}/cart`);
  }

  async expectEmpty(): Promise<void> {
    await expect(this.heading).toBeVisible();
    await expect(this.emptyMessage).toBeVisible();
    await expect(this.continueShoppingLink).toBeVisible();
  }

  async expectWithItems(): Promise<void> {
    await expect(this.heading).toBeVisible();
    await expect(this.orderSummary).toBeVisible();
    await expect(this.checkoutLink).toBeVisible();
    await expect(this.emptyMessage).not.toBeVisible();
  }
}
