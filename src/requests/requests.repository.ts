import { Repository, DataSource } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Reports } from '../reports/reports.entity';

@Injectable()
export class RequestsRepository extends Repository<Reports> {
  constructor(private dataSource: DataSource) {
    super(Reports, dataSource.createEntityManager());
  }

  async getAllRequests(): Promise<Reports[]> {
    const allReports = await this.find();
    return allReports;
  }
}
