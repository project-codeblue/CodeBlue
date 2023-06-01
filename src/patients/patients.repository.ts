import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Patients } from '../patients/patients.entity';
import { DataSource } from 'typeorm';

@Injectable()
export class PatientsRepository extends Repository<Patients> {
  constructor(private dataSource: DataSource) {
    super(Patients, dataSource.createEntityManager());
  }
  //환자 정보 저장
  async savePatientInfo(patientInfo: Patients): Promise<Patients> {
    return await this.save(patientInfo);
  }
}
