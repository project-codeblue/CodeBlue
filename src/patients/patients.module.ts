import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Patients } from './patients.entity';
import { PatientsRepository } from './patients.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Patients])],
  providers: [PatientsRepository],
  exports: [PatientsRepository],
})
export class PatientsModule {}
