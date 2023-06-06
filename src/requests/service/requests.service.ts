import {
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HospitalsRepository } from './../../hospitals/hospitals.repository';
import { ReportsRepository } from '../../reports/reports.repository';
import { EntityManager, Brackets } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';
import { Reports } from '../../reports/reports.entity';
import * as date from 'date-and-time';

@Injectable()
export class RequestsService {
  constructor(
    private readonly reportsRepository: ReportsRepository,
    private readonly hospitalsRepository: HospitalsRepository,
    @InjectEntityManager() private readonly entityManager: EntityManager, // 트랜젝션을 위해 DI
  ) {}

  async getAllRequests(): Promise<Reports[]> {
    // is_sent === true인 증상 보고서만 가져옴
    return await this.reportsRepository.getAllRequests();
  }

  // 검색 키워드: 날짜, 증상, 증상도, 이름, 지역
  async getSearchRequests(queries: object): Promise<Reports[]> {
    try {
      const query = this.reportsRepository
        .createQueryBuilder('reports')
        .leftJoin('reports.patient', 'patient')
        .leftJoin('reports.hospital', 'hospital')
        .select([
          'reports.report_id',
          'reports.symptom_level',
          'reports.symptoms',
          'reports.createdAt',
          'patient.name',
          'hospital.name',
          'hospital.phone',
          'hospital.emogList',
        ])
        .where('1 = 1')
        .where('is_sent = 1');

      if (queries['date']) {
        // URL 쿼리에 날짜가 존재하면 실행
        const dates: string[] = queries['date'].split('~'); // '~' 를 기준으로 날짜 범위 구분

        const regex = /^\d{4}-\d{2}-\d{2}$/;
        for (const date of dates) {
          if (!regex.test(date)) {
            throw new Error('날짜 형식이 맞지 않습니다');
          }
        }

        if (dates.length === 1) {
          const temp = new Date(dates[0]);
          temp.setDate(temp.getDate() + 1);
          dates.push(date.format(temp, 'YYYY-MM-DD'));
        }

        await query.andWhere(
          new Brackets((qb) => {
            qb.andWhere(
              `reports.createdAt BETWEEN '${dates[0]}' AND '${dates[1]}'`,
            );
          }),
        );
      }

      if (queries['symptoms']) {
        // URL 쿼리에 증상이 존재하면 실행
        const symptoms = queries['symptoms'].split(','); // 쉼표를 기준으로 증상 구분
        symptoms.forEach((symptom: string) => {
          query.andWhere(`reports.symptoms LIKE '%${symptom}%'`);
        });
      }

      if (queries['symptom_level']) {
        // URL 쿼리에 증상도가 존재하면 실행
        query.andWhere(`reports.symptom_level = ${queries['symptom_level']}`);
      }

      if (queries['site']) {
        // URL 쿼리에 지역이 존재하면 실행
        query.andWhere(`hospital.address LIKE '%${queries['site']}%'`);
      }

      if (queries['name']) {
        // URL 쿼리에 이름이 존재하면 실행
        query.andWhere(`patient.name = '${queries['name']}'`);
      }

      const allReports = await query.getRawMany();
      // const allReports = query.getMany();

      if (allReports.length === 0) {
        throw new NotFoundException('검색 결과가 없습니다');
      }

      return allReports;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new HttpException(
        error.response || '검색 조회에 실패하였습니다.',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createRequest(report_id: number, hospital_id: number) {
    const createdRequest = await this.entityManager.transaction(
      'SERIALIZABLE',
      async () => {
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

          const available_beds = hospital.available_beds;
          if (available_beds === 0) {
            throw new HttpException(
              '병원 이송 신청이 마감되었습니다. 다른 병원에 신청하시길 바랍니다.',
              HttpStatus.SERVICE_UNAVAILABLE,
            );
          }

          // 증상 보고서에 hospital_id 추가
          await this.reportsRepository.addTargetHospital(
            report_id,
            hospital_id,
          );

          // 해당 병원의 available_beds를 1 감소
          await this.hospitalsRepository.decreaseAvailableBeds(hospital_id);

          // 해당 report의 is_sent를 true로 변경
          await this.reportsRepository.updateReportBeingSent(report_id);

          return await this.reportsRepository.getReportWithPatientInfo(
            report_id,
          );
        } catch (error) {
          if (error instanceof NotFoundException) {
            throw error;
          }
          throw new HttpException(
            error.response || '환자 이송 신청에 실패하였습니다.',
            error.status || HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      },
    );
    return createdRequest;
  }

  async withdrawRequest(report_id: number) {
    const withdrawnRequest = await this.entityManager.transaction(
      'SERIALIZABLE',
      async () => {
        try {
          const report = await this.reportsRepository.findReport(report_id);
          if (!report) {
            throw new NotFoundException('증상 보고서가 존재하지 않습니다.');
          }
          if (!report.is_sent) {
            throw new HttpException(
              '아직 전송되지 않은 증상 보고서입니다.',
              HttpStatus.BAD_REQUEST,
            );
          }

          const hospital_id = report.hospital_id;

          // 증상 보고서에 hospital_id 제거
          await this.reportsRepository.deleteTargetHospital(report_id);

          // 해당 병원의 available_beds를 1 증가
          await this.hospitalsRepository.increaseAvailableBeds(hospital_id);

          // 해당 report의 is_sent를 false로 변경
          await this.reportsRepository.updateReportBeingNotSent(report_id);

          return await this.reportsRepository.getReportWithPatientInfo(
            report_id,
          );
        } catch (error) {
          if (error instanceof NotFoundException) {
            throw error;
          }
          throw new HttpException(
            error.response || '환자 이송 신청 철회에 실패하였습니다.',
            error.status || HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      },
    );
    return withdrawnRequest;
  }
}
