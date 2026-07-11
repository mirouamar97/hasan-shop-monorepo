import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, desc, eq } from '@hasan-shop/database';
import type { Database } from '@hasan-shop/database';
import {
  carrierConfigs,
  shipmentEvents,
  shipments,
} from '@hasan-shop/database/schema';
import type { CarrierSlug, ShipmentStatus } from '@hasan-shop/shared/constants';
import type {
  CarrierConfigRecord,
  CreateShipmentInput,
  IShipmentRepository,
  ShipmentEventRecord,
  ShipmentRecord,
} from '../../../domain/repositories/shipment.repository';
import { DATABASE_TOKEN } from '../../database/database.module';

@Injectable()
export class DrizzleShipmentRepository implements IShipmentRepository {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

  async findById(id: string): Promise<ShipmentRecord | null> {
    const [row] = await this.db.select().from(shipments).where(eq(shipments.id, id)).limit(1);
    return row ? this.toShipmentRecord(row) : null;
  }

  async findByOrderId(orderId: string): Promise<ShipmentRecord | null> {
    const [row] = await this.db
      .select()
      .from(shipments)
      .where(eq(shipments.orderId, orderId))
      .orderBy(desc(shipments.createdAt))
      .limit(1);
    return row ? this.toShipmentRecord(row) : null;
  }

  async findByTrackingNumber(trackingNumber: string): Promise<ShipmentRecord | null> {
    const [row] = await this.db
      .select()
      .from(shipments)
      .where(eq(shipments.trackingNumber, trackingNumber))
      .limit(1);
    return row ? this.toShipmentRecord(row) : null;
  }

  async listCarrierConfigs(): Promise<CarrierConfigRecord[]> {
    const rows = await this.db.select().from(carrierConfigs).orderBy(asc(carrierConfigs.displayName));
    return rows.map((row) => this.toCarrierConfigRecord(row));
  }

  async getDefaultCarrier(): Promise<CarrierConfigRecord | null> {
    const [row] = await this.db
      .select()
      .from(carrierConfigs)
      .where(and(eq(carrierConfigs.isDefault, true), eq(carrierConfigs.isEnabled, true)))
      .limit(1);
    return row ? this.toCarrierConfigRecord(row) : null;
  }

  async getCarrierConfig(carrier: CarrierSlug): Promise<CarrierConfigRecord | null> {
    const [row] = await this.db
      .select()
      .from(carrierConfigs)
      .where(eq(carrierConfigs.carrier, carrier))
      .limit(1);
    return row ? this.toCarrierConfigRecord(row) : null;
  }

  async create(input: CreateShipmentInput): Promise<ShipmentRecord> {
    const [created] = await this.db
      .insert(shipments)
      .values({
        orderId: input.orderId,
        carrier: input.carrier,
        trackingNumber: input.trackingNumber,
        carrierParcelId: input.carrierParcelId,
        labelUrl: input.labelUrl ?? null,
        codAmount: input.codAmount,
        shippingCost: input.shippingCost ?? null,
        weightKg: input.weightKg ?? null,
        metadata: input.metadata ?? {},
        status: 'created',
      })
      .returning();

    if (!created) {
      throw new NotFoundException('Failed to create shipment');
    }

    return this.toShipmentRecord(created);
  }

  async updateStatus(
    shipmentId: string,
    status: ShipmentStatus,
    timestamps?: { shippedAt?: Date; deliveredAt?: Date },
  ): Promise<ShipmentRecord> {
    const now = new Date();
    const [updated] = await this.db
      .update(shipments)
      .set({
        status,
        ...(timestamps?.shippedAt !== undefined ? { shippedAt: timestamps.shippedAt } : {}),
        ...(timestamps?.deliveredAt !== undefined ? { deliveredAt: timestamps.deliveredAt } : {}),
        updatedAt: now,
      })
      .where(eq(shipments.id, shipmentId))
      .returning();

    if (!updated) {
      throw new NotFoundException(`Shipment not found: ${shipmentId}`);
    }

    return this.toShipmentRecord(updated);
  }

  async addEvent(
    shipmentId: string,
    event: {
      status: string;
      statusLabel?: string;
      location?: string;
      rawPayload?: Record<string, unknown>;
      occurredAt?: Date;
    },
  ): Promise<ShipmentEventRecord> {
    const [created] = await this.db
      .insert(shipmentEvents)
      .values({
        shipmentId,
        status: event.status,
        statusLabel: event.statusLabel ?? null,
        location: event.location ?? null,
        rawPayload: event.rawPayload ?? null,
        occurredAt: event.occurredAt ?? new Date(),
      })
      .returning();

    if (!created) {
      throw new NotFoundException(`Failed to add shipment event for ${shipmentId}`);
    }

    return this.toShipmentEventRecord(created);
  }

  async listEvents(shipmentId: string): Promise<ShipmentEventRecord[]> {
    const rows = await this.db
      .select()
      .from(shipmentEvents)
      .where(eq(shipmentEvents.shipmentId, shipmentId))
      .orderBy(asc(shipmentEvents.occurredAt));

    return rows.map((row) => this.toShipmentEventRecord(row));
  }

  private toShipmentRecord(row: typeof shipments.$inferSelect): ShipmentRecord {
    return {
      id: row.id,
      orderId: row.orderId,
      carrier: row.carrier,
      trackingNumber: row.trackingNumber,
      carrierParcelId: row.carrierParcelId,
      status: row.status,
      labelUrl: row.labelUrl,
      codAmount: row.codAmount,
      shippingCost: row.shippingCost,
      weightKg: row.weightKg,
      metadata: row.metadata ?? {},
      shippedAt: row.shippedAt,
      deliveredAt: row.deliveredAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private toShipmentEventRecord(row: typeof shipmentEvents.$inferSelect): ShipmentEventRecord {
    return {
      id: row.id,
      shipmentId: row.shipmentId,
      status: row.status,
      statusLabel: row.statusLabel,
      location: row.location,
      occurredAt: row.occurredAt,
    };
  }

  private toCarrierConfigRecord(row: typeof carrierConfigs.$inferSelect): CarrierConfigRecord {
    return {
      id: row.id,
      carrier: row.carrier,
      displayName: row.displayName,
      isEnabled: row.isEnabled,
      isDefault: row.isDefault,
      credentials: row.credentials ?? {},
      settings: row.settings ?? {},
      originWilayaCode: row.originWilayaCode,
    };
  }
}
