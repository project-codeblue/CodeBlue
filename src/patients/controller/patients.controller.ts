import { Controller, Post, Patch, Param, Body, Logger } from '@nestjs/common';
import { PatientsService } from '../service/patients.service';
import { CreatePatientDto } from '../dto/create-patient.dto';
import { GenderFromRrnPipe } from '../pipe/gender-from-rrn.pipe';
import { Patients } from '../patients.entity';
import { UpdatePatientDto } from '../dto/update-patient.dto';

@Controller('patient')
export class PatientsController {
  private logger = new Logger('PatientsController');
  constructor(private readonly patientsService: PatientsService) {}

  @Post('/:report_id')
  createPatientInfo(
    @Param('report_id') report_id: number,
    @Body(new GenderFromRrnPipe()) createPatientDto: CreatePatientDto, // 주민등록번호를 받으면 자동으로 gender 판정되어 넘겨짐
  ): Promise<Patients> {
    this.logger.verbose('환자 정보 입력 POST API');
    return this.patientsService.createPatientInfo(report_id, createPatientDto);
  }

  @Patch('/:patient_id')
  async updatePatientInfo(
    @Param('patient_id') patient_id: number,
    @Body(new GenderFromRrnPipe()) updatedPatient: UpdatePatientDto,
  ): Promise<Patients> {
    this.logger.verbose('환자 정보 수정 PATCH API');
    return await this.patientsService.updatePatientInfo(
      patient_id,
      updatedPatient,
    );
  }
}
