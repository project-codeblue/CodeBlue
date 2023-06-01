import { Repository, EntityRepository } from 'typeorm';
import { Patients } from '../patients/patients.entity';

@EntityRepository(Patients)
export class PatientsRepository extends Repository<Patients> {
  //환자 정보 저장
  async savePatientInfo(patientInfo: Patients): Promise<Patients> {
    return await this.save(patientInfo);
  }
}
