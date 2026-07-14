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

  async fillCodAddress(input: {
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
  }): Promise<void> {
    await this.page.getByLabel('الاسم').fill(input.firstName);
    await this.page.getByLabel('اللقب').fill(input.lastName);
    await this.page.getByLabel('رقم الهاتف').fill(input.phone);
    await this.page.getByLabel('العنوان').fill(input.address);

    const wilaya = this.page.getByLabel('الولاية');
    await wilaya.selectOption({ index: 1 });
    await expect(this.page.getByLabel('البلدية').locator('option').nth(1)).toBeAttached({
      timeout: 15_000,
    });
    await this.page.getByLabel('البلدية').selectOption({ index: 1 });
  }

  async submitOrder(): Promise<void> {
    await this.submitButton.click();
  }

  async expectSuccess(): Promise<string> {
    await this.page.waitForURL('**/checkout/success**', { timeout: 45_000 });
    const orderNumber = new URL(this.page.url()).searchParams.get('orderNumber');
    expect(orderNumber).toBeTruthy();
    await expect(this.page.getByRole('heading', { level: 1 })).toBeVisible();
    return orderNumber!;
  }
}
