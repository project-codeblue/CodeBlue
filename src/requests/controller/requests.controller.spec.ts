import { Test } from '@nestjs/testing';
import { RequestsService } from './../service/requests.service';
import { RequestsController } from './requests.controller';

describe('RequestsController Unit Testing', () => {
  let requestsController;
  let requestsService;

  beforeEach(async () => {
    const mockRequestsService = {
      getAllRequests: jest.fn().mockReturnValue({}),
      getSearchRequests: jest.fn().mockReturnValue({}),
      createRequest: jest.fn().mockReturnValue({}),
      withdrawRequest: jest.fn().mockReturnValue({}),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [RequestsController],
      providers: [{ provide: RequestsService, useValue: mockRequestsService }],
    }).compile();

    requestsService = moduleRef.get<RequestsService>(RequestsService);
    requestsController = moduleRef.get<RequestsController>(RequestsController);
  });

  describe('getAllRequests()', () => {
    it('should get all obejct', async () => {
      const allReports = [];
      jest
        .spyOn(requestsService, 'getAllRequests')
        .mockImplementation(() => allReports);

      expect(await requestsController.getAllRequests()).toBe(allReports);
      expect(requestsService.getAllRequests).toBeCalledTimes(1);
    });
  });

  describe('getSearchRequests()', () => {
    it('should get searched object', async () => {
      const allReports = [];
      jest
        .spyOn(requestsService, 'getSearchRequests')
        .mockImplementation(() => allReports);

      const queries: object = {
        date: '2023-05-27~2023-05-28',
        symptoms: '체중감소',
        symptom_level: 1,
      };

      expect(await requestsController.getSearchRequests(queries)).toBe(
        allReports,
      );
      expect(requestsService.getSearchRequests).toBeCalledTimes(1);
      expect(requestsService.getSearchRequests).toHaveBeenCalledWith(queries);
    });
  });

  describe('createRequest()', () => {
    it('should return object', async () => {
      const result = {};
      jest
        .spyOn(requestsService, 'createRequest')
        .mockImplementation(() => result);

      const report_id = 1;
      const hospital_id = 1;

      expect(
        await requestsController.createRequest(report_id, hospital_id),
      ).toBe(result);
      expect(requestsService.createRequest).toHaveBeenCalledWith(
        report_id,
        hospital_id,
      );
    });
  });

  describe('withdrawRequest()', () => {
    it('should return object', async () => {
      const result = {};
      jest
        .spyOn(requestsService, 'withdrawRequest')
        .mockImplementation(() => result);

      const report_id = 1;

      expect(await requestsController.withdrawRequest(report_id)).toBe(result);
      expect(requestsService.withdrawRequest).toHaveBeenCalledWith(report_id);
    });
  });
});
