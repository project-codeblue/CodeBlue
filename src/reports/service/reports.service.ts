import {
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ReportsRepository } from '../reports.repository';
import { Reports } from '../reports.entity';
import { UpdateReportDto } from '../dto/update-report.dto';
import { KakaoMapService } from '../../commons/utils/kakao-map.service';

@Injectable()
export class ReportsService {
  constructor(
    private readonly reportsRepository: ReportsRepository,
    private readonly kakaoMapApi: KakaoMapService,
  ) {}

  async updatePatientLocation(
    report_id: number,
    updatedLocation: UpdateReportDto,
  ) {
    try {
      const { longitude, latitude } = updatedLocation;

      const report = await this.reportsRepository.findReport(report_id);

      if (!report) {
        throw new NotFoundException('증상 보고서가 존재하지 않습니다.');
      }

      const site = await this.kakaoMapApi.convertCoordinatesToRegion(
        latitude,
        longitude,
      );

      const updatedReportInfo =
        await this.reportsRepository.updatePatientLocation(
          report_id,
          longitude,
          latitude,
        );

      return {
        ...updatedReportInfo,
        site,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new HttpException(
        '사용자 현재 위치 변경에 실패하였습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
