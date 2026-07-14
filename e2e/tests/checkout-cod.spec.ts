import { test, expect } from '../fixtures/test-fixtures';

test.describe('Checkout COD flow', () => {
  test('cart → COD checkout → success → track order', async ({
    storefrontProductPage,
    storefrontCartPage,
    storefrontCheckoutPage,
    storefrontTrackPage,
  }) => {
    const phone = '0555123499';

    await storefrontProductPage.goto();
    await storefrontProductPage.addToCart();
    await storefrontCartPage.expectWithItems();
    await storefrontCartPage.checkoutLink.click();

    await storefrontCheckoutPage.expectLoaded();
    await storefrontCheckoutPage.fillCodAddress({
      firstName: 'علي',
      lastName: 'بن علي',
      phone,
      address: '12 شارع الاختبار، الجزائر',
    });
    await storefrontCheckoutPage.submitOrder();

    const orderNumber = await storefrontCheckoutPage.expectSuccess();
    expect(orderNumber).toMatch(/^HS-/);

    await storefrontTrackPage.goto('ar');
    await storefrontTrackPage.trackOrder(orderNumber, phone);
    await storefrontTrackPage.expectOrderFound(orderNumber);
  });
});
