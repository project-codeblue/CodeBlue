import { Controller, Get, Logger, Param, Query } from '@nestjs/common';
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
  getRecommendedHospitals(
    @Param('report_id') report_id: number,
    @Query() queries: object,
  ): Promise<string[] | object> {
    this.logger.verbose('Getting Recommended hospitals');
    return this.hospitalsService.getRecommendedHospitals(report_id, queries);
  }

  @Get('/crawl/naver')
  getSymptomCrawl() {
    return this.hospitalsService.getSymptomCrawl();
  }
}
