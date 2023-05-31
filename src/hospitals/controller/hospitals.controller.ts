import { Controller, Get, Logger, Param, Query } from '@nestjs/common';
import { HospitalsService } from '../service/hospitals.service';
import { Hospitals } from '../hospitals.entity';

@Controller('hospital')
export class HospitalsController {
  private logger = new Logger('HospitalsController');
  constructor(private hospitalsService: HospitalsService) {}

  @Get()
  getHospitals(): Promise<Hospitals[]> {
    this.logger.verbose('Getting all Hospitals');
    return this.hospitalsService.getHospitals();
  }

  @Get('/local') // hospital/local?site=경기도
  getLocalHospitals(@Query('site') site: string): Promise<string[]> {
    this.logger.verbose('Getting Local Hospitals');
    return this.hospitalsService.getLocalHospitals(site);
  }

  @Get('/nation')
  getNationHospitals(): Promise<JSON> {
    this.logger.verbose('Getting Nationwide Hospitals');
    return this.hospitalsService.getNationHospitals();
  }

  @Get('/:report_id')
  getRecommendedHospitals(
    @Param('report_id') report_id: number,
  ): Promise<string[] | object> {
    this.logger.verbose('Getting Recommended hospitals');
    return this.hospitalsService.getRecommendedHospitals(report_id);
  }
}
