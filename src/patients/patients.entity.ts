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

  @Column({ type: 'text', nullable: true })
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

  //환자 상태를 입력받기 (Entity와 DTO이용)
  //Entity를 DTO로 변환 (환자 상태 저장)
  toDTO(): PatientInfoDTO {
    const dto = new PatientInfoDTO();
    dto.name = this.name;
    dto.gender = this.gender;
    dto.age = this.age;
    dto.blood_type = this.blood_type;
    dto.symptoms = this.symptoms;
    dto.location = this.location;
    dto.hospital_id = this.hospital_id;
    dto.symptom_level = this.symptom_level;
    return dto;
  }

  //DTO를 Entity로 변환 (전달)
  static fromDTO(dto: PatientInfoDTO): Patients {
    const entity = new Patients();
    entity.name = dto.name;
    entity.gender = dto.gender;
    entity.age = dto.age;
    entity.blood_type = dto.blood_type;
    entity.symptoms = dto.symptoms;
    entity.location = dto.location;
    entity.hospital_id = dto.hospital_id;
    entity.symptom_level = dto.symptom_level;
    return entity;
  }
}
