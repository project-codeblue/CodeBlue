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
  ): Promise<Patients> {
    const { patient_rrn, name, gender } = createPatientInfo;
    const patient = this.create({
      patient_rrn: patient_rrn.toString(),
      name,
      gender,
    });

    return this.save(patient);
  }
}
