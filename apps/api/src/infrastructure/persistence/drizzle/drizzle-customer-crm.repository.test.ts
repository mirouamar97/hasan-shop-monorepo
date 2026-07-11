import { NotFoundException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { DrizzleCustomerCrmRepository } from './drizzle-customer-crm.repository';
import { createMockDatabase } from '../../../test/helpers/mock-database';

describe('DrizzleCustomerCrmRepository', () => {
  it('covers profile, note, tag, remove and listByTag methods', async () => {
    const mock = createMockDatabase();
    const repo = new DrizzleCustomerCrmRepository(mock.db as never);

    mock.queueResults(
      [{ id: 'c1', phone: '0555', email: 'x@y.z', firstName: 'Ali', lastName: 'Ben' }],
      [{ id: 'o1', orderNumber: 'HS-1', status: 'confirmed', total: '1000', createdAt: new Date(), shippingFirstName: 'Ali', shippingLastName: 'Ben' }],
      [{ id: 'n1', customerId: 'c1', phone: null, note: 'VIP', authorId: 'u1', createdAt: new Date() }],
      [{ id: 't1', customerId: 'c1', phone: null, tag: 'vip', createdAt: new Date() }],
      [],
      [{ firstName: 'Admin', lastName: 'User' }],
      [{ id: 'c1', phone: '0555', email: 'x@y.z', firstName: 'Ali', lastName: 'Ben' }],
      [{ id: 'o1', orderNumber: 'HS-1', status: 'confirmed', total: '1000', createdAt: new Date(), shippingFirstName: 'Ali', shippingLastName: 'Ben' }],
      [],
      [],
      [],
      [{ id: 'n1', customerId: 'c1', phone: null, note: 'VIP', authorId: null, createdAt: new Date() }],
      [{ id: 't1', customerId: 'c1', phone: null, tag: 'vip', createdAt: new Date() }],
      [],
      [{ id: 't2', customerId: 'c1', phone: null, tag: 'vip', createdAt: new Date() }],
      [{ id: 'c1', phone: '0555', email: 'x@y.z', firstName: 'Ali', lastName: 'Ben' }],
      [{ id: 'o1', orderNumber: 'HS-1', status: 'confirmed', total: '1000', createdAt: new Date(), shippingFirstName: 'Ali', shippingLastName: 'Ben' }],
      [],
      [],
      [],
    );

    await expect(repo.getProfileByPhone('0555')).resolves.toMatchObject({ phone: '0555' });
    await expect(repo.getProfileByCustomerId('c1')).resolves.toMatchObject({ id: 'c1' });
    await expect(repo.addNote({ customerId: 'c1', note: 'VIP' })).resolves.toMatchObject({ id: 'n1' });
    await expect(repo.addTag({ customerId: 'c1', tag: 'VIP' })).resolves.toMatchObject({ tag: 'vip' });
    await expect(repo.removeTag('t1')).resolves.toBeUndefined();
    await expect(repo.listByTag('vip')).resolves.toHaveLength(1);
  });

  it('throws on missing customer id lookup', async () => {
    const mock = createMockDatabase();
    const repo = new DrizzleCustomerCrmRepository(mock.db as never);
    mock.queueResult([]);
    await expect(repo.getProfileByCustomerId('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
