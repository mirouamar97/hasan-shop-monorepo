import { Body, Controller, Get, Put, UseGuards, Inject, Req } from '@nestjs/common';
import { IsArray, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { SettingsService } from '../../../application/settings/settings.service';
import { AuthGuard } from '../../guards/auth.guard';
import { RequirePermissions } from '../../decorators/permissions.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import type { AuthUser } from '../../../application/auth/auth.service';
import type { Request } from 'express';
import { AuditService } from '../../../application/audit/audit.service';
import { buildAuditContext } from '../../helpers/audit-context';

class StoreSettingDto {
  @IsString()
  key!: string;

  @IsString()
  value!: string;
}

class UpdateSettingsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StoreSettingDto)
  settings!: StoreSettingDto[];
}

@Controller('settings')
export class SettingsController {
  constructor(
    @Inject(SettingsService) private readonly settingsService: SettingsService,
    @Inject(AuditService) private readonly auditService: AuditService,
  ) {}

  @Get('public')
  async getPublic() {
    const data = await this.settingsService.getPublicSettings();
    return { success: true, data };
  }

  @Get()
  @UseGuards(AuthGuard)
  @RequirePermissions('settings:read')
  async getAll() {
    const data = await this.settingsService.getAll();
    return { success: true, data };
  }

  @Put()
  @UseGuards(AuthGuard)
  @RequirePermissions('settings:write')
  async update(
    @Body() dto: UpdateSettingsDto,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    const data = await this.settingsService.updateSettings(dto.settings, user.id);
    await this.auditService.log(
      buildAuditContext(req, user, 'update', 'settings', undefined, {
        keys: dto.settings.map((s) => s.key),
      }),
    );
    return { success: true, data };
  }
}
