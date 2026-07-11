import { expect, type Locator, type Page } from '@playwright/test';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from '../helpers/config';

export class AdminLoginPage {
  readonly heading: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'HASAN SHOP' });
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.signInButton = page.getByRole('button', { name: 'Sign In' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  async login(email = ADMIN_EMAIL, password = ADMIN_PASSWORD): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
    await this.page.waitForURL('**/dashboard**', { timeout: 30_000 });
    await expect(this.page.getByRole('heading', { name: 'Dashboard', level: 2 })).toBeVisible();
  }
}
