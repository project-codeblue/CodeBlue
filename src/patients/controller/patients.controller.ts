import { Controller, Post, Patch, Param, Body, Logger } from '@nestjs/common';
import { PatientsService } from '../service/patients.service';
import { CreatePatientDto } from '../dto/create-patient.dto';
import { PatientBodyValidationPipe } from '../pipe/patient-body-data-validation.pipe';
import { Patients } from '../patients.entity';
import { UpdatePatientDto } from '../dto/update-patient.dto';

@Controller('patient')
export class PatientsController {
  private logger = new Logger('PatientsController');
  constructor(private readonly patientsService: PatientsService) {}

  @Post('/:report_id')
  createPatientInfo(
    @Param('report_id') report_id: number,
    @Body(new PatientBodyValidationPipe()) createPatientDto: CreatePatientDto,
  ): Promise<Patients> {
    this.logger.verbose('환자 정보 입력 POST API');
    return this.patientsService.createPatientInfo(report_id, createPatientDto);
  }

  @Patch('/:patient_id')
  async updatePatientInfo(
    @Param('patient_id') patient_id: number,
    @Body(new PatientBodyValidationPipe()) updatedPatient: UpdatePatientDto,
  ): Promise<Patients> {
    this.logger.verbose('환자 정보 수정 PATCH API');
    return await this.patientsService.updatePatientInfo(
      patient_id,
      updatedPatient,
    );
  }
}
