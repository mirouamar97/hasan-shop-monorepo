import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { SettingsService } from '../../../application/settings/settings.service';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../../../application/audit/audit.module';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
