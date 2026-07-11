import { Module } from '@nestjs/common';
import { CustomerCrmService } from './customer-crm.service';

@Module({
  providers: [CustomerCrmService],
  exports: [CustomerCrmService],
})
export class CustomerCrmModule {}
