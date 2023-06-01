import { Test, TestingModule } from '@nestjs/testing';
import { PatientsController } from './patients.controller';
import { PatientInfoDTO } from '../dto/patientinfo.dto';
import { PatientsService } from '../service/patients.service';
import { BloodType, Gender } from '../patients-info.enum';

describe('PatientsController', () => {
  let controller: PatientsController;
  let service: PatientsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PatientsController],
      providers: [PatientsService],
    }).compile();

    controller = module.get<PatientsController>(PatientsController);
    service = module.get<PatientsService>(PatientsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should save patient information', async () => {
    const patientData: PatientInfoDTO = {
      name: 'clo',
      gender: Gender.F,
      age: 30,
      blood_type: BloodType.A,
      symptoms: ['빈혈', '구토', '저체온증'],
      location: '서울특별시',
      hospital_id: 1,
      symptom_level: 3,
    };

    jest.spyOn(service, 'savePatientInfo').mockResolvedValueOnce({} as any);

    const result = await controller.createReport(patientData);

    expect(result).toEqual({ success: true, patient: {} });
    expect(service.savePatientInfo).toHaveBeenCalledWith(patientData);
  });
});
