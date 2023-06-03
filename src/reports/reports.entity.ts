import {
  BaseEntity,
  Column,
  PrimaryGeneratedColumn,
  Entity,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BloodType, AgeRange } from './reports.enum';
import { Hospitals } from '../hospitals/hospitals.entity';
import { Patients } from '../patients/patients.entity';

@Entity()
export class Reports extends BaseEntity {
  @PrimaryGeneratedColumn()
  report_id: number;

  @Column({ type: 'float', nullable: true })
  blood_pressure: number;

  @Column({ nullable: true })
  blood_type: BloodType;

  @Column({ type: 'int', nullable: true })
  symptom_level: number;

  @Column({ type: 'text', nullable: true })
  symptoms: string;

  @Column({ type: 'varchar', nullable: true })
  age_range: AgeRange;

  @Column({ nullable: false, default: false })
  is_sent: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'int', nullable: true })
  hospital_id: number;

  @Column({ type: 'int', nullable: true })
  patient_id: number;

  @ManyToOne(() => Hospitals, (hospital) => hospital.reports)
  @JoinColumn({ name: 'hospital_id' })
  hospital: Hospitals;

  @ManyToOne(() => Patients, (patient) => patient.reports)
  @JoinColumn({ name: 'patient_id' })
  patient: Patients;
}
