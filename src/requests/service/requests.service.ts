import { Injectable, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { HospitalsRepository } from './../../hospitals/hospitals.repository';
import { ReportsRepository } from '../../reports/reports.repository';
import { RequestsRepository } from '../../requests/requests.repository';
import { EntityManager, Brackets } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';
import { Reports } from 'src/reports/reports.entity';
import * as date from 'date-and-time';

@Injectable()
export class RequestsService {
  constructor(
    private readonly reportsRepository: ReportsRepository,
    private readonly hospitalsRepository: HospitalsRepository,
    private readonly requestsRepository: RequestsRepository,
    @InjectEntityManager() private readonly entityManager: EntityManager, // 트랜젝션을 위해 DI
  ) {}

  async getAllRequests(): Promise<Reports[]> {
    const allReports = await this.requestsRepository.getAllRequests();
    return allReports;
  }

  async getSearchRequests(queries: object): Promise<Reports[]> {
    const query = this.requestsRepository.createQueryBuilder('reports')
      .leftJoinAndSelect('reports.hospital', 'hospital')
      .where('1 = 1')
      .where('is_sent = 1');

    if (queries['date']) { // URL 쿼리에 날짜가 존재하면 실행
      const dates: string[] = queries['date'].split('~'); // '~' 를 기준으로 날짜 범위 구분

      const regex = /^\d{4}-\d{2}-\d{2}$/;
      for (let date of dates) {
        if(!regex.test(date)) {
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

    if (queries['symptoms']) { // URL 쿼리에 증상이 존재하면 실행
      const symptoms = queries['symptoms'].split(','); // 쉼표를 기준으로 증상 구분
      symptoms.forEach((symptom: string) => {
        query.andWhere(`reports.symptoms LIKE '%${symptom}%'`);
      });
    }

    if (queries['symptom_level']) { // URL 쿼리에 증상도가 존재하면 실행
      query.andWhere(`reports.symptom_level = ${queries['symptom_level']}`);
    }

    if (queries['site']) { // URL 쿼리에 지역이 존재하면 실행
      query.andWhere(`hospital.address LIKE '%${queries['site']}%'`);
    }

    const allReports = query.getRawMany();

    return allReports;
  }

  async createRequest(report_id: number, hospital_id: number) {
    const updatedReport = await this.entityManager.transaction(
      'READ COMMITTED',
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

          const availableBeds = hospital.available_beds;
          if (availableBeds === 0) {
            throw new HttpException(
              '병원 이송 신청이 마감되었습니다. 다른 병원에 신청하시길 바랍니다.',
              HttpStatus.SERVICE_UNAVAILABLE,
            );
          }

          // 해당 병원의 available_beds를 1 감소
          await this.hospitalsRepository.updateAvailableBeds(hospital_id);

          // 해당 report의 is_sent를 true로 변경
          return await this.reportsRepository.updateReportBeingSent(report_id);
        } catch (error) {
          if (error instanceof NotFoundException) {
            throw error;
          }
          throw new HttpException(
            error.response || '증상 보고서 전송에 실패하였습니다.',
            error.status || HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      },
    );
    return updatedReport;
  }
}
