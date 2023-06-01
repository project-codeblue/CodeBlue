import { Body, Controller, Post } from '@nestjs/common';
import { PatientsService } from '../service/patients.service';
import { PatientInfoDTO } from '../../reports/dto/patientinfo.dto';

@Controller('report')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}
}
