import { Injectable } from '@nestjs/common';
import { ReportsRepository } from '../reports.repository';
import { Reports } from '../reports.entity';

@Injectable()
export class ReportsService {
  constructor(private reportsRepository: ReportsRepository) {}

  getAllReports(): Promise<Reports[]> {
    return this.reportsRepository.getAllReports();
  }
}
