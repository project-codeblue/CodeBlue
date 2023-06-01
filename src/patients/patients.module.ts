import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Patients } from './patients.entity';
import { PatientsController } from './controller/patients.controller';
import { PatientsService } from './service/patients.service';
import { PatientsRepository } from './patients.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Patients])],
  controllers: [PatientsController],
  providers: [PatientsService, PatientsRepository],
  exports: [PatientsService, PatientsRepository],
})
export class PatientsModule {}
