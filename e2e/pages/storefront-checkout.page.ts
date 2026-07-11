import { expect, type Locator, type Page } from '@playwright/test';

export class StorefrontCheckoutPage {
  readonly heading: Locator;
  readonly submitButton: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'إتمام الطلب', level: 1 });
    this.submitButton = page.getByRole('button', { name: 'تأكيد الطلب' });
  }

  async goto(locale = 'ar'): Promise<void> {
    await this.page.goto(`/${locale}/checkout`);
  }

  async expectLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible();
    await expect(this.page.getByLabel('الاسم')).toBeVisible();
    await expect(this.page.getByLabel('اللقب')).toBeVisible();
    await expect(this.page.getByLabel('رقم الهاتف')).toBeVisible();
    await expect(this.page.getByLabel('الولاية')).toBeVisible();
    await expect(this.page.getByLabel('البلدية')).toBeVisible();
    await expect(this.page.getByLabel('العنوان')).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }
}
