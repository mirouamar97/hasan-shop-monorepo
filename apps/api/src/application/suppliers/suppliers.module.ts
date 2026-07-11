import { Module } from '@nestjs/common';
import { SupplierService } from './supplier.service';

@Module({
  providers: [SupplierService],
  exports: [SupplierService],
})
export class SuppliersModule {}
