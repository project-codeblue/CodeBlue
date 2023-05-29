import { Controller, Get } from '@nestjs/common';
import { HospitalsService } from '../service/hospitals.service';
import { Logger, Param } from '@nestjs/common';
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

  @Get('/local')
  getLocalHospitals() {
    this.logger.verbose('Getting Local Hospitals');
    return this.hospitalsService.getLocalHospitals();
  } 

  @Get('/nation')
  getNationHospitals() {
    this.logger.verbose('Getting Nationwide Hospitals');
    return this.hospitalsService.getNationHospitals();
  } 

  @Get('nearBy')
  getNearbyHospitals() {
    this.logger.verbose('Getting Nearby Hospitals')
    return this.hospitalsService.getNearByHospitals(/*emogList: string[]*/);
  }
  
  @Get('/hospital/:report_id')
  getReccomandHospitals(
    @Param('report_id') report_id: number,
  ): Promise<Hospitals[]> {
    this.logger.verbose('Getting all hospitals');
    return this.hospitalsService.getReccomandHospitals(report_id);
  }
}
