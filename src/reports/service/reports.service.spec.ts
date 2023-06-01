import { Test } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { ReportsRepository } from '../reports.repository';
import { NotFoundException, HttpException } from '@nestjs/common';
import { Reports } from '../reports.entity';
import { KakaoMapService } from '../../commons/providers/kakao-map.service';

describe('ReportsService Unit Testing', () => {
  let reportsService: ReportsService;
  let reportsRepository: ReportsRepository;
  let kakaoMapService: KakaoMapService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: ReportsRepository,
          useValue: {
            findReport: jest.fn(),
            updatePatientLocation: jest.fn(),
          },
        },
        {
          provide: KakaoMapService,
          useValue: {
            convertCoordinatesToAddress: jest.fn(),
            convertCoordinatesToSite: jest.fn(),
          },
        },
      ],
    }).compile();

    reportsService = moduleRef.get(ReportsService);
    reportsRepository = moduleRef.get(ReportsRepository);
    kakaoMapService = moduleRef.get(KakaoMapService);
  });

  describe('updatePatientLocation()', () => {
    const report_id = 1;
    const updatedLocation = {
      longitude: 123.456,
      latitude: 78.901,
    };

    it('should update the patient location', async () => {
      const report = {} as Reports;
      jest.spyOn(reportsRepository, 'findReport').mockResolvedValueOnce(report);
      jest
        .spyOn(reportsRepository, 'updatePatientLocation')
        .mockResolvedValueOnce(report);

      const result = await reportsService.updatePatientLocation(
        report_id,
        updatedLocation,
      );

      expect(reportsRepository.findReport).toHaveBeenCalledWith(report_id);
      expect(reportsRepository.updatePatientLocation).toHaveBeenCalledWith(
        report_id,
        updatedLocation.longitude,
        updatedLocation.latitude,
      );
      expect(result).toEqual(report);
    });

    it('should throw NotFoundException if the report does not exist', async () => {
      jest.spyOn(reportsRepository, 'findReport').mockResolvedValueOnce(null);

      await expect(
        reportsService.updatePatientLocation(report_id, updatedLocation),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw HttpException for other errors', async () => {
      const error = new Error('Some error');
      jest.spyOn(reportsRepository, 'findReport').mockRejectedValueOnce(error);

      await expect(
        reportsService.updatePatientLocation(report_id, updatedLocation),
      ).rejects.toThrow(HttpException);
    });
  });
});
