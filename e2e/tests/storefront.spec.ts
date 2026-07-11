import { test, expect } from '../fixtures/test-fixtures';

test.describe('Storefront', () => {
  test('homepage renders in Arabic', async ({ storefrontHomePage }) => {
    await storefrontHomePage.goto('ar');
    await storefrontHomePage.expectLoaded();
  });

  test('products page loads', async ({ page }) => {
    await page.goto('/ar/products');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('cart page loads with empty state', async ({ storefrontCartPage }) => {
    await storefrontCartPage.goto('ar');
    await storefrontCartPage.expectEmpty();
  });

  test('cart flow adds product from detail page', async ({
    storefrontProductPage,
    storefrontCartPage,
  }) => {
    await storefrontProductPage.goto();
    await storefrontProductPage.addToCart();
    await storefrontCartPage.expectWithItems();
  });

  test('checkout page loads with order form', async ({ storefrontCheckoutPage }) => {
    await storefrontCheckoutPage.goto('ar');
    await storefrontCheckoutPage.expectLoaded();
  });

  test('track page loads with lookup form', async ({ storefrontTrackPage }) => {
    await storefrontTrackPage.goto('ar');
    await storefrontTrackPage.expectLoaded();
  });

  test('track page shows not-found message for invalid lookup', async ({
    storefrontTrackPage,
  }) => {
    await storefrontTrackPage.goto('ar');
    await storefrontTrackPage.trackOrder('HS-INVALID-000', '0550000000');
    await storefrontTrackPage.expectNotFoundMessage();
  });
});
