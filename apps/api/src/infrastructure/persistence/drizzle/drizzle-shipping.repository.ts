import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from '@hasan-shop/database';
import type { Database } from '@hasan-shop/database';
import { carrierConfigs, storeSettings } from '@hasan-shop/database/schema';
import type {
  IShippingRepository,
  ShippingQuoteInput,
  ShippingQuoteResult,
} from '../../../domain/repositories/cart.repository';
import { DATABASE_TOKEN } from '../../database/database.module';

const DEFAULT_HOME_RATE = 600;
const DEFAULT_STOP_DESK_RATE = 400;

@Injectable()
export class DrizzleShippingRepository implements IShippingRepository {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

  async getDefaultCarrier(): Promise<{ carrier: string; settings: Record<string, unknown> } | null> {
    const [config] = await this.db
      .select()
      .from(carrierConfigs)
      .where(and(eq(carrierConfigs.isDefault, true), eq(carrierConfigs.isEnabled, true)))
      .limit(1);

    if (!config) return null;

    return {
      carrier: config.carrier,
      settings: config.settings ?? {},
    };
  }

  async quote(input: ShippingQuoteInput): Promise<ShippingQuoteResult> {
    const defaultCarrier = await this.getDefaultCarrier();
    const [thresholdRow] = await this.db
      .select({ value: storeSettings.value })
      .from(storeSettings)
      .where(eq(storeSettings.key, 'free_shipping_threshold'))
      .limit(1);

    const freeShippingThreshold = thresholdRow?.value ? Number(thresholdRow.value) : null;
    const freeShippingApplied =
      freeShippingThreshold !== null && !Number.isNaN(freeShippingThreshold) && input.subtotal >= freeShippingThreshold;

    const baseRate = input.deliveryType === 'stop_desk' ? DEFAULT_STOP_DESK_RATE : DEFAULT_HOME_RATE;
    const cost = freeShippingApplied ? 0 : baseRate;

    const originWilayaCode = await this.resolveOriginWilayaCode(defaultCarrier?.carrier);
    const estimatedDays = this.estimateDeliveryDays(input.wilayaCode, originWilayaCode);
    const estimateText =
      estimatedDays <= 2 ? `${estimatedDays}-${estimatedDays + 1} days` : `${estimatedDays}-${estimatedDays + 1} days`;

    return {
      cost,
      currency: 'DZD',
      estimatedDays,
      estimateText,
      carrier: defaultCarrier?.carrier ?? 'local',
      freeShippingApplied,
    };
  }

  private async resolveOriginWilayaCode(carrier?: string): Promise<string | null> {
    if (!carrier) return null;

    const [config] = await this.db
      .select({ originWilayaCode: carrierConfigs.originWilayaCode })
      .from(carrierConfigs)
      .where(eq(carrierConfigs.carrier, carrier as (typeof carrierConfigs.$inferSelect)['carrier']))
      .limit(1);

    return config?.originWilayaCode ?? null;
  }

  private estimateDeliveryDays(destinationWilayaCode: string, originWilayaCode: string | null): number {
    if (originWilayaCode && destinationWilayaCode === originWilayaCode) {
      return 2;
    }
    return 4;
  }
}
