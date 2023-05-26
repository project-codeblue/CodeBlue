import {
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HospitalsRepository } from './../../hospitals/hospitals.repository';
import { ReportsRepository } from '../../reports/reports.repository';
import { EntityManager } from 'typeorm';

@Injectable()
export class RequestsService {
  constructor(
    private readonly reportsRepository: ReportsRepository,
    private readonly hospitalsRepository: HospitalsRepository,
    private readonly entityManager: EntityManager,
  ) {}

  getRequests() {
    return 'All requests';
  }

  async createRequest(report_id: number, hospital_id: number): Promise<void> {
    await this.entityManager.transaction(
      'READ COMMITTED',
      async (entityManager) => {
        try {
          const hospital = await this.hospitalsRepository.findHospital(
            hospital_id,
          );
          if (!hospital) {
            throw new NotFoundException('병원이 존재하지 않습니다.');
          }

          const report = await this.reportsRepository.findReport(report_id);
          if (!report) {
            throw new NotFoundException('증상 보고서가 존재하지 않습니다.');
          }
          if (report.is_sent) {
            throw new HttpException(
              '이미 전송된 증상 보고서입니다.',
              HttpStatus.BAD_REQUEST,
            );
          }

          const availableBeds = hospital.available_beds;
          if (availableBeds === 0) {
            throw new HttpException(
              '병원 이송 신청이 마감되었습니다. 다른 병원에 신청하시길 바랍니다.',
              HttpStatus.SERVICE_UNAVAILABLE,
            );
          }

          // 해당 report의 is_sent를 true로 변경
          await this.reportsRepository.updateReportBeingSent(
            report_id,
            entityManager,
          );

          // 해당 병원의 available_beds를 1 감소
          await this.hospitalsRepository.updateAvailableBeds(
            hospital_id,
            entityManager,
          );
        } catch (error) {
          throw new HttpException(
            '증상 보고서 전송에 실패하였습니다.',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      },
    );
  }
}
