import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { ReportsRepository } from '../reports.repository';
import { PatientsRepository } from '../../patients/patients.repository';
import { CreateReportDto } from '../dto/create-report.dto';
import { UpdateReportDto } from '../dto/update-report.dto';
import { NotFoundException, HttpException } from '@nestjs/common';
import { Reports } from '../reports.entity';
import { AgeRange, BloodType } from '../reports.enum';

describe('ReportsService Unit Testing', () => {
  let reportsService: ReportsService;
  let reportsRepository: ReportsRepository;
  let patientsRepository: PatientsRepository;

  beforeEach(async () => {
    const mockReportsRepository = {
      createReport: jest.fn((dto, level) => ({
        ...dto,
        symptom_level: level,
      })),
      findReport: jest.fn(),
      updateReport: jest.fn(),
      getReportDetails: jest.fn(),
    };

    const mockPatientsRepository = {};

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
      ],
    }).compile();

    reportsService = moduleRef.get<ReportsService>(ReportsService);
    reportsRepository = moduleRef.get<ReportsRepository>(ReportsRepository);
    patientsRepository = moduleRef.get<PatientsRepository>(PatientsRepository);
  });

  describe('createReport', () => {
    const createReportDto: CreateReportDto = {
      symptoms: '청각 손실,소실된 의식,사지 마비,가슴 통증',
    };

    it('should create a report with correct symptom level', async () => {
      const expectedEmergencyLevel = 3;

      const result = await reportsService.createReport(createReportDto);

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
      const reportDetails = {} as Reports;
      jest
        .spyOn(reportsRepository, 'getReportDetails')
        .mockResolvedValueOnce(reportDetails);

      const result = await reportsService.getReportDetails(reportId);

      expect(reportsRepository.getReportDetails).toHaveBeenCalledWith(reportId);
      expect(result).toEqual(reportDetails);
    });

    it('should throw NotFoundException if the report does not exist', async () => {
      jest
        .spyOn(reportsRepository, 'getReportDetails')
        .mockRejectedValueOnce(new NotFoundException());

      await expect(reportsService.getReportDetails(reportId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateReport()', () => {
    const report_id = 1;
    const updateReportDto: UpdateReportDto = {
      blood_pressure: 130,
      age_range: AgeRange.임산부,
      blood_type: BloodType.A,
    };

    it('should update the patient info', async () => {
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

    it('should throw NotFoundException if the report does not exist', async () => {
      jest.spyOn(reportsRepository, 'findReport').mockResolvedValueOnce(null);

      await expect(
        reportsService.updateReport(report_id, updateReportDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw HttpException for other errors', async () => {
      const error = new Error('Some error');
      jest.spyOn(reportsRepository, 'findReport').mockRejectedValueOnce(error);

      await expect(
        reportsService.updateReport(report_id, updateReportDto),
      ).rejects.toThrow(HttpException);
    });
  });
});
