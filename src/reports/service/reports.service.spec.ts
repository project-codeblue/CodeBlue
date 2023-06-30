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
import { ConfigType } from '@nestjs/config';
import appConfig from '../../../config/app.config';

describe('ReportsService Unit Testing', () => {
  let reportsService: ReportsService;
  let reportsRepository: ReportsRepository;
  let patientsRepository: PatientsRepository;
  let entityManager: EntityManager;
  let config: ConfigType<typeof appConfig>;

  beforeEach(async () => {
    const mockReportsRepository = {
      createReport: jest.fn().mockReturnValue({ symptom_level: 1 }),
      findReport: jest.fn(),
      updateReport: jest.fn(),
      getReportwithPatientInfo: jest.fn(),
      getReportwithHospitalInfo: jest.fn(),
      getReportwithPatientAndHospitalInfo: jest.fn(),
    };

    const mockPatientsRepository = {
      findByRRN: jest.fn().mockReturnValue(null),
      createPatientInfo: jest.fn().mockReturnValue({ patient_id: 1 }),
      updatedPatientInfo: jest.fn(),
    };

    const mockTransaction = {
      transaction: jest.fn().mockImplementation((isolationLevel, callback) => {
        // transaction 메소드에 대한 Mock 구현을 제공합니다.
        return callback(); // 테스트 시에는 콜백 함수를 실행합니다.
      }),
    };

    const mockConfig = {
      KEY: 'value',
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
        {
          provide: appConfig.KEY,
          useValue: mockConfig,
        },
      ],
    }).compile();

    reportsService = moduleRef.get<ReportsService>(ReportsService);
    reportsRepository = moduleRef.get<ReportsRepository>(ReportsRepository);
    patientsRepository = moduleRef.get<PatientsRepository>(PatientsRepository);
    entityManager = moduleRef.get<EntityManager>(EntityManager);
    config = moduleRef.get<ConfigType<typeof appConfig>>(appConfig.KEY);
  });

  describe('createReport()', () => {
    const patient_rrn = '123456-4890123';
    const name = '홍길동';
    const createReportDto: CreateReportDto = {
      symptoms: '환자는 의식을 잃었으며, 호흡이 없습니다',
      patient_rrn,
      name,
    };

    it('should create a report with correct symptom level', async () => {
      const expectedEmergencyLevel = 1;
      jest
        .spyOn(reportsService, 'callAIServerForEmergencyLevel')
        .mockResolvedValue(1);

      const result = await reportsService.createReport(
        createReportDto,
        patient_rrn,
        name,
      );

      console.log('result', result);

      expect(reportsRepository.createReport).toHaveBeenCalledWith(
        createReportDto,
      );
      expect(result.symptom_level).toEqual(expectedEmergencyLevel);
    });
  });

  describe('getReportDetails()', () => {
    const report_id = 1;

    it('should return the report details', async () => {
      const reportDetails = {
        report_id,
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

      const result = await reportsService.getReportDetails(report_id);

      expect(reportsRepository.findReport).toHaveBeenCalledWith(report_id);
      expect(result).toEqual(reportDetails);
    });

    it('should throw NotFoundException if the report does not exist', async () => {
      jest.spyOn(reportsRepository, 'findReport').mockResolvedValueOnce(null);

      await expect(reportsService.getReportDetails(report_id)).rejects.toThrow(
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
