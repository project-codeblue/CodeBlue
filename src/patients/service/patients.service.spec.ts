import { Test, TestingModule } from '@nestjs/testing';
import { PatientsService } from './patients.service';
import {
  emergencySymptoms,
  neurologicalSymptoms,
  respiratorySymptoms,
  circulatorySymptoms,
  injurySymptoms,
  otherSymptoms,
} from '../constants/symtoms';

describe('PatientsService', () => {
  let service: PatientsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PatientsService],
    }).compile();

    service = module.get<PatientsService>(PatientsService);

    service.setSymptomCategories([
      emergencySymptoms,
      neurologicalSymptoms,
      respiratorySymptoms,
      circulatorySymptoms,
      injurySymptoms,
      otherSymptoms,
    ]);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should calculate emergency level correctly', () => {
    const symptoms = ['소실된 의식', '뇌경색 증상', '호흡곤란'];
    const emergencyLevel = service.calculateEmergencyLevel(symptoms);

    expect(emergencyLevel).toBe(3);
  });
});
