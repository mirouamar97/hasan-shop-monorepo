import { Body, Controller, Get, Put, Param, UseGuards, Inject } from '@nestjs/common';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import type { INotificationRepository } from '../../../domain/repositories/cart.repository';
import { NOTIFICATION_REPOSITORY } from '../../../domain/repositories/tokens';
import { AuthGuard } from '../../guards/auth.guard';
import { RequirePermissions } from '../../decorators/permissions.decorator';

class UpsertTemplateDto {
  @IsString()
  @MaxLength(80)
  slug!: string;

  @IsString()
  channel!: 'email' | 'whatsapp' | 'sms';

  @IsString()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  subject?: string;

  @IsString()
  body!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

@Controller('admin/notification-templates')
@UseGuards(AuthGuard)
export class AdminNotificationTemplatesController {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY) private readonly notificationRepo: INotificationRepository,
  ) {}

  @Get()
  @RequirePermissions('settings:read')
  async list() {
    const data = await this.notificationRepo.listTemplates();
    return { success: true, data };
  }

  @Put(':slug')
  @RequirePermissions('settings:write')
  async upsert(@Param('slug') slug: string, @Body() dto: UpsertTemplateDto) {
    const data = await this.notificationRepo.upsertTemplate({
      slug,
      channel: dto.channel,
      name: dto.name,
      subject: dto.subject ?? null,
      body: dto.body,
      isActive: dto.isActive ?? true,
    });
    return { success: true, data };
  }
}
