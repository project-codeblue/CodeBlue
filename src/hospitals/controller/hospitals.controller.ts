import { Controller, Get } from '@nestjs/common';
import { HospitalsService } from '../service/hospitals.service';
import { Logger } from '@nestjs/common';
import { Hospitals } from '../hospitals.entity';

@Controller('hospital')
export class HospitalsController {
  private logger = new Logger('HospitalsController');
  constructor(private hospitalsService: HospitalsService) {}

  @Get()
  getHospitals(): Promise<Hospitals[]> {
    this.logger.verbose('Getting all hospitals');
    return this.hospitalsService.getHospitals();
  }

  @Get('/site')
  getNearByHospitals() {
    this.logger.verbose('Getting nearby hospitals');
    return this.hospitalsService.getNearByHospitals();
  } 

  @Get('/all')
  getNationHospitals() {
    this.logger.verbose('Getting Nationwide hospitals');
    return this.hospitalsService.getNationHospitals();
  } 
}
