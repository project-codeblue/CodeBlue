import { Test } from '@nestjs/testing';
import { HospitalsService } from './hospitals.service';
import { HospitalsRepository } from '../hospitals.repository';
import { KakaoMapService } from '../../commons/providers/kakao-map.service';
import { ReportsRepository } from '../..//reports/reports.repository';
import { Crawling } from '../../commons/middlewares/crawling';
import { MedicalOpenAPI } from '../../commons/middlewares/medicalOpenAPI';
import { Hospitals } from '../hospitals.entity';

describe('ReportsService Unit Testing', () => {
  let hospitalsService: HospitalsService;
  let hospitalsRepository: HospitalsRepository;
  let reportsRepository: ReportsRepository;
  let kakaoMapService: KakaoMapService;
  let crawling: Crawling;
  let openAPI: MedicalOpenAPI;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        HospitalsService,
        {
          provide: HospitalsRepository,
          useValue: {
            getHospitals: jest.fn(),
            findHospital: jest.fn(),
            updateAvailableBeds: jest.fn(),
            setDefaultAvailableBeds: jest.fn(),
            AllHospitals: jest.fn(),
            ConvertRadians: jest.fn(),
            arcLength: jest.fn(),
            centralAngle: jest.fn(),
          },
        },
        {
          provide: ReportsRepository,
          useValue: {
            findReport: jest.fn(),
            updatePatientLocation: jest.fn(),
            updateReportBeingSent: jest.fn(),
            userLocation: jest.fn(),
            createDummyReport: jest.fn(),
          },
        },
        {
          provide: KakaoMapService,
          useValue: {
            convertCoordinatesToRegion: jest.fn(),
            getDrivingResult: jest.fn(),
          },
        },
        {
          provide: Crawling,
          useValue: {
            getLocalHospitaldata: jest.fn(),
            getNearbyHospitals: jest.fn(),
          },
        },
        {
          provide: MedicalOpenAPI,
          useValue: {
            getMedicalData: jest.fn(),
          },
        },
      ],
    }).compile();

    hospitalsService = moduleRef.get(HospitalsService);
    hospitalsRepository = moduleRef.get(HospitalsRepository);
    reportsRepository = moduleRef.get(ReportsRepository);
    kakaoMapService = moduleRef.get(KakaoMapService);
    crawling = moduleRef.get(Crawling);
    openAPI = moduleRef.get(MedicalOpenAPI);
  });

  describe('getHospitals()', () => {
    it('getHospitals request must be performed successfully', async () => {
      const hospitals: Hospitals[] = [];
      jest
        .spyOn(hospitalsRepository, 'getHospitals')
        .mockResolvedValueOnce(hospitals);

      expect(await hospitalsService.getHospitals()).toBe(hospitals);
      expect(hospitalsRepository.getHospitals).toHaveBeenCalledTimes(1);
    });

    it('getLocalHospitals request must be performed successfully', async () => {
      const hospitals: string[] = [];
      const site: string = 'sample';
      jest
        .spyOn(crawling, 'getLocalHospitaldata')
        .mockResolvedValueOnce(hospitals);

      expect(await hospitalsService.getLocalHospitals(site)).toBe(hospitals);
      expect(crawling.getLocalHospitaldata).toHaveBeenCalledTimes(1);
    });

    it('getNationHospitals request must be performed successfully', async () => {
      const hospitals: Hospitals[] = [];
      jest.spyOn(openAPI, 'getMedicalData').mockResolvedValueOnce(hospitals);

      expect(await hospitalsService.getNationHospitals()).toBe(hospitals);
      expect(openAPI.getMedicalData).toHaveBeenCalledTimes(1);
    });

    it('getRecommendedHospitals request must be performed successfully', async () => {
      const report_id: number = 1;
      const startLat: number = 37;
      const startLng: number = 126;
      const endLat: number = 38;
      const endLng: number = 127;
      const userLocation: number[] = [37.0001, 126.0001];
      const allHospitals: Hospitals[] = [];
      const time: Object = {};
      const hospitals: string[] | Object = [];
      const result: object = {};
      const harver = jest.spyOn(hospitalsService, 'harversine');
      const driving = jest.spyOn(kakaoMapService, 'getDrivingResult');

      jest
        .spyOn(reportsRepository, 'userLocation')
        .mockResolvedValueOnce(userLocation);
      jest
        .spyOn(hospitalsRepository, 'AllHospitals')
        .mockResolvedValueOnce(allHospitals);
      jest
        .spyOn(kakaoMapService, 'getDrivingResult')
        .mockResolvedValueOnce(time);

      expect(
        await hospitalsService.getRecommendedHospitals(report_id),
      ).toStrictEqual(hospitals);
      expect(reportsRepository.userLocation).toHaveBeenCalledTimes(1);
      expect(hospitalsRepository.AllHospitals).toHaveBeenCalledTimes(1);

      expect(
        await hospitalsService.harversine(startLat, startLng, endLat, endLng),
      ).toBe(NaN);
      expect(harver).toBeCalledTimes(1);
      expect(harver).toBeCalledWith(startLat, startLng, endLat, endLng);

      expect(
        await kakaoMapService.getDrivingResult(
          startLat,
          startLng,
          endLat,
          endLng,
        ),
      ).toStrictEqual(result);
      expect(driving).toBeCalledTimes(1);
      expect(driving).toBeCalledWith(startLat, startLng, endLat, endLng);

      expect(crawling.getNearbyHospitals).toHaveBeenCalledTimes(1);
      expect(hospitalsRepository.ConvertRadians).toHaveBeenCalledTimes(4);
      expect(hospitalsRepository.arcLength).toHaveBeenCalledTimes(1);
      expect(hospitalsRepository.centralAngle).toHaveBeenCalledTimes(1);
    });
  });
});
