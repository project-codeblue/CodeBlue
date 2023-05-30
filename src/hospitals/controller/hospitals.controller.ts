import { Controller, Get, Logger, Param } from '@nestjs/common';
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

  @Get('/local')
  getLocalHospitals(): Promise<string[]> {
    this.logger.verbose('Getting Local Hospitals');
    return this.hospitalsService.getLocalHospitals();
  }

  @Get('/nation')
  getNationHospitals(): Promise<JSON> {
    this.logger.verbose('Getting Nationwide Hospitals');
    return this.hospitalsService.getNationHospitals();
  }

  // 이쪽 API는 쿼리스트링으로 배열 파라미터를 넘겨줘야 합니다.
  // nearBy/?emogList=A1100010+A1100011+A1400015
  // 또는
  // nearBy/?emogList=A1100010&emogList=A1100011&emogList=A1400015
  @Get('nearBy')
  getNearbyHospitals(@Param('emogList') emogList: string[]): Promise<string[]> {
    this.logger.verbose('Getting Nearby Hospitals');
    return this.hospitalsService.getNearByHospitals(emogList);
  }

  @Get('/:report_id')
  getReccomendedHospitals(
    @Param('report_id') report_id: number,
  ): Promise<Hospitals[]> {
    this.logger.verbose('Getting all hospitals');
    return this.hospitalsService.getReccomendedHospitals(report_id);
  }
}
