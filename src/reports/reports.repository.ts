import { Repository, DataSource } from 'typeorm';
import { Reports } from './reports.entity';
import { Injectable } from '@nestjs/common';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';

@Injectable()
export class ReportsRepository extends Repository<Reports> {
  constructor(private dataSource: DataSource) {
    super(Reports, dataSource.createEntityManager());
  }

  // 증상 보고서 생성
  async createReport(createReportDto: CreateReportDto): Promise<Reports> {
    const { ...createReportDtoWithOutPatient } = createReportDto;
    const report = this.create({
      ...createReportDtoWithOutPatient,
    });
    return this.save(report);
  }

  // 증상 보고서 상세 조회 (보고서 + 환자 정보)
  async getReportwithPatientInfo(report_id: number): Promise<object> {
    const report = await this.query(
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
            p.name AS patient_name,
            p.patient_rrn,
            p.gender
          FROM reports r
          LEFT JOIN patients p ON r.patient_id = p.patient_id
          WHERE r.report_id = ${report_id};      
        `,
    );
    return report[0];
  }

  // 증상 보고서 상세 조회 (보고서 + 병원 정보)
  async getReportwithHospitalInfo(report_id: number): Promise<object> {
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
            h.name AS hospital_name,
            h.address,
            h.phone
          FROM reports r
          LEFT JOIN hospitals h ON r.hospital_id = h.hospital_id
          WHERE r.report_id = ${report_id};      
        `,
    );
    return result[0];
  }

  // 증상 보고서 상세 조회 (보고서 + 환자 정보 + 병원 정보)
  async getReportwithPatientAndHospitalInfo(
    report_id: number,
  ): Promise<object> {
    const result = await this.query(
      `
          SELECT
            r.report_id,
            p.name AS patient_name,
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
            h.name AS hospital_name,
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

  // 해당 report_id 의 증상 보고서 조회
  async findReport(report_id: number): Promise<Reports | undefined> {
    return await this.findOne({
      where: { report_id },
    });
  }

  // 해당 report_id 의 증상 보고서 수정
  async updateReport(
    report_id: number,
    updatedReport: UpdateReportDto,
  ): Promise<Reports> {
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

  // 해당 report_id의 증상보고서를 병원 이송 신청
  async updateReportBeingSent(report_id: number): Promise<Reports> {
    const report = await this.findOne({
      where: { report_id },
    });
    report.is_sent = true;
    return await report.save();
  }

  // 해당 report_id의 증상보고서를 병원 이송 철회
  async updateReportBeingNotSent(report_id: number): Promise<Reports> {
    const report = await this.findOne({
      where: { report_id },
    });
    report.is_sent = false;
    return await report.save();
  }

  // 모든 이송 신청 증상보고서 조회
  async getAllRequests(): Promise<Reports[]> {
    return await this.find({ where: { is_sent: true } });
  }

  // 해당 report_id의 증상보고서를 해당 hospitals_id의 병원으로 이송 신청
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

  // 해당 report_id의 증상보고서를 해당 hospitals_id의 병원으로 이송 철회
  async deleteTargetHospital(report_id: number): Promise<void> {
    const report = await this.findOne({
      where: { report_id },
    });

    report.hospital_id = null;
    await report.save();
  }

  // 해당 report_id의 증상보고서에 환자 정보 추가
  async addPatientIdInReport(
    report_id: number,
    patient_id: number,
  ): Promise<void> {
    const report = await this.findOne({ where: { report_id } });
    report.patient_id = patient_id;
    await this.save(report);
  }
}
