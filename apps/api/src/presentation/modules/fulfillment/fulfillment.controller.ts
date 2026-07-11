import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { FulfillmentService, FULFILLMENT_STAGES } from '../../../application/fulfillment/fulfillment.service';
import type { FulfillmentStage } from '../../../domain/repositories/fulfillment.repository';
import { AuditService } from '../../../application/audit/audit.service';
import { AuthGuard } from '../../guards/auth.guard';
import { RequirePermissions } from '../../decorators/permissions.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { buildAuditContext } from '../../helpers/audit-context';
import type { AuthUser } from '../../../application/auth/auth.service';

class StartStageDto {
  @IsOptional()
  @IsUUID()
  assignedTo?: string;
}

class CompleteStageDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

@Controller('admin/fulfillment')
@UseGuards(AuthGuard)
export class AdminFulfillmentController {
  constructor(
    @Inject(FulfillmentService) private readonly fulfillmentService: FulfillmentService,
    @Inject(AuditService) private readonly auditService: AuditService,
  ) {}

  @Get('orders/:orderId')
  @RequirePermissions('orders:read')
  async getWorkflow(@Param('orderId') orderId: string) {
    const data = await this.fulfillmentService.getWorkflow(orderId);
    return { success: true, data };
  }

  @Post('orders/:orderId/initialize')
  @RequirePermissions('orders:write')
  async initialize(
    @Param('orderId') orderId: string,
    @Req() req: Request,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.fulfillmentService.initializeForOrder(orderId);
    await this.auditService.log(buildAuditContext(req, user, 'create', 'fulfillment', orderId));
    return { success: true, data };
  }

  @Post('orders/:orderId/:stage/start')
  @RequirePermissions('orders:write')
  async startStage(
    @Param('orderId') orderId: string,
    @Param('stage') stage: FulfillmentStage,
    @Body() dto: StartStageDto,
    @Req() req: Request,
    @CurrentUser() user: AuthUser,
  ) {
    this.assertStage(stage);
    const data = await this.fulfillmentService.startTask(orderId, stage, dto.assignedTo);
    await this.auditService.log(
      buildAuditContext(req, user, 'update', 'fulfillment', orderId, { stage, action: 'start' }),
    );
    return { success: true, data };
  }

  @Post('orders/:orderId/:stage/complete')
  @RequirePermissions('orders:write')
  async completeStage(
    @Param('orderId') orderId: string,
    @Param('stage') stage: FulfillmentStage,
    @Body() dto: CompleteStageDto,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    this.assertStage(stage);
    const data = await this.fulfillmentService.completeTask(
      orderId,
      stage,
      user.id,
      dto.note,
    );
    await this.auditService.log(
      buildAuditContext(req, user, 'update', 'fulfillment', orderId, { stage, action: 'complete' }),
    );
    return { success: true, data };
  }

  @Post('orders/:orderId/:stage/skip')
  @RequirePermissions('orders:write')
  async skipStage(
    @Param('orderId') orderId: string,
    @Param('stage') stage: FulfillmentStage,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    this.assertStage(stage);
    const data = await this.fulfillmentService.skipTask(orderId, stage, user.id);
    await this.auditService.log(
      buildAuditContext(req, user, 'update', 'fulfillment', orderId, { stage, action: 'skip' }),
    );
    return { success: true, data };
  }

  private assertStage(stage: string): asserts stage is FulfillmentStage {
    if (!FULFILLMENT_STAGES.includes(stage as FulfillmentStage)) {
      throw new BadRequestException(`Invalid fulfillment stage: ${stage}`);
    }
  }
}
