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
import { CacheInterceptor } from '@nestjs/cache-manager';

@Controller('hospital')
@UseInterceptors(CacheInterceptor)
export class HospitalsController {
  private logger = new Logger('HospitalsController');
  constructor(private hospitalsService: HospitalsService) {}

  @Get('/:report_id')
  @Render('recommendedHospitals')
  async getRecommendedHospitals(
    @Param('report_id') report_id: number,
    @Query() queries: object,
  ): Promise<object> {
    this.logger.verbose('Getting Recommended hospitals');
    const hospitals_data = await this.hospitalsService.getRecommendedHospitals(
      report_id,
      queries,
    );
    return { hospitals_data };
  }
}
