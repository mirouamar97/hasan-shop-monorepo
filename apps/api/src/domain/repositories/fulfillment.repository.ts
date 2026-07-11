export type FulfillmentStage = 'picking' | 'packing' | 'quality_check' | 'ready_to_ship';
export type FulfillmentTaskStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

export interface FulfillmentTaskRecord {
  id: string;
  orderId: string;
  stage: FulfillmentStage;
  status: FulfillmentTaskStatus;
  assignedTo: string | null;
  barcode: string | null;
  qrCodeData: string | null;
  note: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  completedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFulfillmentRepository {
  initializeForOrder(orderId: string): Promise<FulfillmentTaskRecord[]>;
  findByOrderId(orderId: string): Promise<FulfillmentTaskRecord[]>;
  findTask(orderId: string, stage: FulfillmentStage): Promise<FulfillmentTaskRecord | null>;
  startTask(orderId: string, stage: FulfillmentStage, assignedTo?: string): Promise<FulfillmentTaskRecord>;
  completeTask(
    orderId: string,
    stage: FulfillmentStage,
    completedBy: string,
    note?: string,
    barcode?: string,
    qrCodeData?: string,
  ): Promise<FulfillmentTaskRecord>;
  skipTask(orderId: string, stage: FulfillmentStage, actorId: string): Promise<FulfillmentTaskRecord>;
  isReadyToShip(orderId: string): Promise<boolean>;
}
