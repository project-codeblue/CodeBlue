import { Injectable } from '@nestjs/common';
import { Patients } from './patients.entity';
import { Repository, DataSource } from 'typeorm';
import { CreatePatientDto } from './dto/create-patient.dto';

@Injectable()
export class PatientsRepository extends Repository<Patients> {
  constructor(private dataSource: DataSource) {
    super(Patients, dataSource.createEntityManager());
  }

  async createPatientInfo(
    createPatientInfo: CreatePatientDto,
  ) {
    console.log('createPatientInfo', createPatientInfo);
    // const patient = this.create(...createPatientInfo);
    // return this.save(patient);
  }
}
