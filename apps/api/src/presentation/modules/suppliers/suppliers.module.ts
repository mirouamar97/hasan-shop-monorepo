import { Module } from '@nestjs/common';
import { SuppliersModule as SuppliersAppModule } from '../../../application/suppliers/suppliers.module';
import { AuditModule } from '../../../application/audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { AdminSuppliersController } from './suppliers.controller';

@Module({
  imports: [SuppliersAppModule, AuthModule, AuditModule],
  controllers: [AdminSuppliersController],
})
export class SuppliersModule {}
