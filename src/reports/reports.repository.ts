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

    const { name, age, blood_type, gender } = updatedPatientInfo;
    if (name) report.name = name;
    if (age) report.age = age;
    if (blood_type) report.blood_type = blood_type;
    if (gender) report.gender = gender;
    console.log('report: ', report);
    return await report.save();
  }

  async updateReportBeingSent(report_id: number) {
    const report = await this.findOne({
      where: { report_id },
    });
    report.is_sent = true;
    return await report.save();
  }

  // hospital 조회시 사용하는 메서드
  // async userLocation(report_id: number) {
  //   //사용자 위치(단일)
  //   const report = await this.findOne({
  //     where: { report_id },
  //   });

  //   return [report.latitude, report.longitude];
  // }

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
}
