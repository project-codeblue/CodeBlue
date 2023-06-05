import { Repository, DataSource } from 'typeorm';
import { Reports } from './reports.entity';
import { Injectable } from '@nestjs/common';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
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

  async getReportDetails(report_id: number): Promise<Reports> {
    // const results = await this.findOne({
    //   where: { report_id },
    //   relations: ['hospital'],
    // }).then((report) => {
    const results = await this.query(
      `
        SELECT * FROM reports r LEFT JOIN hospitals h
        ON r.hospital_id = h.hospital_id
        WHERE r.report_id = ${report_id};
      `,
    ).then((report) => {
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
    return results;
  }

  async findReport(report_id: number): Promise<Reports> {
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

  async deleteTargetHospital(report_id: number): Promise<void> {
    const report = await this.findOne({
      where: { report_id },
    });

    report.hospital_id = null;
    await report.save();
  }

  async getReportWithPatientInfo(report_id: number): Promise<Reports> {
    const report = await this.findOne({
      where: { report_id },
      relations: ['patient'],
    });
    return report;
  }

  async addPatientIdInReport(report_id: number, patient_id: number) {
    const report = await this.findOne({ where: { report_id } });
    report.patient_id = patient_id;
    await this.save(report);
  }
}
