import { Controller } from '@nestjs/common';
import { HospitalsService } from '../service/hospitals.service';
import { Logger } from '@nestjs/common';

@Controller('hospital')
export class HospitalsController {
  private logger = new Logger('HospitalsController');
  constructor(private hospitalsService: HospitalsService) {}
}
