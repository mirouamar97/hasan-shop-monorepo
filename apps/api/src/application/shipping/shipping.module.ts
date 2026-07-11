import { Module } from '@nestjs/common';
import { SecurityModule } from '../../infrastructure/security/security.module';
import { CarrierRegistryService } from './carrier-registry.service';
import { ShippingService } from './shipping.service';

@Module({
  imports: [SecurityModule],
  providers: [CarrierRegistryService, ShippingService],
  exports: [CarrierRegistryService, ShippingService],
})
export class ShippingModule {}
