import {
  BaseEntity,
  Column,
  PrimaryGeneratedColumn,
  Entity,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Gender, BloodType } from './patients-info.enum';
import { Reports } from '../reports/reports.entity';
import { PatientInfoDTO } from './dto/patientinfo.dto';

@Entity()
export class Patients extends BaseEntity {
  @PrimaryGeneratedColumn()
  patients_id: number;

  @Column({ type: 'varchar', nullable: false })
  name: string;

  @Column({ nullable: false })
  gender: Gender;

  @Column({ type: 'int', nullable: false })
  age: number;

  @Column({ nullable: false })
  blood_type: BloodType;

  @Column({ type: 'text', nullable: true, array: true })
  symptoms: string[];

  // 데이터를 끌어와야하나?
  @Column({ type: 'varchar', nullable: true })
  location: string;

  // 데이터를 끌어와야하나?
  @Column({ type: 'int', nullable: true })
  hospital_id: number;

  @Column({ type: 'int', nullable: true })
  symptom_level: number;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Reports, (report) => report.patient, { eager: true })
  reports: Reports;

  // 환자 상태 정보를 저장
  static savePatientInfo(patientInfoDTO: PatientInfoDTO): Promise<Patients> {
    const patient = new Patients();
    patient.name = patientInfoDTO.name;
    patient.gender = patientInfoDTO.gender;
    patient.age = patientInfoDTO.age;
    patient.blood_type = patientInfoDTO.blood_type;
    patient.symptoms = patientInfoDTO.symptoms;
    patient.location = patientInfoDTO.location;
    patient.hospital_id = patientInfoDTO.hospital_id;
    patient.symptom_level = patientInfoDTO.symptom_level;
    return patient.save();
  }
}
