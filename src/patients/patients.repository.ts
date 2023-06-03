import { Injectable } from '@nestjs/common';
import { Patients } from './patients.entity';
import { Repository, DataSource } from 'typeorm';

@Injectable()
export class PatientsRepository extends Repository<Patients> {
  constructor(private dataSource: DataSource) {
    super(Patients, dataSource.createEntityManager());
  }

  async getPatients(): Promise<Patients[]> {
    const patients = await this.find();
    console.log('patients: ', patients);
    return await this.find();
  }
}
