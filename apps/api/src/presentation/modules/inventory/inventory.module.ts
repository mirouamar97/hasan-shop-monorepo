import { Module } from '@nestjs/common';
import { InventoryModule as InventoryAppModule } from '../../../application/inventory/inventory.module';
import { AuditModule } from '../../../application/audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { AdminInventoryController } from './inventory.controller';

@Module({
  imports: [InventoryAppModule, AuthModule, AuditModule],
  controllers: [AdminInventoryController],
})
export class InventoryModule {}
