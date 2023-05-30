import {
  BaseEntity,
  Column,
  PrimaryGeneratedColumn,
  Entity,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Patients } from '../patients/patients.entity';
import { Hospitals } from '../hospitals/hospitals.entity';

@Entity()
export class Reports extends BaseEntity {
  @PrimaryGeneratedColumn()
  report_id: number;

  @Column({ type: 'int', nullable: false })
  symptom_level: number;

  @Column({ type: 'text', nullable: false })
  symptoms: string;

  @Column('decimal', { precision: 15, scale: 10 })
  latitude: number;

  @Column('decimal', { precision: 15, scale: 10 })
  longitude: number;

  @Column({ nullable: false, default: false })
  is_sent: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Patients, (patient) => patient.reports)
  @JoinColumn({ name: 'patient_id' })
  patient: Patients;

  @ManyToOne(() => Hospitals, (hospital) => hospital.reports)
  @JoinColumn({ name: 'hospital_id' })
  hospital: Hospitals;
}
