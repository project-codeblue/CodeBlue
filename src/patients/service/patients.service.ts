import { Injectable, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';
import { ReportsRepository } from '../../reports/reports.repository';
import { PatientsRepository } from '../patients.repository';
import { CreatePatientDto } from '../dto/create-patient.dto';
import { Patients } from '../patients.entity';

@Injectable()
export class PatientsService {
  constructor(
    private readonly patientsRepository: PatientsRepository,
    private readonly reportsRepository: ReportsRepository,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {}

  // 환자 정보 입력
  async createPatientInfo(
    report_id: number,
    createPatientInfo: CreatePatientDto,
  ): Promise<Patients> {
    const createdPatientInfo = await this.entityManager.transaction(
      'READ COMMITTED',
      async () => {
        try {
          const report = await this.reportsRepository.findReport(report_id);

          if (!report) {
            throw new NotFoundException('증상 보고서가 존재하지 않습니다.');
          }
          // 환자 row 생성
          const createdPatient =
            await this.patientsRepository.createPatientInfo(createPatientInfo);

          // 증상 보고서 row에 patient_id 추가
          report.patient_id = createdPatient.patient_id;
          await this.reportsRepository.save(report);

          return createdPatient;
        } catch (error) {
          if (error instanceof NotFoundException) {
            throw error;
          }
          throw new HttpException(
            '환자 정보 입력에 실패하였습니다.',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      },
    );
    return createdPatientInfo;
  }
}
