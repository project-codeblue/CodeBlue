import { UpdateReportDto } from './../dto/update-report.dto';
import { Test } from '@nestjs/testing';
import { ReportsController } from './reports.controller';
import { ReportsService } from '../service/reports.service';

describe('ReportsController Unit Testing', () => {
  let reportsController;
  let reportsService;

  beforeEach(async () => {
    const mockReportsService = {
      updatePatientLocation: jest.fn().mockReturnValue({}),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [{ provide: ReportsService, useValue: mockReportsService }],
    }).compile();

    reportsService = moduleRef.get(ReportsService);
    reportsController = moduleRef.get(ReportsController);
  });

  describe('updateReportPatientInfo()', () => {
    it('should return object', async () => {
      const result = {};
      jest
        .spyOn(reportsService, 'updateReportPatientInfo')
        .mockImplementation(() => result);

      const report_id = 1;
      const updatedPatientInfo = new UpdateReportDto();

      expect(
        await reportsController.updateReportPatientInfo(
          report_id,
          updatedPatientInfo,
        ),
      ).toBe(result);
      expect(reportsService.updateReportPatientInfo).toHaveBeenCalledWith(
        report_id,
        updatedPatientInfo,
      );
    });
  });
});
