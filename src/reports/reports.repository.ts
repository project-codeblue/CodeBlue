import { Repository, DataSource } from 'typeorm';
import { Reports } from './reports.entity';
import { Injectable } from '@nestjs/common';
import { UpdateReportDto } from './dto/update-report.dto';
import { CreateReportDto } from './dto/create-report.dto';
import { Hospitals } from 'src/hospitals/hospitals.entity';

@Injectable()
export class ReportsRepository extends Repository<Reports> {
  constructor(private dataSource: DataSource) {
    super(Reports, dataSource.createEntityManager());
  }

  async createReport(createReportDto: CreateReportDto, emergencyLevel: number) {
    const report = this.create({
      ...createReportDto,
      symptom_level: emergencyLevel,
    });
    return this.save(report);
  }

  async getReportDetails(report_id): Promise<Reports> {
    return await this.findOne({
      where: { report_id },
      relations: ['hospital'],
    }).then((report) => {
      const { hospital_id, name, address, phone } = report.hospital;
      const transformedReport = Object.assign(new Reports(), report);
      transformedReport.hospital = {
        hospital_id,
        name,
        address,
        phone,
      } as Hospitals;
      return transformedReport;
    });
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

  async addTargetHospital(
    report_id: number,
    hospital_id: number,
  ): Promise<void> {
    const report = await this.findOne({
      where: { report_id },
    });

    report.hospital_id = hospital_id;
    await report.save();
  }
}
