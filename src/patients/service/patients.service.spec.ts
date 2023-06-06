import { Test, TestingModule } from '@nestjs/testing';
import { PatientsService } from './patients.service';
import { Patients } from '../patients.entity';
import { CreatePatientDto } from '../dto/create-patient.dto';
import { ReportsRepository } from '../../reports/reports.repository';
import { PatientsRepository } from '../patients.repository';
import { EntityManager } from 'typeorm';
import { Reports } from '../../reports/reports.entity';
import { UpdatePatientDto } from '../dto/update-patient.dto';
import { Gender } from '../patients.enum';

describe('PatientsService Unit Testing', () => {
  let patientsService: PatientsService;
  let patientsRepository: PatientsRepository;
  let reportsRepository: ReportsRepository;
  let entityManager: EntityManager;

  beforeEach(async () => {
    const mockPatientsRepository = {
      createPatientInfo: jest.fn(),
      updatePatientInfo: jest.fn(),
      findPatient: jest.fn(),
    };
    const mockReportsRepository = {
      findReport: jest.fn(),
      addPatientIdInReport: jest.fn(),
    };
    const mockTransaction = {
      transaction: jest.fn().mockImplementation((isolationLevel, callback) => {
        // transaction 메소드에 대한 Mock 구현을 제공합니다.
        return callback(); // 테스트 시에는 콜백 함수를 실행합니다.
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientsService,
        {
          provide: PatientsRepository,
          useValue: mockPatientsRepository,
        },
        {
          provide: ReportsRepository,
          useValue: mockReportsRepository,
        },
        {
          provide: EntityManager,
          useValue: mockTransaction,
        },
      ],
    }).compile();

    patientsService = module.get<PatientsService>(PatientsService);
    patientsRepository = module.get<PatientsRepository>(PatientsRepository);
    reportsRepository = module.get<ReportsRepository>(ReportsRepository);
    entityManager = module.get(EntityManager);
  });

  describe('createPatientInfo()', () => {
    const report_id = 1;
    const report = {
      report_id,
    } as Reports;
    const createdPatientInfo = {
      name: '홍길동',
      patient_rrn: '123456-1234567',
    } as CreatePatientDto;

    it('should create patient info', async () => {
      jest.spyOn(reportsRepository, 'findReport').mockResolvedValueOnce(report);
      jest
        .spyOn(patientsRepository, 'createPatientInfo')
        .mockResolvedValue(createdPatientInfo as Patients);
      jest.spyOn(reportsRepository, 'addPatientIdInReport');

      const result = await patientsService.createPatientInfo(
        report_id,
        createdPatientInfo,
      );

      const patient_id = result.patient_id;

      expect(result).toEqual(createdPatientInfo);
      expect(reportsRepository.findReport).toHaveBeenCalledWith(report_id);
      expect(patientsRepository.createPatientInfo).toHaveBeenCalledWith(
        createdPatientInfo,
      );
      expect(reportsRepository.addPatientIdInReport).toHaveBeenCalledWith(
        report_id,
        patient_id,
      );
    });
  });

  describe('updatePatientInfo()', () => {
    const patient_id = 1;
    const updatePatientDto: UpdatePatientDto = {
      name: '김영희',
      gender: Gender.F,
    };

    it('should update the patient info', async () => {
      const patient = {} as Patients;
      jest
        .spyOn(patientsRepository, 'findPatient')
        .mockResolvedValueOnce(patient);
      jest
        .spyOn(patientsRepository, 'updatePatientInfo')
        .mockResolvedValueOnce(patient);

      const result = await patientsService.updatePatientInfo(
        patient_id,
        updatePatientDto,
      );

      expect(patientsRepository.updatePatientInfo).toHaveBeenCalledWith(
        patient_id,
        updatePatientDto,
      );
      expect(result).toEqual(patient);
    });
  });
});
