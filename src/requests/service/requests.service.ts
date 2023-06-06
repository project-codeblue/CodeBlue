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
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class RequestsService {
  constructor(
    private readonly reportsRepository: ReportsRepository,
    private readonly hospitalsRepository: HospitalsRepository,
    private readonly eventEmitter: EventEmitter2, // eventEmitter DI
    @InjectEntityManager() private readonly entityManager: EntityManager, // 트랜젝션 DI
    @InjectQueue('requestQueue') private requestQueue: Queue, // bullqueue DI
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

  async sendRequest(report_id: number, hospital_id: number, eventName: string) {
    // const createdRequest = await this.entityManager.transaction(
    //   'SERIALIZABLE',
    //   async () => {
    console.log('*2 sendRequest 진입');
    try {
      const hospital = await this.hospitalsRepository.findHospital(hospital_id);
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
      await this.reportsRepository.addTargetHospital(report_id, hospital_id);

      // 해당 병원의 available_beds를 1 감소
      await this.hospitalsRepository.decreaseAvailableBeds(hospital_id);

      // 해당 report의 is_sent를 true로 변경
      await this.reportsRepository.updateReportBeingSent(report_id);

      // return await this.reportsRepository.getReportwithPatientInfo(report_id);

      return this.eventEmitter.emit(eventName, { success: true });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      // throw new HttpException(
      //   error.response || '환자 이송 신청에 실패하였습니다.',
      //   error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      // );
      return this.eventEmitter.emit(eventName, {
        success: false,
        exception: error,
      });
    }
    //   },
    // );
    // return createdRequest;
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

          return await this.reportsRepository.getReportwithPatientInfo(
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

  // 동시성 제어를 위한 메서드
  async sendRequestQueue(report_id: number, hospital_id: number) {
    // 각 이송 신청에 대한 unique한 eventName을 생성해준다
    const eventName = `finishRequest-${report_id}-${
      Math.floor(Math.random() * 89999) + 1
    }`;
    console.log('1. eventName: ', eventName);

    console.log('2. requestQueue에 job 추가');
    // requestQueue에 해당 event를 report_id와 hospital_id와 함께 add해준다
    await this.requestQueue.add(
      'sendRequestQueue',
      { report_id, hospital_id, eventName },
      { removeOnComplete: true, removeOnFail: true }, // 이후 대기열에서 Job을 처리할 때 처리했음에도 그대로 Redis에 쌓여있는걸 방지하기 위함
    );
    console.log('3. waitFinish() 호출');
    // 대기열 큐에 job을 넣은 후, service 내에서 waitFinish() 함수를 호출한다
    return this.waitFinish(eventName, 2); // 2 = second
  }

  async waitFinish(eventName: string, second: number) {
    console.log('4. waitFinish() 진입');
    return new Promise((resolve, reject) => {
      console.log('5. Promise 진입');
      // wait으로 들어와 2초짜리 setTimeout() 함수가 설정된다
      const wait = setTimeout(() => {
        console.log('** setTimeout() 진입');
        this.eventEmitter.removeAllListeners(eventName);
        resolve({
          message: '다시 시도해주세요.',
        });
      }, second * 1000);

      // wait과 동시에 this.eventEmitter에 전달받은 eventName에 대해 콜백함수로 세팅된다
      const listenFn = ({
        success,
        exception,
      }: {
        success: boolean;
        exception?: HttpException;
      }) => {
        console.log('7. listenFn 진입');
        clearTimeout(wait);
        this.eventEmitter.removeAllListeners(eventName);
        success ? resolve({ message: '이송 신청 성공' }) : reject(exception);
      };
      console.log('6. this.eventEmitter.addListener 세팅');
      // sendRequest()에서 전해준 이벤트가 성공이든 실패든,
      // 기다리고 있던 waitFinish()의 이벤트 리스너가 이벤트를 전달받아, 클라이언트에 응답을 보낼 수 있다
      this.eventEmitter.addListener(eventName, listenFn);
    });
  }
}
