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
import { AgeRange } from 'src/reports/reports.enum';

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
    return await this.reportsRepository.getAllRequests();
  }

  // 검색 키워드: 날짜, 증상, 증상도, 이름, 지역
  async getSearchRequests(queries: object): Promise<Reports[]> {
    try {
      const query = this.reportsRepository
        .createQueryBuilder('reports')
        .leftJoinAndSelect('reports.hospital', 'hospital')
        .leftJoinAndSelect('reports.patient', 'patient')
        .select([
          'reports.report_id',
          'reports.symptoms',
          'reports.createdAt',
          'reports.symptom_level',
          'patient.name',
          'reports.age_range',
          'hospital.name',
          'hospital.phone',
          'hospital.emogList',
          'hospital.address',
        ])
        .where('reports.hospital_id > 0');
      //is_sent = 1과 동일한 조건이지만 검색범위는 더 좁게

      //----------------------------[Data]----------------------------------//
      switch (true) {
        case Boolean(queries['fromDate'] && queries['toDate']): {
          // URL 쿼리에 fromDate & toDate가 존재하면 실행
          const rawFromDate: string = queries['fromDate'];
          const rawToDate: string = queries['toDate'];
          if (rawFromDate && rawToDate) {
            if (rawFromDate > rawToDate) {
              throw new NotFoundException('날짜의 범위를 확인해주세요.');
            }
            const transFromDate = new Date(rawFromDate);
            let transToDate = new Date(rawToDate);
            transToDate = date.addHours(transToDate, 23);
            transToDate = date.addMinutes(transToDate, 59);
            transToDate = date.addSeconds(transToDate, 59);
            const fromDate: string = date.format(
              transFromDate,
              'YYYY-MM-DD HH:mm:ss',
              true,
            );
            const toDate: string = date.format(
              transToDate,
              'YYYY-MM-DD HH:mm:ss',
              true,
            );
            query.andWhere(
              new Brackets((qb) => {
                qb.andWhere('reports.createdAt BETWEEN :a AND :b', {
                  a: `${fromDate}`,
                  b: `${toDate}`,
                });
              }),
            );
          } else {
            throw new NotFoundException(
              '정확한 날짜를 찾을 수 없습니다. 날짜의 형식을 확인해주세요.',
            );
          }
          break;
        }
        case Boolean(queries['fromDate']): {
          // URL 쿼리에 fromDate만 존재하면 실행 (ex. 2023.06.10 00:00:00 이후)
          const fromDate: string = queries['fromDate'];
          query.andWhere(
            new Brackets((qb) => {
              qb.andWhere('reports.createdAt > :date', {
                date: `${fromDate}`,
              });
            }),
          );
          break;
        }
        case Boolean(queries['toDate']): {
          // URL 쿼리에 toDate만 존재하면 실행 (ex. 2023.06.10 23:59:59 이전)
          const rawToDate: string = queries['toDate'];
          let transToDate: Date = new Date(rawToDate);
          transToDate = date.addHours(transToDate, 23);
          transToDate = date.addMinutes(transToDate, 59);
          transToDate = date.addSeconds(transToDate, 59);
          const toDate: string = date.format(
            transToDate,
            'YYYY-MM-DD HH:mm:ss',
            true,
          );
          query.andWhere(
            new Brackets((qb) => {
              qb.andWhere('reports.createdAt < :date', {
                date: `${toDate}`,
              });
            }),
          );
          break;
        }
        default: {
          break;
        }
      }

      //----------------------------[symptoms]----------------------------------//
      if (queries['symptoms']) {
        // URL 쿼리에 증상이 존재하면 실행
        const symptoms: string[] = queries['symptoms'].split(','); // 쉼표를 기준으로 증상 구분
        symptoms.forEach((symptom: string, idx: number) => {
          query.andWhere('reports.symptoms LIKE :symp' + idx, {
            ['symp' + idx]: `%${symptom}%`,
          });
        });
      }

      //----------------------------[symptom_level]----------------------------------//
      if (queries['symptom_level']) {
        // URL 쿼리에 증상도가 존재하면 실행 (1 ~ 5)
        const level: number = parseInt(queries['symptom_level']);
        query
          .andWhere('reports.hospital_id > 0')
          .andWhere('reports.symptom_level = :level', {
            level: `${level}`,
          });
      }

      //------------------------------[site]--------------------------------//
      if (queries['site']) {
        // URL 쿼리에 지역이 존재하면 실행
        const site: string = queries['site'].toString();
        query.andWhere('hospital.address LIKE :site', {
          site: `%${site}%`,
        });
      }

      //-----------------------------[patient-name]---------------------------------//
      if (queries['name']) {
        // URL 쿼리에 이름이 존재하면 실행
        const name: string = queries['name'].toString();
        query.andWhere('patient.name = :name', {
          name: `${name}`,
        });
      }

      //-------------------------[age_range]-------------------------------------//
      if (queries['age_range']) {
        // URL 쿼리에 연령대가 존재하면 실행 (영유아, 청소년, 성인, 임산부, 노인)
        const age_range: AgeRange = queries['age_range'];
        query.andWhere('reports.age_range = :age_range', {
          age_range: `${age_range}`,
        });
      }
      //--------------------------------------------------------------//

      const allReports = await query.getRawMany();

      if (allReports.length === 0) {
        throw new NotFoundException('검색 결과가 없습니다');
      }
      return allReports;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        console.log(error);
        throw new HttpException(
          error.response || '검색 조회에 실패하였습니다.',
          error.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  // 아래 코드는 1번, 2번 서버에는 주석처리 하여 배포합니다.
  //--------------------------------------------------------------//
  // 동시성 제어를 위한 메서드
  async addRequestQueue(report_id: number, hospital_id: number) {
    // queue에 넣기 전 report_id와 hospital_id validation
    const hospital = await this.hospitalsRepository.findHospital(hospital_id);
    if (!hospital) {
      throw new NotFoundException('병원이 존재하지 않습니다.');
    }

    const report = await this.reportsRepository.findReport(report_id);
    if (!report) {
      throw new NotFoundException('증상 보고서가 존재하지 않습니다.');
    }

    // 각 이송 신청에 대한 unique한 eventName을 생성해준다
    const eventName = `Request-${report_id}-${
      Math.floor(Math.random() * 89999) + 1
    }`;
    console.log('1. eventName: ', eventName);

    console.log('2. requestQueue에 job 추가');
    // requestQueue에 해당 event를 report_id와 hospital_id와 함께 add해준다
    await this.requestQueue.add(
      'addRequestQueue',
      { report_id, hospital_id, eventName },
      {
        removeOnComplete: true,
        removeOnFail: true,
        priority: this.getPriority(report),
      }, // 이후 대기열에서 Job을 처리할 때 처리했음에도 그대로 Redis에 쌓여있는걸 방지하기 위함
    );
    // console.log('job: ', job);
    console.log('3. waitFinish() 호출');
    // 대기열 큐에 job을 넣은 후, service 내에서 waitFinish() 함수를 호출한다
    return this.waitFinish(eventName, 2, hospital); // 2 = time
  }

  async waitFinish(eventName: string, time: number, hospital: object) {
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
      }, time * 1000);

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
        success ? resolve({ hospital }) : reject(exception);
      };
      console.log('6. this.eventEmitter.addListener 세팅');
      // sendRequest()에서 전해준 이벤트가 성공이든 실패든,
      // 기다리고 있던 waitFinish()의 이벤트 리스너가 이벤트를 전달받아, 클라이언트에 응답을 보낼 수 있다
      this.eventEmitter.addListener(eventName, listenFn); // requests.consumer.ts로 이동
    });
  }

  async sendRequest(report_id: number, hospital_id: number, eventName: string) {
    console.log('*2 sendRequest 진입');
    try {
      const hospital = await this.hospitalsRepository.findHospital(hospital_id);
      const available_beds = hospital.available_beds;
      if (available_beds === 0) {
        throw new HttpException(
          '병원 이송 신청이 마감되었습니다. 다른 병원에 신청하시길 바랍니다.',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      const report = await this.reportsRepository.findReport(report_id);
      if (report.is_sent) {
        throw new HttpException(
          '이미 전송된 증상 보고서입니다.',
          HttpStatus.BAD_REQUEST,
        );
      }

      // 증상 보고서에 hospital_id 추가
      await this.reportsRepository.addTargetHospital(report_id, hospital_id);

      // 해당 병원의 available_beds를 1 감소
      await this.hospitalsRepository.decreaseAvailableBeds(hospital_id);

      // 해당 report의 is_sent를 true로 변경
      await this.reportsRepository.updateReportBeingSent(report_id);

      return this.eventEmitter.emit(eventName, { success: true });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      return this.eventEmitter.emit(eventName, {
        success: false,
        exception: error,
      });
    }
  }
  //--------------------------------------------------------------//

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

  getPriority = (report: Reports): number => {
    const { symptom_level, age_range } = report;
    const symptomLevel = 6 - symptom_level;

    const ageRangeMap: { [key: string]: number } = {
      임산부: 1,
      영유아: 2,
      노년: 3,
      청소년: 4,
      성인: 5,
    };

    return !age_range ? symptomLevel : symptomLevel * ageRangeMap[age_range];
  };

  getRequestQueueForBoard() {
    return this.requestQueue;
  }
}
