import { Module } from '@nestjs/common';
import { CustomerCrmModule } from '../../../application/crm/customer-crm.module';
import { AuthModule } from '../auth/auth.module';
import { AdminCrmController } from './crm.controller';

@Module({
  imports: [CustomerCrmModule, AuthModule],
  controllers: [AdminCrmController],
})
export class CrmModule {}
