import { Repository, DataSource } from 'typeorm';
import { Reports } from './reports.entity';
import { Injectable } from '@nestjs/common';
import { UpdateReportDto } from './dto/update-report.dto';

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

  async updateReportPatientInfo(
    report_id: number,
    updatedPatientInfo: UpdateReportDto,
  ) {
    const report = await this.findOne({
      where: { report_id },
    });

    // updatedPatientInfo의 필드를 하나씩 꺼내서 report에 넣어준다.
    for (const field in updatedPatientInfo) {
      if (updatedPatientInfo.hasOwnProperty(field)) {
        report[field] = updatedPatientInfo[field];
      }
    }

    return await report.save();
  }

  async updateReportBeingSent(report_id: number) {
    const report = await this.findOne({
      where: { report_id },
    });
    report.is_sent = true;
    return await report.save();
  }

  async createDummyReport(
    hospital_id: number,
    patient_id: number,
    symptom_level: number,
    symptom: string[],
    latitude: number,
    longitude: number,
  ) {
    await this.save({
      hospital_id,
      patient_id,
      symptom_level,
      symptoms: `[${symptom}]`,
      latitude,
      longitude,
    });
  }

  async getAllRequests(): Promise<Reports[]> {
    return await this.find({ where: { is_sent: true } });
  }
}
