import { Test } from '@nestjs/testing';
import { RequestsService } from './requests.service';
import { HospitalsRepository } from './../../hospitals/hospitals.repository';
import { ReportsRepository } from '../../reports/reports.repository';
import { EntityManager } from 'typeorm';
import { Hospitals } from '../../hospitals/hospitals.entity';
import { Reports } from '../../reports/reports.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Queue } from 'bull';

describe('RequestsService Unit Testing', () => {
  let requestsService: RequestsService;
  let hospitalsRepository: HospitalsRepository;
  let reportsRepository: ReportsRepository;
  let eventEmitter: EventEmitter2;
  let entityManager: EntityManager;
  let requestQueue: Queue;

  beforeEach(async () => {
    const mockHospitalsRepository = {
      findHospital: jest.fn(),
      decreaseAvailableBeds: jest.fn(),
      increaseAvailableBeds: jest.fn(),
    };
    const mockReportsRepository = {
      findReport: jest.fn(),
      updateReportBeingSent: jest.fn(),
      updateReportBeingNotSent: jest.fn(),
      getAllRequests: jest.fn(),
      addTargetHospital: jest.fn(),
      deleteTargetHospital: jest.fn(),
      getReportWithPatientInfo: jest.fn(),
      createQueryBuilder: jest.fn(),
      leftJoinAndSelect: jest.fn(),
    };
    const mockTransaction = {
      transaction: jest.fn().mockImplementation((isolationLevel, callback) => {
        // transaction 메소드에 대한 Mock 구현을 제공합니다.
        return callback(); // 테스트 시에는 콜백 함수를 실행합니다.
      }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        RequestsService,
        {
          provide: HospitalsRepository,
          useValue: mockHospitalsRepository,
        },
        {
          provide: ReportsRepository,
          useValue: mockReportsRepository,
        },
        {
          provide: EntityManager,
          useValue: mockTransaction,
        },
      ],
    }).compile();

    requestsService = moduleRef.get(RequestsService);
    hospitalsRepository = moduleRef.get(HospitalsRepository);
    reportsRepository = moduleRef.get(ReportsRepository);
    eventEmitter = moduleRef.get(EventEmitter2);
    entityManager = moduleRef.get(EntityManager);
  });

  describe('getAllRequests()', () => {
    it('getAllRequests request must be performed successfully', async () => {
      const allReports = [];
      jest
        .spyOn(reportsRepository, 'getAllRequests')
        .mockResolvedValueOnce(allReports as Reports[]);

      expect(await requestsService.getAllRequests()).toBe(allReports);
      expect(reportsRepository.getAllRequests).toBeCalledTimes(1);
    });
  });

  describe('getSearchRequests()', () => {
    it('getSearchRequests request must be performed successfully', async () => {
      const allReports = [];
      const queries: object = {
        symptoms: '발작',
        fromDate: '2023-05-30',
        toDate: '2023-05-31',
        symptom_level: '5',
        site: '경기도',
        name: '홍길동',
        age_range: '성인',
      };

      jest
        .spyOn(requestsService, 'getSearchRequests')
        .mockResolvedValue(queries['fromDate']);
      jest
        .spyOn(requestsService, 'getSearchRequests')
        .mockResolvedValue(queries['toDate']);
      jest
        .spyOn(requestsService, 'getSearchRequests')
        .mockResolvedValue(queries['symptoms']);
      jest
        .spyOn(requestsService, 'getSearchRequests')
        .mockResolvedValue(queries['symptom_level']);
      jest
        .spyOn(requestsService, 'getSearchRequests')
        .mockResolvedValue(queries['site']);
      jest
        .spyOn(requestsService, 'getSearchRequests')
        .mockResolvedValue(queries['name']);
      jest
        .spyOn(requestsService, 'getSearchRequests')
        .mockResolvedValue(queries['age_range']);

      const search = jest.spyOn(requestsService, 'getSearchRequests');

      await requestsService.getSearchRequests(queries);
      expect(search).toBeCalledTimes(1);
      expect(search).toBeCalledWith(queries);
    });
  });

  describe('createRequest()', () => {
    it('should create a request successfully', async () => {
      const hospital_id = 1;
      const report_id = 1;
      const eventName = 'test';
      const hospital = [
        {
          hospital_id,
          available_beds: 5,
        },
      ];
      const report = {
        report_id,
        is_sent: false,
      };

      jest
        .spyOn(hospitalsRepository, 'findHospital')
        .mockResolvedValueOnce(hospital[0] as Hospitals);
      jest
        .spyOn(reportsRepository, 'findReport')
        .mockResolvedValueOnce(report as Reports);
      jest.spyOn(reportsRepository, 'addTargetHospital');
      jest.spyOn(hospitalsRepository, 'decreaseAvailableBeds');
      jest.spyOn(reportsRepository, 'updateReportBeingSent');
      jest
        .spyOn(reportsRepository, 'getReportwithPatientInfo')
        .mockResolvedValueOnce(report as Reports);

      const result = await requestsService.sendRequest(
        report_id,
        hospital_id,
        eventName,
      );

      expect(result).toEqual(report);
      expect(hospitalsRepository.findHospital).toHaveBeenCalledWith(
        hospital_id,
      );
      expect(reportsRepository.findReport).toHaveBeenCalledWith(report_id);
      expect(reportsRepository.addTargetHospital).toHaveBeenCalledWith(
        report_id,
        hospital_id,
      );
      expect(hospitalsRepository.decreaseAvailableBeds).toHaveBeenCalledWith(
        hospital_id,
      );
      expect(reportsRepository.updateReportBeingSent).toHaveBeenCalledWith(
        report_id,
      );
      expect(reportsRepository.getReportwithPatientInfo).toHaveBeenCalledWith(
        report_id,
      );
    });
  });

  describe('withdrawRequest()', () => {
    it('should withdraw a request successfully', async () => {
      const hospital_id = 1;
      const report_id = 1;
      const report = {
        report_id,
        hospital_id,
        is_sent: true,
      };

      jest
        .spyOn(reportsRepository, 'findReport')
        .mockResolvedValueOnce(report as Reports);
      jest.spyOn(reportsRepository, 'deleteTargetHospital');
      jest.spyOn(hospitalsRepository, 'increaseAvailableBeds');
      jest.spyOn(reportsRepository, 'updateReportBeingNotSent');
      jest
        .spyOn(reportsRepository, 'getReportwithPatientInfo')
        .mockResolvedValueOnce(report as Reports);

      const result = await requestsService.withdrawRequest(report_id);

      expect(result).toEqual(report);
      expect(reportsRepository.findReport).toHaveBeenCalledWith(report_id);
      expect(reportsRepository.deleteTargetHospital).toHaveBeenCalledWith(
        report_id,
      );
      expect(hospitalsRepository.increaseAvailableBeds).toHaveBeenCalledWith(
        hospital_id,
      );
      expect(reportsRepository.updateReportBeingNotSent).toHaveBeenCalledWith(
        report_id,
      );
      expect(reportsRepository.getReportwithPatientInfo).toHaveBeenCalledWith(
        report_id,
      );
    });
  });
});
