import { expect, type Locator, type Page } from '@playwright/test';

export class StorefrontTrackPage {
  readonly heading: Locator;
  readonly orderNumberInput: Locator;
  readonly phoneInput: Locator;
  readonly trackButton: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'تتبع الطلب', level: 1 });
    this.orderNumberInput = page.getByLabel('رقم الطلب');
    this.phoneInput = page.getByLabel('رقم الهاتف');
    this.trackButton = page.getByRole('button', { name: 'تتبع' });
  }

  async goto(locale = 'ar'): Promise<void> {
    await this.page.goto(`/${locale}/track`);
  }

  async expectLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible();
    await expect(this.orderNumberInput).toBeVisible();
    await expect(this.phoneInput).toBeVisible();
    await expect(this.trackButton).toBeVisible();
  }

  async trackOrder(orderNumber: string, phone: string): Promise<void> {
    await this.orderNumberInput.fill(orderNumber);
    await this.phoneInput.fill(phone);
    await this.trackButton.click();
  }

  async expectNotFoundMessage(): Promise<void> {
    await expect(
      this.page.getByText('لم يتم العثور على الطلب. تحقق من رقم الطلب والهاتف.'),
    ).toBeVisible({ timeout: 15_000 });
  }
}
