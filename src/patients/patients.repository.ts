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

  async findPatient(patient_id: number): Promise<Patients | undefined> {
    return await this.findOne({
      where: { patient_id },
    });
  }

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

  async updatePatientInfo(
    patient_id: number,
    updatedPatient: UpdatePatientDto,
  ): Promise<Patients> {
    const patient = await this.findOne({
      where: { patient_id },
    });
    console.log('patient: ', patient);
    console.log('updatedPatient: ', updatedPatient);

    for (const field in updatedPatient) {
      if (updatedPatient.hasOwnProperty(field)) {
        patient[field] = updatedPatient[field];
      }
    }

    return await patient.save();
  }

  async findByRRN(patient_rrn: string): Promise<Patients | undefined> {
    return await this.findOne({
      where: { patient_rrn },
    });
  }
}
