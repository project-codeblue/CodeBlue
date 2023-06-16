import { Repository, DataSource } from 'typeorm';
import { Reports } from './reports.entity';
import { Injectable } from '@nestjs/common';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { AgeRange, BloodType } from './reports.enum';

@Injectable()
export class ReportsRepository extends Repository<Reports> {
  constructor(private dataSource: DataSource) {
    super(Reports, dataSource.createEntityManager());
  }

  async createReport(createReportDto: CreateReportDto, emergencyLevel: number) {
    const { patient_rrn, ...createReportDtoWithOutPatient } = createReportDto;
    const report = this.create({
      ...createReportDtoWithOutPatient,
      symptom_level: emergencyLevel,
    });
    return this.save(report);
  }

  async getReportwithPatientInfo(report_id: number): Promise<Reports> {
    const report = await this.findOne({
      where: { report_id },
      relations: ['patient'],
    });
    return report;
  }

  async getReportwithHospitalInfo(report_id: number): Promise<any> {
    const result = await this.query(
      `
          SELECT
            r.report_id,
            r.symptom_level,
            r.symptoms,
            r.blood_pressure,
            r.age_range,
            r.is_sent,
            r.createdAt,
            r.updatedAt,
            r.hospital_id,
            h.address,
            h.phone
          FROM reports r
          LEFT JOIN hospitals h ON r.hospital_id = h.hospital_id
          WHERE r.report_id = ${report_id};      
        `,
    );
    return result[0];
  }

  async getReportwithPatientAndHospitalInfo(report_id: number): Promise<any> {
    const result = await this.query(
      `
          SELECT
            r.report_id,
            p.name,
            p.patient_rrn,
            p.gender,
            r.symptom_level,
            r.symptoms,
            r.blood_pressure,
            r.age_range,
            r.is_sent,
            r.createdAt,
            r.updatedAt,
            r.hospital_id,
            h.address,
            h.phone
          FROM reports r
          LEFT JOIN hospitals h ON r.hospital_id = h.hospital_id
          LEFT JOIN patients p ON r.patient_id = p.patient_id
          WHERE r.report_id = ${report_id};      
        `,
    );
    return result[0];
  }

  async findReport(report_id: number): Promise<Reports | undefined> {
    return await this.findOne({
      where: { report_id },
    });
  }

  async updateReport(report_id: number, updatedReport: UpdateReportDto) {
    const report = await this.findOne({
      where: { report_id },
    });

    // updatedReport의 필드를 하나씩 꺼내서 report에 넣어준다.
    for (const field in updatedReport) {
      if (updatedReport.hasOwnProperty(field)) {
        report[field] = updatedReport[field];
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

  async updateReportBeingNotSent(report_id: number) {
    const report = await this.findOne({
      where: { report_id },
    });
    report.is_sent = false;
    return await report.save();
  }

  async createDummyReport(
    blood_pressure: string,
    blood_type: BloodType,
    age_range: AgeRange,
    symptom_level: number,
    symptoms: string[],
  ) {
    await this.save({
      blood_pressure,
      blood_type,
      age_range,
      symptom_level,
      symptoms: `[${symptoms}]`,
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

  async deleteTargetHospital(report_id: number): Promise<void> {
    const report = await this.findOne({
      where: { report_id },
    });

    report.hospital_id = null;
    await report.save();
  }

  async addPatientIdInReport(report_id: number, patient_id: number) {
    const report = await this.findOne({ where: { report_id } });
    report.patient_id = patient_id;
    await this.save(report);
  }
}
