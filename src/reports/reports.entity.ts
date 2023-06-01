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

  @Column({ nullable: false, default: false })
  is_sent: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'int', nullable: false })
  patient_id: number;

  @Column({ type: 'int', nullable: true })
  hospital_id: number;

  @ManyToOne(() => Patients, (patient) => patient.reports)
  @JoinColumn({ name: 'patient_id' })
  patient: Patients;

  @ManyToOne(() => Hospitals, (hospital) => hospital.reports)
  @JoinColumn({ name: 'hospital_id' })
  hospital: Hospitals;
}
