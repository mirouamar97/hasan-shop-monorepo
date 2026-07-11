import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { DatabaseModule } from './infrastructure/database/database.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { AuthModule } from './presentation/modules/auth/auth.module';
import { HealthModule } from './presentation/modules/health/health.module';
import { SettingsModule } from './presentation/modules/settings/settings.module';
import { GeoModule } from './presentation/modules/geo/geo.module';
import { CatalogModule } from './presentation/modules/catalog/catalog.module';
import { CartModule } from './presentation/modules/cart/cart.module';
import { CheckoutModule } from './presentation/modules/checkout/checkout.module';
import { OrdersModule } from './presentation/modules/orders/orders.module';
import { EngagementModule } from './presentation/modules/engagement/engagement.module';
import { NewsletterModule } from './presentation/modules/newsletter/newsletter.module';
import { NotificationTemplatesModule } from './presentation/modules/notifications/notification-templates.module';
import { ShippingModule } from './presentation/modules/shipping/shipping.module';
import { FulfillmentModule } from './presentation/modules/fulfillment/fulfillment.module';
import { InventoryModule } from './presentation/modules/inventory/inventory.module';
import { SuppliersModule } from './presentation/modules/suppliers/suppliers.module';
import { AnalyticsModule } from './presentation/modules/analytics/analytics.module';
import { CrmModule } from './presentation/modules/crm/crm.module';
import { validateEnv } from './infrastructure/config/env.validation';
import { RepositoriesModule } from './infrastructure/persistence/repositories.module';
import { SecurityModule } from './infrastructure/security/security.module';
import { CsrfGuard } from './infrastructure/security/csrf.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      envFilePath: ['.env', '../../.env'],
    }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'medium', ttl: 60000, limit: 100 },
      { name: 'long', ttl: 3600000, limit: 1000 },
    ]),
    DatabaseModule,
    RedisModule,
    RepositoriesModule,
    SecurityModule,
    AuthModule,
    HealthModule,
    SettingsModule,
    GeoModule,
    CatalogModule,
    CartModule,
    CheckoutModule,
    OrdersModule,
    EngagementModule,
    NewsletterModule,
    NotificationTemplatesModule,
    ShippingModule,
    FulfillmentModule,
    InventoryModule,
    SuppliersModule,
    AnalyticsModule,
    CrmModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: CsrfGuard },
  ],
})
export class AppModule {}
