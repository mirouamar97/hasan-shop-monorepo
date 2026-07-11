import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type {
  CustomerNoteRecord,
  CustomerProfile,
  CustomerTagRecord,
  ICustomerCrmRepository,
} from '../../domain/repositories/customer-crm.repository';
import { CUSTOMER_CRM_REPOSITORY } from '../../domain/repositories/tokens';

const VIP_TAGS = new Set(['vip', 'VIP']);
const BLACKLIST_TAGS = new Set(['blacklist', 'blacklisted', 'blocked']);

@Injectable()
export class CustomerCrmService {
  constructor(@Inject(CUSTOMER_CRM_REPOSITORY) private readonly crmRepo: ICustomerCrmRepository) {}

  getProfileByPhone(phone: string): Promise<CustomerProfile> {
    return this.crmRepo.getProfileByPhone(phone);
  }

  getProfileByCustomerId(customerId: string): Promise<CustomerProfile> {
    return this.crmRepo.getProfileByCustomerId(customerId);
  }

  addNote(input: {
    customerId?: string;
    phone?: string;
    note: string;
    authorId?: string;
  }): Promise<CustomerNoteRecord> {
    if (!input.customerId && !input.phone) {
      throw new BadRequestException('customerId or phone is required');
    }
    if (!input.note?.trim()) {
      throw new BadRequestException('Note cannot be empty');
    }
    return this.crmRepo.addNote(input);
  }

  addTag(input: { customerId?: string; phone?: string; tag: string }): Promise<CustomerTagRecord> {
    if (!input.customerId && !input.phone) {
      throw new BadRequestException('customerId or phone is required');
    }
    if (!input.tag?.trim()) {
      throw new BadRequestException('Tag cannot be empty');
    }
    return this.crmRepo.addTag(input);
  }

  removeTag(tagId: string): Promise<void> {
    return this.crmRepo.removeTag(tagId);
  }

  listByTag(tag: string): Promise<CustomerProfile[]> {
    return this.crmRepo.listByTag(tag);
  }

  isVip(profile: CustomerProfile): boolean {
    return profile.isVip || profile.tags.some((tag) => VIP_TAGS.has(tag));
  }

  isBlacklisted(profile: CustomerProfile): boolean {
    return profile.isBlacklisted || profile.tags.some((tag) => BLACKLIST_TAGS.has(tag.toLowerCase()));
  }

  async markVip(input: { customerId?: string; phone?: string }): Promise<CustomerTagRecord> {
    return this.addTag({ ...input, tag: 'vip' });
  }

  async markBlacklisted(input: { customerId?: string; phone?: string }): Promise<CustomerTagRecord> {
    return this.addTag({ ...input, tag: 'blacklist' });
  }
}
