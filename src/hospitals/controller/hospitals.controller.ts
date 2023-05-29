import { Controller, Get } from '@nestjs/common';
import { HospitalsService } from '../service/hospitals.service';
import { Logger, Param } from '@nestjs/common';
import { Hospitals } from '../hospitals.entity';

@Controller('hospital')
export class HospitalsController {
  private logger = new Logger('HospitalsController');
  constructor(private hospitalsService: HospitalsService) {}

  @Get('/hospital/:report_id')
  getHospitals(@Param('report_id') report_id: number): Promise<Hospitals[]> {
    this.logger.verbose('Getting all hospitals');
    return this.hospitalsService.getHospitals(report_id);
  }
}
