import { NotFoundException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { DrizzleNotificationRepository } from './drizzle-notification.repository';
import { createMockDatabase } from '../../../test/helpers/mock-database';

describe('DrizzleNotificationRepository', () => {
  it('gets, lists, upserts and logs notifications', async () => {
    const mock = createMockDatabase();
    const repo = new DrizzleNotificationRepository(mock.db as never);
    const row = {
      id: 't1',
      slug: 'order-confirmed',
      channel: 'email',
      name: 'Order confirmed',
      subject: 'Order',
      body: 'Hello',
      isActive: true,
    };

    mock.queueResults([row], [row], [row], [row], []);

    await expect(repo.getTemplate('order-confirmed')).resolves.toMatchObject({ id: 't1' });
    await expect(repo.listTemplates()).resolves.toHaveLength(1);
    await expect(repo.upsertTemplate({ ...row })).resolves.toMatchObject({ id: 't1' });
    await expect(repo.upsertTemplate({ ...row, id: undefined })).resolves.toMatchObject({ id: 't1' });
    await expect(
      repo.logNotification({ channel: 'email', recipient: 'x@y.z', status: 'sent' }),
    ).resolves.toBeUndefined();
  });

  it('throws when update/upsert returning no row', async () => {
    const updateMock = createMockDatabase();
    const updateRepo = new DrizzleNotificationRepository(updateMock.db as never);
    updateMock.queueResult([]);
    await expect(
      updateRepo.upsertTemplate({
        id: 'missing',
        slug: 's',
        channel: 'email',
        name: 'n',
        subject: 'sub',
        body: 'b',
        isActive: true,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    const insertMock = createMockDatabase();
    const insertRepo = new DrizzleNotificationRepository(insertMock.db as never);
    insertMock.queueResult([]);
    await expect(
      insertRepo.upsertTemplate({
        slug: 's',
        channel: 'email',
        name: 'n',
        subject: 'sub',
        body: 'b',
        isActive: true,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
