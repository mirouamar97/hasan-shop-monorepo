import { describe, expect, it, vi, beforeEach } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { CustomerCrmService } from './customer-crm.service';
import type {
  CustomerNoteRecord,
  CustomerProfile,
  CustomerTagRecord,
  ICustomerCrmRepository,
} from '../../domain/repositories/customer-crm.repository';

function buildProfile(overrides: Partial<CustomerProfile> = {}): CustomerProfile {
  return {
    id: 'cust-1',
    phone: '0555123456',
    email: 'ali@example.com',
    firstName: 'Ali',
    lastName: 'Ben',
    orderCount: 3,
    totalSpent: 15000,
    tags: [],
    isVip: false,
    isBlacklisted: false,
    notes: [],
    timeline: [],
    ...overrides,
  };
}

describe('CustomerCrmService', () => {
  let crmRepo: ICustomerCrmRepository;
  let service: CustomerCrmService;

  beforeEach(() => {
    crmRepo = {
      getProfileByPhone: vi.fn(),
      getProfileByCustomerId: vi.fn(),
      addNote: vi.fn(),
      addTag: vi.fn(),
      removeTag: vi.fn(),
      listByTag: vi.fn(),
    };
    service = new CustomerCrmService(crmRepo);
  });

  it('fetches profile by phone', async () => {
    const profile = buildProfile();
    vi.mocked(crmRepo.getProfileByPhone).mockResolvedValue(profile);

    const result = await service.getProfileByPhone('0555123456');

    expect(result).toEqual(profile);
  });

  it('rejects note without customerId or phone', () => {
    expect(() => service.addNote({ note: 'Test note' })).toThrow(BadRequestException);
  });

  it('rejects empty note text', () => {
    expect(() => service.addNote({ customerId: 'cust-1', note: '   ' })).toThrow(
      BadRequestException,
    );
  });

  it('adds note through repository', async () => {
    const note: CustomerNoteRecord = {
      id: 'note-1',
      customerId: 'cust-1',
      phone: null,
      note: 'VIP customer',
      authorId: 'admin-1',
      createdAt: new Date(),
    };
    vi.mocked(crmRepo.addNote).mockResolvedValue(note);

    const result = await service.addNote({
      customerId: 'cust-1',
      note: 'VIP customer',
      authorId: 'admin-1',
    });

    expect(result).toEqual(note);
  });

  it('rejects tag without customerId or phone', () => {
    expect(() => service.addTag({ tag: 'vip' })).toThrow(BadRequestException);
  });

  it('detects VIP from profile flag or tag', () => {
    expect(service.isVip(buildProfile({ isVip: true }))).toBe(true);
    expect(service.isVip(buildProfile({ tags: ['vip'] }))).toBe(true);
    expect(service.isVip(buildProfile())).toBe(false);
  });

  it('detects blacklist from profile flag or tag', () => {
    expect(service.isBlacklisted(buildProfile({ isBlacklisted: true }))).toBe(true);
    expect(service.isBlacklisted(buildProfile({ tags: ['BLACKLIST'] }))).toBe(true);
    expect(service.isBlacklisted(buildProfile())).toBe(false);
  });

  it('marks customer as VIP via tag', async () => {
    const tag: CustomerTagRecord = {
      id: 'tag-1',
      customerId: 'cust-1',
      phone: null,
      tag: 'vip',
      createdAt: new Date(),
    };
    vi.mocked(crmRepo.addTag).mockResolvedValue(tag);

    const result = await service.markVip({ customerId: 'cust-1' });

    expect(result).toEqual(tag);
    expect(crmRepo.addTag).toHaveBeenCalledWith({ customerId: 'cust-1', tag: 'vip' });
  });

  it('lists customers by tag', async () => {
    const profiles = [buildProfile({ tags: ['vip'] })];
    vi.mocked(crmRepo.listByTag).mockResolvedValue(profiles);

    const result = await service.listByTag('vip');

    expect(result).toEqual(profiles);
  });
});
