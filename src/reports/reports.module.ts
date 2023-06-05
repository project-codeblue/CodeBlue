import { Module } from '@nestjs/common';
import { ReportsController } from './controller/reports.controller';
import { ReportsService } from './service/reports.service';
import { ReportsRepository } from './reports.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reports } from './reports.entity';
import { KakaoMapService } from '../commons/providers/kakao-map.service';
import { PatientsRepository } from '../patients/patients.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Reports])],
  controllers: [ReportsController],
  providers: [
    ReportsService,
    ReportsRepository,
    KakaoMapService,
    PatientsRepository,
  ],
  exports: [ReportsService, ReportsRepository],
})
export class ReportsModule {}
