import { Injectable, NotFoundException } from '@nestjs/common';
import { ReportsRepository } from '../reports.repository';
import { Reports } from '../reports.entity';
import { UpdateReportDto } from '../dto/update-report.dto';

@Injectable()
export class ReportsService {
  constructor(private reportsRepository: ReportsRepository) {}

  async updatePatientLocation(
    report_id: number,
    updatedLocation: UpdateReportDto,
  ): Promise<void> {
    const { longitude, latitude } = updatedLocation;

    const report = await this.reportsRepository.findReport(report_id);

    if (!report) {
      throw new NotFoundException('증상 보고서가 존재하지 않습니다.');
    }

    await this.reportsRepository.updatePatientLocation(
      report_id,
      longitude,
      latitude,
    );
  }
}
