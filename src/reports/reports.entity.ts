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
import { Patients } from './patients.entity';
import { Hospitals } from '../hospitals/hospitals.entity';

@Entity()
export class Reports extends BaseEntity {
  @PrimaryGeneratedColumn()
  report_id: number;

  @Column('int')
  symptom_level: number;

  @Column('text')
  symptoms: string;

  @Column('float')
  latitude: number;

  @Column({ default: false })
  is_sent: boolean;

  @Column('float')
  longitude: number;

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
