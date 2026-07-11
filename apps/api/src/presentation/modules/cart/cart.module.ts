import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartModule as CartAppModule } from '../../../application/cart/cart.module';

@Module({
  imports: [CartAppModule],
  controllers: [CartController],
})
export class CartModule {}
