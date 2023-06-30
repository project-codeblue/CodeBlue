import { Injectable } from '@nestjs/common';
import { Patients } from './patients.entity';
import { Repository, DataSource } from 'typeorm';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

@Injectable()
export class PatientsRepository extends Repository<Patients> {
  constructor(private dataSource: DataSource) {
    super(Patients, dataSource.createEntityManager());
  }

  // 해당 patient_id의 환자 정보 조회
  async findPatient(patient_id: number): Promise<Patients | undefined> {
    return await this.findOne({
      where: { patient_id },
    });
  }

  // 환자 정보 입력
  async createPatientInfo(
    createPatientInfo: CreatePatientDto,
  ): Promise<Patients> {
    const { patient_rrn, name, gender } = createPatientInfo;
    const patient = this.create({
      patient_rrn: patient_rrn,
      name,
      gender,
    });

    return this.save(patient);
  }

  // 환자 정보 수정
  async updatePatientInfo(
    patient_id: number,
    updatedPatient: UpdatePatientDto,
  ): Promise<Patients> {
    const patient = await this.findOne({
      where: { patient_id },
    });

    for (const field in updatedPatient) {
      if (updatedPatient.hasOwnProperty(field)) {
        patient[field] = updatedPatient[field];
      }
    }

    return await patient.save();
  }

  // 환자의 고유값인 주민등록번호를 통해 환자 정보 조회
  async findByRRN(patient_rrn: string): Promise<Patients | undefined> {
    return await this.findOne({
      where: { patient_rrn },
    });
  }
}
