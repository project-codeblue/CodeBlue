import { UpdateReportDto } from './../dto/update-report.dto';
import { Test } from '@nestjs/testing';
import { ReportsController } from './reports.controller';
import { ReportsService } from '../service/reports.service';
import { Reports } from '../reports.entity';

describe('ReportsController Unit Testing', () => {
  let reportsController: ReportsController;
  let reportsService: ReportsService;

  beforeEach(async () => {
    const mockReportsService = {
      updateReport: jest.fn().mockReturnValue({}),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [{ provide: ReportsService, useValue: mockReportsService }],
    }).compile();

    reportsService = moduleRef.get<ReportsService>(ReportsService);
    reportsController = moduleRef.get<ReportsController>(ReportsController);
  });

  describe('updateReport()', () => {
    it('should return object', async () => {
      const report = {} as Reports;
      jest
        .spyOn(reportsService, 'updateReport')
        .mockImplementation(() => Promise.resolve(report));

      const report_id = 1;
      const updatedPatientInfo = new UpdateReportDto();

      expect(
        await reportsController.updateReport(report_id, updatedPatientInfo),
      ).toBe(report);
      expect(reportsService.updateReport).toHaveBeenCalledWith(
        report_id,
        updatedPatientInfo,
      );
    });
  });
});
