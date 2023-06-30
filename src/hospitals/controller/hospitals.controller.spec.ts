import { Test } from '@nestjs/testing';
import { HospitalsController } from './hospitals.controller';
import { HospitalsService } from '../service/hospitals.service';
import { CacheInterceptor } from '../../commons/interceptors/cache.interceptor';
import { CACHE_MANAGER, CacheModule } from '@nestjs/cache-manager';

describe('HospitalsController Unit Testing', () => {
  let hospitalsController;
  let hospitalsService;
  let interceptor: CacheInterceptor;

  beforeEach(async () => {
    const mockHospitalsService = {
      getRecommendedHospitals: jest.fn().mockReturnValue({}),
      getNearbyHospitals: jest.fn().mockReturnValue({}),
    };

    const moduleRef = await Test.createTestingModule({
      imports: [CacheModule.register()],
      controllers: [HospitalsController],
      providers: [
        { provide: HospitalsService, useValue: mockHospitalsService },
        { provide: CACHE_MANAGER, useValue: {} },
        CacheInterceptor
      ],
    }).compile();

    hospitalsController = moduleRef.get(HospitalsController);
    hospitalsService = moduleRef.get(HospitalsService);
    interceptor = moduleRef.get(CacheInterceptor);
  });

  describe('getRecommendedHospitals()', () => {
    it('should get recommended Hospitals', async () => {
      const recommendedHospitals = { "hospitals_data": {} };
      jest
        .spyOn(hospitalsService, 'getRecommendedHospitals')
        // .mockImplementation(() => recommendedHospitals);

      expect(await hospitalsController.getRecommendedHospitals()).toEqual(
        recommendedHospitals,
      );
      expect(hospitalsService.getRecommendedHospitals).toBeCalledTimes(1);
    });
  });

  describe('getNearbyHospitals()', () => {
    it('should get nearby Hospitals', async () => {
      const localHospitals = { "hospitals_data": {} };
      jest
        .spyOn(hospitalsService, 'getNearbyHospitals')
        // .mockImplementation(() => localHospitals);

      expect(await hospitalsController.getNearbyHospitals()).toEqual(
        localHospitals,
      );
      expect(hospitalsService.getNearbyHospitals).toBeCalledTimes(1);
    });
  });
});
