import { Controller, Get, Logger, Param, Query, Render } from '@nestjs/common';
import { HospitalsService } from '../service/hospitals.service';

@Controller('hospital')
export class HospitalsController {
  private logger = new Logger('HospitalsController');
  constructor(private hospitalsService: HospitalsService) {}

  @Get('/local') // hospital/local?site=경기도
  getLocalHospitals(@Query('site') site: string): Promise<string[]> {
    this.logger.verbose('Getting Local Hospitals');
    return this.hospitalsService.getLocalHospitals(site);
  }

  @Get('/:report_id') // hospital/1?latitude=37.1&longitude=127.1
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
    console.log(hospitals_data);
    return { hospitals_data };
  }

  @Get('/inquery/nearbyHospitals')
  @Render('nearbyHospitals')
  async getNearbyHospitals(
    @Query() queries: object,
  ): Promise<object> {
    this.logger.verbose('Getting Nearby Hospitals');
    const hospitals_data = await this.hospitalsService.getNearbyHospitals(queries);
    return { hospitals_data };
  }

  @Get('/crawl/naver')
  getSymptomCrawl() {
    return this.hospitalsService.getSymptomCrawl();
  }
}
