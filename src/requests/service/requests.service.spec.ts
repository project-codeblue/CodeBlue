import { Test } from '@nestjs/testing';
import { RequestsService } from './requests.service';
import { HospitalsRepository } from './../../hospitals/hospitals.repository';
import { ReportsRepository } from '../../reports/reports.repository';
import { EntityManager } from 'typeorm';
import { NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { Hospitals } from '../../hospitals/hospitals.entity';
import { Reports } from '../../reports/reports.entity';

describe('RequestsService Unit Testing', () => {
  let requestsService: RequestsService;
  let hospitalsRepository: HospitalsRepository;
  let reportsRepository: ReportsRepository;
  let entityManager: EntityManager;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        RequestsService,
        {
          provide: HospitalsRepository,
          useValue: {
            findHospital: jest.fn(),
            updateAvailableBeds: jest.fn(),
          },
        },
        {
          provide: ReportsRepository,
          useValue: {
            findReport: jest.fn(),
            updateReportBeingSent: jest.fn(),
            getAllRequests: jest.fn(),
            addTargetHospital: jest.fn(),
            createQueryBuilder: jest.fn(),
            leftJoinAndSelect: jest.fn(),
          },
        },
        {
          provide: EntityManager,
          useValue: {
            transaction: jest
              .fn()
              .mockImplementation((isolationLevel, callback) => {
                // transaction 메소드에 대한 Mock 구현을 제공합니다.
                return callback(); // 테스트 시에는 콜백 함수를 실행합니다.
              }),
          },
        },
      ],
    }).compile();

    requestsService = moduleRef.get(RequestsService);
    hospitalsRepository = moduleRef.get(HospitalsRepository);
    reportsRepository = moduleRef.get(ReportsRepository);
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
        date: '2023-05-30~2023-05-31',
        symptom_level: '5',
        site: '경기도',
        name: '홍길동',
      }

      jest
        .spyOn(requestsService, 'getSearchRequests')
        .mockResolvedValue(queries['date'])
      jest
        .spyOn(requestsService, 'getSearchRequests')
        .mockResolvedValue(queries['symptoms'])
      jest
        .spyOn(requestsService, 'getSearchRequests')
        .mockResolvedValue(queries['symptom_level'])
      jest
        .spyOn(requestsService, 'getSearchRequests')
        .mockResolvedValue(queries['site'])
      jest
        .spyOn(requestsService, 'getSearchRequests')
        .mockResolvedValue(queries['name'])

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
      const hospital = {
        hospital_id,
        available_beds: 5,
      };
      const report = {
        report_id,
        is_sent: false,
      };

      jest
        .spyOn(hospitalsRepository, 'findHospital')
        .mockResolvedValueOnce(hospital as Hospitals);
      jest
        .spyOn(reportsRepository, 'findReport')
        .mockResolvedValueOnce(report as Reports);
      jest
        .spyOn(reportsRepository, 'addTargetHospital')
        .mockResolvedValueOnce(undefined);
      jest
        .spyOn(hospitalsRepository, 'updateAvailableBeds')
        .mockResolvedValueOnce(undefined);
      jest
        .spyOn(reportsRepository, 'updateReportBeingSent')
        .mockResolvedValueOnce(report as Reports);

      const result = await requestsService.createRequest(
        report_id,
        hospital_id,
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
      expect(hospitalsRepository.updateAvailableBeds).toHaveBeenCalledWith(
        hospital_id,
      );
      expect(reportsRepository.updateReportBeingSent).toHaveBeenCalledWith(
        report_id,
      );
    });

    it('should throw NotFoundException when hospital does not exist', async () => {
      const hospital_id = 1;
      const report_id = 1;

      jest
        .spyOn(hospitalsRepository, 'findHospital')
        .mockResolvedValueOnce(undefined);

      await expect(
        requestsService.createRequest(report_id, hospital_id),
      ).rejects.toThrowError(NotFoundException);
    });

    it('should throw NotFoundException when report does not exist', async () => {
      const hospital_id = 1;
      const report_id = 1;
      const hospital = {
        hospital_id,
      };

      jest
        .spyOn(hospitalsRepository, 'findHospital')
        .mockResolvedValueOnce(hospital as Hospitals);
      jest
        .spyOn(reportsRepository, 'findReport')
        .mockResolvedValueOnce(undefined);

      await expect(
        requestsService.createRequest(report_id, hospital_id),
      ).rejects.toThrowError(NotFoundException);
    });

    it('should throw HttpException when report is already sent', async () => {
      const hospital_id = 1;
      const report_id = 1;
      const report = {
        report_id,
        is_sent: true,
      };

      jest
        .spyOn(reportsRepository, 'findReport')
        .mockResolvedValueOnce(report as Reports);

      await expect(
        requestsService.createRequest(report_id, hospital_id),
      ).rejects.toThrowError(HttpException);
    });

    it('should throw HttpException when hospital has no available beds', async () => {
      const hospital_id = 1;
      const report_id = 1;
      const hospital = {
        hospital_id,
        available_beds: 0,
      };
      const report = {
        report_id,
        is_sent: false,
      };

      jest
        .spyOn(hospitalsRepository, 'findHospital')
        .mockResolvedValueOnce(hospital as Hospitals);
      jest
        .spyOn(reportsRepository, 'findReport')
        .mockResolvedValueOnce(report as Reports);

      await expect(
        requestsService.createRequest(report_id, hospital_id),
      ).rejects.toThrowError(HttpException);
    });

    it('should throw HttpException when there is an error during transaction', async () => {
      const hospital_id = 1;
      const report_id = 1;
      const errorResponse = 'An error occurred';
      const errorStatus = HttpStatus.INTERNAL_SERVER_ERROR;

      jest
        .spyOn(hospitalsRepository, 'updateAvailableBeds')
        .mockRejectedValueOnce({
          response: errorResponse,
          status: errorStatus,
        });

      await expect(
        requestsService.createRequest(report_id, hospital_id),
      ).rejects.toThrowError(HttpException);
    });
  });
});
