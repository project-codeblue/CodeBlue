import { Body, Controller, Post } from '@nestjs/common';
import { PatientsService } from '../service/patients.service';
import { PatientInfoDTO } from '../dto/patientinfo.dto';

@Controller('report')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  async createReport(@Body() reportDto: PatientInfoDTO) {
    try {
      const patient = await this.patientsService.savePatientInfo(reportDto);
      // 환자 정보 저장 성공
      return { success: true, patient };
    } catch (error) {
      // 환자 정보 저장 실패
      return { success: false, error: 'Failed to save patient information' };
    }
  }
}
