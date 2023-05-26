import { Test } from '@nestjs/testing';
import { RequestsService } from './requests.service';
import { HospitalsRepository } from './../../hospitals/hospitals.repository';
import { ReportsRepository } from '../../reports/reports.repository';
import { EntityManager } from 'typeorm';
import { NotFoundException, HttpException, HttpStatus } from '@nestjs/common';

describe('RequestsService', () => {
  let requestsService;
  let hospitalsRepository;
  let reportsRepository;
  let entityManager;

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

  describe('createRequest', () => {
    it('should create a request successfully', async () => {
      const hospital_id = 1;
      const report_id = 1;
      const hospital = {
        id: hospital_id,
        available_beds: 5,
      };
      const report = {
        id: report_id,
        is_sent: false,
      };

      jest
        .spyOn(hospitalsRepository, 'findHospital')
        .mockResolvedValueOnce(hospital);
      jest.spyOn(reportsRepository, 'findReport').mockResolvedValueOnce(report);
      jest
        .spyOn(hospitalsRepository, 'updateAvailableBeds')
        .mockResolvedValueOnce(undefined);
      jest
        .spyOn(reportsRepository, 'updateReportBeingSent')
        .mockResolvedValueOnce(report);

      const result = await requestsService.createRequest(
        report_id,
        hospital_id,
      );

      expect(result).toEqual(report);
      expect(hospitalsRepository.findHospital).toHaveBeenCalledWith(
        hospital_id,
      );
      expect(reportsRepository.findReport).toHaveBeenCalledWith(report_id);
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

      expect(hospitalsRepository.findHospital).toHaveBeenCalledWith(
        hospital_id,
      );
    });

    it('should throw NotFoundException when report does not exist', async () => {
      const hospital_id = 1;
      const report_id = 1;

      jest.spyOn(hospitalsRepository, 'findHospital').mockResolvedValueOnce({});
      jest
        .spyOn(reportsRepository, 'findReport')
        .mockResolvedValueOnce(undefined);

      await expect(
        requestsService.createRequest(report_id, hospital_id),
      ).rejects.toThrowError(NotFoundException);

      expect(reportsRepository.findReport).toHaveBeenCalledWith(report_id);
    });

    it('should throw HttpException when report is already sent', async () => {
      const hospital_id = 1;
      const report_id = 1;
      const report = {
        id: report_id,
        is_sent: true,
      };

      jest.spyOn(hospitalsRepository, 'findHospital').mockResolvedValueOnce({});
      jest.spyOn(reportsRepository, 'findReport').mockResolvedValueOnce(report);

      await expect(
        requestsService.createRequest(report_id, hospital_id),
      ).rejects.toThrowError(HttpException);

      expect(hospitalsRepository.findHospital).toHaveBeenCalledWith(
        hospital_id,
      );
      expect(reportsRepository.findReport).toHaveBeenCalledWith(report_id);
    });

    it('should throw HttpException when hospital has no available beds', async () => {
      const hospital_id = 1;
      const report_id = 1;
      const hospital = {
        id: hospital_id,
        available_beds: 0,
      };
      const report = {
        id: report_id,
        is_sent: false,
      };

      jest
        .spyOn(hospitalsRepository, 'findHospital')
        .mockResolvedValueOnce(hospital);
      jest.spyOn(reportsRepository, 'findReport').mockResolvedValueOnce(report);

      await expect(
        requestsService.createRequest(report_id, hospital_id),
      ).rejects.toThrowError(HttpException);

      expect(hospitalsRepository.findHospital).toHaveBeenCalledWith(
        hospital_id,
      );
      expect(reportsRepository.findReport).toHaveBeenCalledWith(report_id);
    });

    it('should throw HttpException when there is an error during transaction', async () => {
      const hospital_id = 1;
      const report_id = 1;
      const errorResponse = 'An error occurred';
      const errorStatus = HttpStatus.INTERNAL_SERVER_ERROR;

      jest.spyOn(hospitalsRepository, 'findHospital').mockResolvedValueOnce({});
      jest.spyOn(reportsRepository, 'findReport').mockResolvedValueOnce({});
      jest
        .spyOn(hospitalsRepository, 'updateAvailableBeds')
        .mockRejectedValueOnce({
          response: errorResponse,
          status: errorStatus,
        });

      await expect(
        requestsService.createRequest(report_id, hospital_id),
      ).rejects.toThrowError(HttpException);

      expect(hospitalsRepository.findHospital).toHaveBeenCalledWith(
        hospital_id,
      );
      expect(reportsRepository.findReport).toHaveBeenCalledWith(report_id);
      expect(hospitalsRepository.updateAvailableBeds).toHaveBeenCalledWith(
        hospital_id,
      );
    });
  });
});
