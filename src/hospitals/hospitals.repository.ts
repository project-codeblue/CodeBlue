import { Repository, DataSource } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Hospitals } from './hospitals.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Reports } from 'src/reports/reports.entity';

const DEFAULT_AVAILABLE_BEDS = 5;

@Injectable()
export class HospitalsRepository extends Repository<Hospitals> {
  constructor(
    private dataSource: DataSource,
    private reportsRepository: Repository<Reports>,
    private hospitalsRepository: Repository<Hospitals>,
  ) {
    super(Hospitals, dataSource.createEntityManager());
  }

  async getHospitals(): Promise<Hospitals[]> {
    return await this.find();
  }

  async findHospital(hospital_id: number): Promise<Hospitals> {
    return await this.findOne({ where: { hospital_id } });
  }

  async updateAvailableBeds(hospital_id: number): Promise<void> {
    await this.update(
      { hospital_id },
      {
        available_beds: () => 'available_beds - 1',
      },
    );
  }

  @Cron(CronExpression.EVERY_HOUR)
  async setDefaultAvailableBeds(): Promise<void> {
    const hospitals = await this.find();
    hospitals.forEach(async (hospital) => {
      hospital.available_beds = DEFAULT_AVAILABLE_BEDS;
      await this.save(hospital);
    });
  }

  async userLocation(report_id: number): Promise<number[]> {
    //사용자 위치(단일)
    const reports: Reports = (await this.reportsRepository.find()).find(
      (data) => data.report_id === report_id,
    );
    return [reports.latitude, reports.longitude];
  }

  async AllHospitals(): Promise<Hospitals[]> {
    //병원 위치(복수)
    return this.hospitalsRepository.find();
  }
}
