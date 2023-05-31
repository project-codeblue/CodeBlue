import { Body, Controller, Post } from '@nestjs/common';
import { PatientsService } from '../service/patients.service';
import { PatientInfoDTO } from '../dto/patientinfo.dto';

@Controller('/report')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  createReport(@Body() reportDto: PatientInfoDTO) {
    const { symptoms } = reportDto;
    const emergencyLevel =
      this.patientsService.calculateEmergencyLevel(symptoms);

    return { emergencyLevel };
  }
}
