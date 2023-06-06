import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Patients } from './patients.entity';
import { PatientsRepository } from './patients.repository';
import { PatientsService } from './service/patients.service';
import { PatientsController } from './controller/patients.controller';
import { ReportsRepository } from '../reports/reports.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Patients])],
  controllers: [PatientsController],
  providers: [PatientsRepository, PatientsService, ReportsRepository],
  exports: [PatientsService, PatientsRepository],
})
export class PatientsModule {}
