import { NotFoundException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { DrizzleFulfillmentRepository } from './drizzle-fulfillment.repository';
import { createMockDatabase } from '../../../test/helpers/mock-database';

describe('DrizzleFulfillmentRepository', () => {
  it('covers lifecycle operations for tasks', async () => {
    const mock = createMockDatabase();
    const repo = new DrizzleFulfillmentRepository(mock.db as never);
    const task = {
      id: 't1',
      orderId: 'o1',
      stage: 'picking',
      status: 'completed',
      assignedTo: null,
      barcode: null,
      qrCodeData: null,
      note: null,
      startedAt: null,
      completedAt: new Date(),
      completedBy: 'u1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mock.queueResults([], [], [task], [task], [task], [task], [task], [task, { ...task, stage: 'packing' }]);

    await expect(repo.initializeForOrder('o1')).resolves.toHaveLength(1);
    await expect(repo.findByOrderId('o1')).resolves.toHaveLength(1);
    await expect(repo.findTask('o1', 'picking')).resolves.toMatchObject({ id: 't1' });
    await expect(repo.startTask('o1', 'picking')).resolves.toMatchObject({ id: 't1' });
    await expect(repo.completeTask('o1', 'picking', 'u1')).resolves.toMatchObject({ id: 't1' });
    await expect(repo.skipTask('o1', 'picking', 'u1')).resolves.toMatchObject({ id: 't1' });
    await expect(repo.isReadyToShip('o1')).resolves.toBe(false);
  });

  it('throws when task row is missing on updates', async () => {
    const mock = createMockDatabase();
    const repo = new DrizzleFulfillmentRepository(mock.db as never);
    mock.queueResult([]);
    await expect(repo.startTask('o1', 'picking')).rejects.toBeInstanceOf(NotFoundException);
  });
});
