import { Repository, DataSource } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Hospitals } from './hospitals.entity';

@Injectable()
export class HospitalsRepository extends Repository<Hospitals> {
  constructor(private dataSource: DataSource) {
    super(Hospitals, dataSource.createEntityManager());
  }

  async getHospitals(): Promise<Hospitals[]> {
    return await this.find();
  }
}
