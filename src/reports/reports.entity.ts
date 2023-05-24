import {
  BaseEntity,
  Column,
  PrimaryGeneratedColumn,
  Entity,
  ManyToOne,
  OneToMany,
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

  @Column()
  latitude: number;

  @Column()
  longitude: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Patients, (patient) => patient.reports, { eager: false })
  patient: Patients;

  @OneToMany(() => Hospitals, (hospital) => hospital.report, { eager: true })
  hospital: Hospitals;
}

// timestamp
