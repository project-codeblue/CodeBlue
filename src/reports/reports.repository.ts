import { Repository, DataSource, EntityManager } from 'typeorm';
import { Reports } from './reports.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ReportsRepository extends Repository<Reports> {
  constructor(private dataSource: DataSource) {
    super(Reports, dataSource.createEntityManager());
  }

  async findReport(report_id: number): Promise<Reports> {
    return await this.findOne({
      where: { report_id },
    });
  }

  async updatePatientLocation(
    report_id: number,
    longitude: number,
    latitude: number,
  ): Promise<void> {
    await this.update(
      { report_id },
      {
        longitude,
        latitude,
      },
    );
  }

  async updateReportBeingSent(
    report_id: number,
    entityManager: EntityManager,
  ): Promise<void> {
    await entityManager.update(
      Reports,
      { report_id },
      {
        is_sent: true,
      },
    );
  }
}
