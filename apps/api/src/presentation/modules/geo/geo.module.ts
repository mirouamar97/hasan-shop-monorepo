import { Module } from '@nestjs/common';
import { GeoController } from './geo.controller';
import { GeoService } from '../../../application/geo/geo.service';

@Module({
  controllers: [GeoController],
  providers: [GeoService],
  exports: [GeoService],
})
export class GeoModule {}
