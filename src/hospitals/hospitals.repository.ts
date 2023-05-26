import { Repository, DataSource } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Hospitals } from './hospitals.entity';
import { EntityManager } from 'typeorm';

@Injectable()
export class HospitalsRepository extends Repository<Hospitals> {
  constructor(private dataSource: DataSource) {
    super(Hospitals, dataSource.createEntityManager());
  }

  async getHospitals(): Promise<Hospitals[]> {
    return await this.find();
  }

  async findHospital(hospital_id: number): Promise<Hospitals> {
    return await this.findOne({ where: { hospital_id } });
  }

  async updateAvailableBeds(
    hospital_id: number,
    entityManage: EntityManager,
  ): Promise<void> {
    await entityManage.update(
      Hospitals,
      { hospital_id },
      {
        available_beds: () => 'available_beds - 1',
      },
    );
  }
}
