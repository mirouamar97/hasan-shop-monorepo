import { expect, type Locator, type Page } from '@playwright/test';

export class AdminFulfillmentPage {
  readonly heading: Locator;
  readonly orderIdInput: Locator;
  readonly loadButton: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Fulfillment', level: 2 });
    this.orderIdInput = page.getByPlaceholder('Enter order UUID...');
    this.loadButton = page.getByRole('button', { name: 'Load workflow' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/dashboard/fulfillment');
  }

  async expectSmokeLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible();
    await expect(this.orderIdInput).toBeVisible();
    await expect(this.loadButton).toBeVisible();
    await expect(this.loadButton).toBeDisabled();
  }

  async loadWorkflow(orderId: string): Promise<void> {
    await this.orderIdInput.fill(orderId);
    await this.loadButton.click();
  }

  async expectWorkflowLoadError(): Promise<void> {
    await expect(
      this.page.getByText(/Failed to load workflow|No fulfillment tasks found/),
    ).toBeVisible({ timeout: 15_000 });
  }
}
