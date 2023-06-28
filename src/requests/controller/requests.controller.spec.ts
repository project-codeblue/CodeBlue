import { Test } from '@nestjs/testing';
import { RequestsService } from './../service/requests.service';
import { RequestsController } from './requests.controller';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('RequestsController Unit Testing', () => {
  let requestsController;
  let requestsService;

  beforeEach(async () => {
    const mockRequestsService = {
      getAllRequests: jest.fn().mockReturnValue({}),
      getSearchRequests: jest.fn().mockReturnValue({}),
      addRequestQueue: jest.fn().mockReturnValue({}),
      withdrawRequest: jest.fn().mockReturnValue({}),
    };

    const mockCacheManager = {
      get: jest.fn().mockReturnValue({}),
      set: jest.fn().mockReturnValue({}),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [RequestsController],
      providers: [
        { provide: RequestsService, useValue: mockRequestsService },
        {
          provide: CACHE_MANAGER,
          useValue: {
            mockCacheManager,
          },
        },
      ],
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
      const searchedData = {};

      jest
        .spyOn(requestsService, 'getSearchRequests')
        .mockImplementation(() => searchedData);

      const queries: object = {
        fromDate: '2021-01-01',
        toDate: '2021-01-02',
        symptoms: '체중감소',
        symptom_level: 1,
        site: '강원도',
        name: '홍길동',
      };

      expect(await requestsController.getSearchRequests(queries)).toStrictEqual(
        {
          searchedData,
        },
      );
      expect(requestsService.getSearchRequests).toHaveBeenCalledTimes(1);
      expect(requestsService.getSearchRequests).toHaveBeenCalledWith(queries);
    });
  });

  describe('sendRequest()', () => {
    it('should return object', async () => {
      const result = {};
      jest
        .spyOn(requestsService, 'addRequestQueue')
        .mockImplementation(() => result);

      const report_id = 1;
      const hospital_id = 1;

      expect(await requestsController.sendRequest(report_id, hospital_id)).toBe(
        result,
      );
      expect(requestsService.addRequestQueue).toHaveBeenCalledWith(
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
