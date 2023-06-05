import { Test, TestingModule } from '@nestjs/testing';
import { PatientsService } from '../service/patients.service';
import { PatientsController } from '../controller/patients.controller';
import { Patients } from '../patients.entity';
import { CreatePatientDto } from '../dto/create-patient.dto';
import { UpdatePatientDto } from './../dto/update-patient.dto';

describe('PatientsController Unit Testing', () => {
  let patientsController: PatientsController;
  let patientsService: PatientsService;

  beforeEach(async () => {
    const mockPatientsService = {
      createPatientInfo: jest.fn().mockReturnValue({}),
      updatePatientInfo: jest.fn().mockReturnValue({}),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [PatientsController],
      providers: [{ provide: PatientsService, useValue: mockPatientsService }],
    }).compile();

    patientsController = moduleRef.get<PatientsController>(PatientsController);
    patientsService = moduleRef.get<PatientsService>(PatientsService);
  });

  describe('createPatientInfo()', () => {
    it('should return object', async () => {
      const patientInfo = {} as Patients;
      jest
        .spyOn(patientsService, 'createPatientInfo')
        .mockImplementation(() => Promise.resolve(patientInfo));

      const report_id = 1;
      const createdPatientInfo = new CreatePatientDto();

      expect(
        await patientsController.createPatientInfo(
          report_id,
          createdPatientInfo,
        ),
      ).toBe(patientInfo);
      expect(patientsService.createPatientInfo).toHaveBeenCalledWith(
        report_id,
        createdPatientInfo,
      );
    });
  });

  describe('updatePatientInfo()', () => {
    it('should return object', async () => {
      const patientInfo = {} as Patients;
      jest
        .spyOn(patientsService, 'updatePatientInfo')
        .mockImplementation(() => Promise.resolve(patientInfo));

      const patient_id = 1;
      const updatedPatientInfo = new UpdatePatientDto();

      expect(
        await patientsController.updatePatientInfo(
          patient_id,
          updatedPatientInfo,
        ),
      ).toBe(patientInfo);
      expect(patientsService.updatePatientInfo).toHaveBeenCalledWith(
        patient_id,
        updatedPatientInfo,
      );
    });
  });
});
