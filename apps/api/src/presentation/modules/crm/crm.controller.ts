import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { CustomerCrmService } from '../../../application/crm/customer-crm.service';
import { AuthGuard } from '../../guards/auth.guard';
import { RequirePermissions } from '../../decorators/permissions.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import type { AuthUser } from '../../../application/auth/auth.service';

class CustomerNoteDto {
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsString()
  @MaxLength(5000)
  note!: string;
}

class CustomerTagDto {
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsString()
  @MaxLength(100)
  tag!: string;
}

@Controller('admin/crm')
@UseGuards(AuthGuard)
export class AdminCrmController {
  constructor(@Inject(CustomerCrmService) private readonly crmService: CustomerCrmService) {}

  @Get('customers/by-phone/:phone')
  @RequirePermissions('customers:read')
  async getByPhone(@Param('phone') phone: string) {
    const data = await this.crmService.getProfileByPhone(phone);
    return { success: true, data };
  }

  @Get('customers/:customerId')
  @RequirePermissions('customers:read')
  async getByCustomerId(@Param('customerId') customerId: string) {
    const data = await this.crmService.getProfileByCustomerId(customerId);
    return { success: true, data };
  }

  @Post('notes')
  @RequirePermissions('customers:write')
  async addNote(@Body() dto: CustomerNoteDto, @CurrentUser() user: AuthUser) {
    const data = await this.crmService.addNote({
      ...dto,
      authorId: user.id,
    });
    return { success: true, data };
  }

  @Post('tags')
  @RequirePermissions('customers:write')
  async addTag(@Body() dto: CustomerTagDto) {
    const data = await this.crmService.addTag(dto);
    return { success: true, data };
  }

  @Delete('tags/:tagId')
  @RequirePermissions('customers:write')
  async removeTag(@Param('tagId') tagId: string) {
    await this.crmService.removeTag(tagId);
    return { success: true };
  }

  @Get('tags/:tag/list')
  @RequirePermissions('customers:read')
  async listByTag(@Param('tag') tag: string) {
    const data = await this.crmService.listByTag(tag);
    return { success: true, data };
  }
}
