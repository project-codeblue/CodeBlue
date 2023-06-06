import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { ReportsRepository } from '../reports.repository';
import { PatientsRepository } from '../../patients/patients.repository';
import { CreateReportDto } from '../dto/create-report.dto';
import { UpdateReportDto } from '../dto/update-report.dto';
import { NotFoundException } from '@nestjs/common';
import { Reports } from '../reports.entity';
import { AgeRange, BloodType } from '../reports.enum';
import { EntityManager } from 'typeorm';

describe('ReportsService Unit Testing', () => {
  let reportsService: ReportsService;
  let reportsRepository: ReportsRepository;
  let entityManager: EntityManager;

  beforeEach(async () => {
    const mockReportsRepository = {
      createReport: jest.fn((dto, level) => ({
        ...dto,
        symptom_level: level,
      })),
      findReport: jest.fn(),
      updateReport: jest.fn(),
      getReportwithPatientInfo: jest.fn(),
      getReportwithHospitalInfo: jest.fn(),
      getReportwithPatientAndHospitalInfo: jest.fn(),
    };

    const mockPatientsRepository = {
      findByRRN: jest.fn(),
      createPatientInfo: jest.fn((dto) => ({
        ...dto,
        patient_id: 1,
      })),
    };

    const mockTransaction = {
      transaction: jest.fn().mockImplementation((isolationLevel, callback) => {
        // transaction 메소드에 대한 Mock 구현을 제공합니다.
        return callback(); // 테스트 시에는 콜백 함수를 실행합니다.
      }),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: ReportsRepository,
          useValue: mockReportsRepository,
        },
        {
          provide: PatientsRepository,
          useValue: mockPatientsRepository,
        },
        {
          provide: EntityManager,
          useValue: mockTransaction,
        },
      ],
    }).compile();

    reportsService = moduleRef.get<ReportsService>(ReportsService);
    reportsRepository = moduleRef.get<ReportsRepository>(ReportsRepository);
    entityManager = moduleRef.get<EntityManager>(EntityManager);
  });

  describe('createReport()', () => {
    const createReportDto: CreateReportDto = {
      symptoms: '청각 손실,소실된 의식,사지 마비,가슴 통증',
    };
    const patient_rrn = '123456-7890123';

    it('should create a report with correct symptom level', async () => {
      const expectedEmergencyLevel = 3;

      const result = await reportsService.createReport(
        createReportDto,
        patient_rrn,
      );

      expect(reportsRepository.createReport).toHaveBeenCalledWith(
        createReportDto,
        expectedEmergencyLevel,
      );
      expect(result.symptom_level).toEqual(expectedEmergencyLevel);
    });
  });

  describe('getReportDetails()', () => {
    const reportId = 1;

    it('should return the report details', async () => {
      const reportDetails = {
        report_id: reportId,
        blood_pressure: '130/80',
      } as Reports;
      jest
        .spyOn(reportsRepository, 'findReport')
        .mockResolvedValueOnce(reportDetails);
      jest
        .spyOn(reportsRepository, 'getReportwithPatientInfo')
        .mockResolvedValueOnce(reportDetails);
      jest
        .spyOn(reportsRepository, 'getReportwithHospitalInfo')
        .mockResolvedValueOnce(reportDetails);
      jest
        .spyOn(reportsRepository, 'getReportwithPatientAndHospitalInfo')
        .mockResolvedValueOnce(reportDetails);

      const result = await reportsService.getReportDetails(reportId);

      expect(reportsRepository.findReport).toHaveBeenCalledWith(reportId);
      expect(result).toEqual(reportDetails);
    });

    it('should throw NotFoundException if the report does not exist', async () => {
      jest.spyOn(reportsRepository, 'findReport').mockResolvedValueOnce(null);

      await expect(reportsService.getReportDetails(reportId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateReport()', () => {
    const report_id = 1;
    const updateReportDto: UpdateReportDto = {
      blood_pressure: '130/80',
      age_range: AgeRange.임산부,
      blood_type: BloodType.A,
    };

    it('should update report', async () => {
      const report = {} as Reports;
      jest.spyOn(reportsRepository, 'findReport').mockResolvedValueOnce(report);
      jest
        .spyOn(reportsRepository, 'updateReport')
        .mockResolvedValueOnce(report);

      const result = await reportsService.updateReport(
        report_id,
        updateReportDto,
      );

      expect(reportsRepository.findReport).toHaveBeenCalledWith(report_id);
      expect(reportsRepository.updateReport).toHaveBeenCalledWith(
        report_id,
        updateReportDto,
      );
      expect(result).toEqual(report);
    });
  });
});
