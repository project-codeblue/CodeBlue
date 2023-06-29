import { Test } from '@nestjs/testing';
import { HospitalsService } from './hospitals.service';
import { HospitalsRepository } from '../hospitals.repository';
import { KakaoMapService } from '../../commons/providers/kakao-map.provider';
import { ReportsRepository } from '../..//reports/reports.repository';
import { Crawling } from '../../commons/middlewares/crawling';
import { Hospitals } from '../hospitals.entity';
import { Reports } from '../../reports/reports.entity';
import { EntityManager } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

describe('ReportsService Unit Testing', () => {
  let hospitalsService: HospitalsService;
  let hospitalsRepository: HospitalsRepository;
  let reportsRepository: ReportsRepository;
  let kakaoMapService: KakaoMapService;
  let crawling: Crawling;
  let entityManager: EntityManager;

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
            getHospitalsWithinRadius: jest.fn(),
            getHospitalsWithoutRadius: jest.fn(),
            calculateRating: jest.fn(),
          },
        },
        {
          provide: EntityManager,
          useValue: {
            transaction: jest
              .fn()
              .mockImplementation((isolationLevel, callback) => {
                // transaction 메소드에 대한 Mock 구현을 제공합니다.
                return callback(); // 테스트 시에는 콜백 함수를 실행합니다.
              }),
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
            getDrivingResult: jest.fn(),
          },
        },
        {
          provide: Crawling,
          useValue: {
            getRealTimeHospitalsBeds: jest.fn(),
          },
        },
      ],
    }).compile();

    hospitalsService = moduleRef.get(HospitalsService);
    hospitalsRepository = moduleRef.get(HospitalsRepository);
    reportsRepository = moduleRef.get(ReportsRepository);
    kakaoMapService = moduleRef.get(KakaoMapService);
    crawling = moduleRef.get(Crawling);
    entityManager = moduleRef.get(EntityManager);
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
  });

  describe('getNearbyHospitals()', () => {
    it('must be performed successfully', async () => {
      const hospitals = [
        {
          name: '한림대학교동탄성심병원',
          address: '경기도 화성시 큰재봉길 7 (석우동)',
          phone: '031-8086-3000',
          distance: '3.1km',
        },
        {
          name: '오산한국병원',
          address: '경기도 오산시 밀머리로1번길 16 (원동)',
          phone: '031-379-8300',
          distance: '5.3km',
        },
      ];
      const queries = { latitude: 37.1886258, longitude: 127.0766825 };

      jest
        .spyOn(hospitalsRepository, 'getHospitalsWithinRadius')
        .mockResolvedValueOnce(hospitals);

      const result = await hospitalsService.getNearbyHospitals(queries);

      console.log('result: ', result);

      expect(result).toStrictEqual(hospitals);

      expect(
        hospitalsRepository.getHospitalsWithinRadius,
      ).toHaveBeenCalledTimes(1);
    });
  });

  describe('getRecommendHospitals()', () => {
    it('must be performed successfully', async () => {
      const report_id = 1;
      const queries = {};
      const hospitals = {};
      const recommended = jest.spyOn(
        hospitalsService,
        'getRecommendedHospitals',
      );

      const report: Reports = new Reports();
      const findreport = jest.spyOn(reportsRepository, 'findReport');

      const startLat = 37;
      const startLng = 126;
      const endLat = 38;
      const endLng = 127;
      const result: object = {};
      const driving = jest.spyOn(kakaoMapService, 'getDrivingResult');

      const emogList = [];
      const crawl = jest.spyOn(crawling, 'getRealTimeHospitalsBeds');

      const dataSource = ['sample'];
      const time = {};
      const duration = {};
      const distance = {};

      const rating = 99;
      const hospital = [];
      const weights = { duration: 200, available_beds: 5 };
      const maxDuration = 1000;
      const maxAvailable_beds = 5;
      const calculate = jest.spyOn(hospitalsService, `calculateRating`);

      jest.spyOn(reportsRepository, 'findReport').mockResolvedValueOnce(report);
      jest
        .spyOn(hospitalsRepository, 'getHospitalsWithinRadius')
        .mockResolvedValueOnce(dataSource);
      jest
        .spyOn(hospitalsRepository, 'getHospitalsWithoutRadius')
        .mockResolvedValueOnce(dataSource);
      jest
        .spyOn(kakaoMapService, 'getDrivingResult')
        .mockResolvedValueOnce(time);
      jest
        .spyOn(hospitalsService, 'getRecommendedHospitals')
        .mockResolvedValueOnce(duration);
      jest
        .spyOn(hospitalsService, 'getRecommendedHospitals')
        .mockResolvedValueOnce(distance);
      jest
        .spyOn(hospitalsService, 'calculateRating')
        .mockResolvedValueOnce(rating);

      expect(
        await hospitalsService.getRecommendedHospitals(report_id, queries),
      ).toStrictEqual(hospitals);
      expect(recommended).toBeCalledTimes(1);
      expect(recommended).toBeCalledWith(report_id, queries);

      expect(await reportsRepository.findReport(report_id)).toStrictEqual(
        report,
      );
      expect(findreport).toBeCalledTimes(1);
      expect(findreport).toBeCalledWith(report_id);

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

      await crawling.getRealTimeHospitalsBeds(emogList);
      expect(crawl).toBeCalledTimes(1);
      expect(crawl).toBeCalledWith(emogList);
      //가중치 영역 테스트코드 추가
      expect(
        await hospitalsService.calculateRating(
          hospital,
          weights,
          maxDuration,
          maxAvailable_beds,
        ),
      ).toStrictEqual(rating);
      expect(calculate).toBeCalledTimes(1);
      expect(calculate).toBeCalledWith(
        hospital,
        weights,
        maxDuration,
        maxAvailable_beds,
      );
    });
  });
});
