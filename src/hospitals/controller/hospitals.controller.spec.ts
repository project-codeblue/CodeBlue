import { Test } from '@nestjs/testing';
import { HospitalsController } from './hospitals.controller';
import { HospitalsService } from '../service/hospitals.service';

describe('HospitalsController Unit Testing', () => {
  let hospitalsController;
  let hospitalsService;

  beforeEach(async () => {
    const mockHospitalsService = {
      getLocalHospitals: jest.fn().mockReturnValue({}),
      getRecommendedHospitals: jest.fn().mockReturnValue({}),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [HospitalsController],
      providers: [
        { provide: HospitalsService, useValue: mockHospitalsService },
      ],
    }).compile();

    hospitalsController = moduleRef.get(HospitalsController);
    hospitalsService = moduleRef.get(HospitalsService);
  });

  describe('getLocalHospitals()', () => {
    it('should get local Hospitals', async () => {
      const localHospitals = [];
      jest
        .spyOn(hospitalsService, 'getLocalHospitals')
        .mockImplementation(() => localHospitals);

      expect(await hospitalsController.getLocalHospitals()).toBe(
        localHospitals,
      );
      expect(hospitalsService.getLocalHospitals).toBeCalledTimes(1);
    });
  });

  describe('getRecommendedHospitals()', () => {
    it('should get recommended Hospitals', async () => {
      const recommendedHospitals = [];
      jest
        .spyOn(hospitalsService, 'getRecommendedHospitals')
        .mockImplementation(() => recommendedHospitals);

      expect(await hospitalsController.getRecommendedHospitals()).toBe(
        recommendedHospitals,
      );
      expect(hospitalsService.getRecommendedHospitals).toBeCalledTimes(1);
    });
  });
});
