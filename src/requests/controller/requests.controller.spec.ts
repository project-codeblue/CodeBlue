import { Test } from '@nestjs/testing';
import { RequestsService } from './../service/requests.service';
import { RequestsController } from './requests.controller';

describe('Request Controller Unit Testing', () => {
  let requestsController;
  let requestsService;

  beforeEach(async () => {
    const mockRequestsService = {
      createRequest: jest.fn().mockReturnValue({}),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [RequestsController],
      providers: [{ provide: RequestsService, useValue: mockRequestsService }],
    }).compile();

    requestsService = moduleRef.get(RequestsService);
    requestsController = moduleRef.get(RequestsController);
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
});
