import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminFulfillmentController } from './fulfillment.controller';

const mockReq = { ip: '127.0.0.1', headers: {} } as never;
const mockUser = { id: 'u1' } as never;

describe('AdminFulfillmentController', () => {
  let service: {
    getWorkflow: ReturnType<typeof vi.fn>;
    initializeForOrder: ReturnType<typeof vi.fn>;
    startTask: ReturnType<typeof vi.fn>;
    completeTask: ReturnType<typeof vi.fn>;
    skipTask: ReturnType<typeof vi.fn>;
  };
  let auditService: { log: ReturnType<typeof vi.fn> };
  let controller: AdminFulfillmentController;

  beforeEach(() => {
    service = {
      getWorkflow: vi.fn().mockResolvedValue([]),
      initializeForOrder: vi.fn().mockResolvedValue([]),
      startTask: vi.fn().mockResolvedValue({}),
      completeTask: vi.fn().mockResolvedValue({}),
      skipTask: vi.fn().mockResolvedValue({}),
    };
    auditService = { log: vi.fn().mockResolvedValue(undefined) };
    controller = new AdminFulfillmentController(service as never, auditService as never);
  });

  it('covers fulfillment actions', async () => {
    await expect(controller.getWorkflow('o1')).resolves.toMatchObject({ success: true });
    await expect(controller.initialize('o1', mockReq, mockUser)).resolves.toMatchObject({ success: true });
    await expect(
      controller.startStage('o1', 'picking', {}, mockReq, mockUser),
    ).resolves.toMatchObject({ success: true });
    await expect(
      controller.completeStage('o1', 'packing', { note: 'done' }, mockUser, mockReq),
    ).resolves.toMatchObject({ success: true });
    await expect(controller.skipStage('o1', 'quality_check', mockUser, mockReq)).resolves.toMatchObject({
      success: true,
    });
    expect(auditService.log).toHaveBeenCalled();
  });

  it('rejects invalid fulfillment stage', async () => {
    await expect(controller.startStage('o1', 'bad-stage' as never, {}, mockReq, mockUser)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
