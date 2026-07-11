import { Global, Module } from '@nestjs/common';
import {
  ANALYTICS_REPOSITORY,
  AUDIT_REPOSITORY,
  BRAND_REPOSITORY,
  CART_REPOSITORY,
  CATEGORY_REPOSITORY,
  CHECKOUT_REPOSITORY,
  CUSTOMER_CRM_REPOSITORY,
  FULFILLMENT_REPOSITORY,
  GEO_REPOSITORY,
  HEALTH_REPOSITORY,
  INVENTORY_REPOSITORY,
  NOTIFICATION_REPOSITORY,
  ORDER_REPOSITORY,
  PRODUCT_REPOSITORY,
  RECENTLY_VIEWED_REPOSITORY,
  SESSION_REPOSITORY,
  SETTINGS_REPOSITORY,
  SHIPMENT_REPOSITORY,
  SHIPPING_REPOSITORY,
  SUPPLIER_REPOSITORY,
  USER_REPOSITORY,
  WISHLIST_REPOSITORY,
} from '../../domain/repositories/tokens';
import { DrizzleAnalyticsRepository } from './drizzle/drizzle-analytics.repository';
import { DrizzleAuditRepository } from './drizzle/drizzle-audit.repository';
import { DrizzleBrandRepository } from './drizzle/drizzle-brand.repository';
import { DrizzleCartRepository } from './drizzle/drizzle-cart.repository';
import { DrizzleCategoryRepository } from './drizzle/drizzle-category.repository';
import { DrizzleCheckoutRepository } from './drizzle/drizzle-checkout.repository';
import { DrizzleCustomerCrmRepository } from './drizzle/drizzle-customer-crm.repository';
import { DrizzleFulfillmentRepository } from './drizzle/drizzle-fulfillment.repository';
import { DrizzleGeoRepository } from './drizzle/drizzle-geo.repository';
import { DrizzleHealthRepository } from './drizzle/drizzle-health.repository';
import { DrizzleInventoryRepository } from './drizzle/drizzle-inventory.repository';
import { DrizzleNotificationRepository } from './drizzle/drizzle-notification.repository';
import { DrizzleOrderRepository } from './drizzle/drizzle-order.repository';
import { DrizzleProductRepository } from './drizzle/drizzle-product.repository';
import { DrizzleRecentlyViewedRepository } from './drizzle/drizzle-recently-viewed.repository';
import { DrizzleSessionRepository } from './drizzle/drizzle-session.repository';
import { DrizzleSettingsRepository } from './drizzle/drizzle-settings.repository';
import { DrizzleShipmentRepository } from './drizzle/drizzle-shipment.repository';
import { DrizzleShippingRepository } from './drizzle/drizzle-shipping.repository';
import { DrizzleSupplierRepository } from './drizzle/drizzle-supplier.repository';
import { DrizzleUserRepository } from './drizzle/drizzle-user.repository';
import { DrizzleWishlistRepository } from './drizzle/drizzle-wishlist.repository';

@Global()
@Module({
  providers: [
    { provide: USER_REPOSITORY, useClass: DrizzleUserRepository },
    { provide: SESSION_REPOSITORY, useClass: DrizzleSessionRepository },
    { provide: SETTINGS_REPOSITORY, useClass: DrizzleSettingsRepository },
    { provide: GEO_REPOSITORY, useClass: DrizzleGeoRepository },
    { provide: AUDIT_REPOSITORY, useClass: DrizzleAuditRepository },
    { provide: CATEGORY_REPOSITORY, useClass: DrizzleCategoryRepository },
    { provide: BRAND_REPOSITORY, useClass: DrizzleBrandRepository },
    { provide: PRODUCT_REPOSITORY, useClass: DrizzleProductRepository },
    { provide: HEALTH_REPOSITORY, useClass: DrizzleHealthRepository },
    { provide: CART_REPOSITORY, useClass: DrizzleCartRepository },
    { provide: ORDER_REPOSITORY, useClass: DrizzleOrderRepository },
    { provide: SHIPPING_REPOSITORY, useClass: DrizzleShippingRepository },
    { provide: WISHLIST_REPOSITORY, useClass: DrizzleWishlistRepository },
    { provide: RECENTLY_VIEWED_REPOSITORY, useClass: DrizzleRecentlyViewedRepository },
    { provide: NOTIFICATION_REPOSITORY, useClass: DrizzleNotificationRepository },
    { provide: CHECKOUT_REPOSITORY, useClass: DrizzleCheckoutRepository },
    { provide: SHIPMENT_REPOSITORY, useClass: DrizzleShipmentRepository },
    { provide: FULFILLMENT_REPOSITORY, useClass: DrizzleFulfillmentRepository },
    { provide: INVENTORY_REPOSITORY, useClass: DrizzleInventoryRepository },
    { provide: SUPPLIER_REPOSITORY, useClass: DrizzleSupplierRepository },
    { provide: ANALYTICS_REPOSITORY, useClass: DrizzleAnalyticsRepository },
    { provide: CUSTOMER_CRM_REPOSITORY, useClass: DrizzleCustomerCrmRepository },
  ],
  exports: [
    USER_REPOSITORY,
    SESSION_REPOSITORY,
    SETTINGS_REPOSITORY,
    GEO_REPOSITORY,
    AUDIT_REPOSITORY,
    CATEGORY_REPOSITORY,
    BRAND_REPOSITORY,
    PRODUCT_REPOSITORY,
    HEALTH_REPOSITORY,
    CART_REPOSITORY,
    ORDER_REPOSITORY,
    SHIPPING_REPOSITORY,
    WISHLIST_REPOSITORY,
    RECENTLY_VIEWED_REPOSITORY,
    NOTIFICATION_REPOSITORY,
    CHECKOUT_REPOSITORY,
    SHIPMENT_REPOSITORY,
    FULFILLMENT_REPOSITORY,
    INVENTORY_REPOSITORY,
    SUPPLIER_REPOSITORY,
    ANALYTICS_REPOSITORY,
    CUSTOMER_CRM_REPOSITORY,
  ],
})
export class RepositoriesModule {}
