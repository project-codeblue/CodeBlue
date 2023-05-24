import { Module } from '@nestjs/common';
import { HospitalsController } from './controller/hospitals.controller';
import { HospitalsService } from './service/hospitals.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hospitals } from './hospitals.entity';
import { HospitalsRepository } from './hospitals.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Hospitals])],
  controllers: [HospitalsController],
  providers: [HospitalsService, HospitalsRepository],
})
export class HospitalsModule {}
