import { Body, Controller, Post, UseGuards, Inject } from '@nestjs/common';
import { StorageService } from '../../../infrastructure/storage/storage.service';
import { AuthGuard } from '../../guards/auth.guard';
import { RequirePermissions } from '../../decorators/permissions.decorator';
import type { PresignedUploadDto } from './catalog.dto';
import { FileValidationService } from '../../../infrastructure/security/file-validation.service';

@Controller('admin/uploads')
@UseGuards(AuthGuard)
export class UploadsController {
  constructor(
    @Inject(StorageService) private readonly storage: StorageService,
    @Inject(FileValidationService) private readonly fileValidation: FileValidationService,
  ) {}

  @Post('presign')
  @RequirePermissions('catalog:write')
  async presign(@Body() dto: PresignedUploadDto) {
    this.fileValidation.validateUpload(dto.filename, dto.contentType, dto.sizeBytes ?? 0);
    const data = await this.storage.getPresignedUploadUrl(
      dto.filename,
      dto.contentType,
      dto.folder ?? 'products',
      3600,
      dto.sizeBytes ?? 0,
    );
    return { success: true, data };
  }
}
