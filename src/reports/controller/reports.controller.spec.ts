import { UpdateReportDto } from './../dto/update-report.dto';
import { Test } from '@nestjs/testing';
import { ReportsController } from './reports.controller';
import { ReportsService } from '../service/reports.service';

describe('Report Controller Unit Testing', () => {
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

  describe('updatePatientLocation()', () => {
    it('should return object', async () => {
      const result = {};
      jest
        .spyOn(reportsService, 'updatePatientLocation')
        .mockImplementation(() => result);

      const report_id = 1;
      const updatedLocation = new UpdateReportDto();

      expect(
        await reportsController.updatePatientLocation(
          report_id,
          updatedLocation,
        ),
      ).toBe(result);
      expect(reportsService.updatePatientLocation).toHaveBeenCalledWith(
        report_id,
        updatedLocation,
      );
    });
  });
});
