import {
  Controller,
  Get,
  Logger,
  Param,
  Query,
  Render,
  UseInterceptors,
} from '@nestjs/common';
import { HospitalsService } from '../service/hospitals.service';
import { CacheInterceptor } from '../../commons/interceptors/cache.interceptor';

@Controller('hospital')
export class HospitalsController {
  private logger = new Logger('HospitalsController');
  constructor(private hospitalsService: HospitalsService) {}

  // GET: 병원 추천 및 병상 조회 (종합상황판 기반) API
  @Get('/:report_id')
  @UseInterceptors(CacheInterceptor)
  @Render('recommendedHospitals')
  async getRecommendedHospitals(
    @Param('report_id') report_id: number,
    @Query() queries: object,
  ): Promise<object> {
    try {
      this.logger.verbose('Getting Recommended hospitals');
      const hospitals_data =
        await this.hospitalsService.getRecommendedHospitals(report_id, queries);
      return { hospitals_data };
    } catch (error) {
      return { hospitals_data: error };
    }
  }

  // GET: 주변 병원 조회 API
  @Get('/nearby/site')
  @Render('nearbyHospitals')
  async getNearbyHospitals(@Query() queries: object): Promise<object> {
    this.logger.verbose('Getting Nearby Hospitals');
    const hospitals_data = await this.hospitalsService.getNearbyHospitals(
      queries,
    );
    return { hospitals_data };
  }
}
