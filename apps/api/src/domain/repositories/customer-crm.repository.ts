export interface CustomerNoteRecord {
  id: string;
  customerId: string | null;
  phone: string | null;
  note: string;
  authorId: string | null;
  authorName?: string | null;
  createdAt: Date;
}

export interface CustomerTagRecord {
  id: string;
  customerId: string | null;
  phone: string | null;
  tag: string;
  createdAt: Date;
}

export interface CustomerTimelineEntry {
  type: 'order' | 'note' | 'tag' | 'notification';
  id: string;
  title: string;
  description?: string;
  createdAt: Date;
  metadata?: Record<string, unknown>;
}

export interface CustomerProfile {
  id: string | null;
  phone: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  orderCount: number;
  totalSpent: number;
  tags: string[];
  isVip: boolean;
  isBlacklisted: boolean;
  notes: CustomerNoteRecord[];
  timeline: CustomerTimelineEntry[];
}

export interface ICustomerCrmRepository {
  getProfileByPhone(phone: string): Promise<CustomerProfile>;
  getProfileByCustomerId(customerId: string): Promise<CustomerProfile>;
  addNote(input: {
    customerId?: string;
    phone?: string;
    note: string;
    authorId?: string;
  }): Promise<CustomerNoteRecord>;
  addTag(input: { customerId?: string; phone?: string; tag: string }): Promise<CustomerTagRecord>;
  removeTag(tagId: string): Promise<void>;
  listByTag(tag: string): Promise<CustomerProfile[]>;
}
