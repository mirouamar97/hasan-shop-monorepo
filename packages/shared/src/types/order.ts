import type { ConfirmationMethod, ConfirmationOutcome, OrderStatus } from '../constants/index';

export interface OrderTimelineEvent {
  status: OrderStatus;
  timestamp: string;
  note?: string;
  actorId?: string;
}

export interface OrderConfirmationRecord {
  id: string;
  orderId: string;
  agentId: string;
  method: ConfirmationMethod;
  outcome: ConfirmationOutcome;
  notes?: string;
  attemptedAt: string;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  details?: Record<string, string[]>;
  requestId?: string;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  requestId?: string;
}
