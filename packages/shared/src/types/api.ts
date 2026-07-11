export interface PaginationQuery {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'error';
  version: string;
  timestamp: string;
  services: {
    database: 'up' | 'down';
    redis: 'up' | 'down';
    meilisearch: 'up' | 'down';
    storage?: 'up' | 'down';
    clamav?: 'up' | 'down';
  };
}
