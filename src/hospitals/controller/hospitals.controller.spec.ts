import { Test } from '@nestjs/testing';
import { HospitalsController } from './hospitals.controller';
import { HospitalsService } from '../service/hospitals.service';

describe('HospitalsController Unit Testing', () => {
  let hospitalsController;
  let hospitalsService;

  beforeEach(async () => {
    const mockHospitalsService = {
      getHospitals: jest.fn().mockReturnValue({}),
      getLocalHospitals: jest.fn().mockReturnValue({}),
      getNationHospitals: jest.fn().mockReturnValue({}),
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

  describe('getHospitals()', () => {
    it('should get all Hospitals', async () => {
      const allHospitals = [];
      jest
        .spyOn(hospitalsService, 'getHospitals')
        .mockImplementation(() => allHospitals);

      expect(await hospitalsController.getHospitals()).toBe(allHospitals);
      expect(hospitalsService.getHospitals).toBeCalledTimes(1);
    });
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

  describe('getNationHospitals()', () => {
    it('should get nation Hospitals', async () => {
      const nationHospitals = [];
      jest
        .spyOn(hospitalsService, 'getNationHospitals')
        .mockImplementation(() => nationHospitals);

      expect(await hospitalsController.getNationHospitals()).toBe(
        nationHospitals,
      );
      expect(hospitalsService.getNationHospitals).toBeCalledTimes(1);
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
