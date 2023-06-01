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
import { Gender, BloodType } from './reports.enum';
import { Hospitals } from '../hospitals/hospitals.entity';

@Entity()
export class Reports extends BaseEntity {
  @PrimaryGeneratedColumn()
  report_id: number;

  @Column({ type: 'varchar', nullable: true })
  name: string;

  @Column({ nullable: true })
  gender: Gender;

  @Column({ type: 'int', nullable: true })
  age: number;

  @Column({ nullable: true })
  blood_type: BloodType;

  @Column({ type: 'int', nullable: true })
  symptom_level: number;

  @Column({ type: 'text', nullable: true })
  symptoms: string;

  @Column({ nullable: false, default: false })
  is_sent: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'int', nullable: true })
  hospital_id: number;

  @ManyToOne(() => Hospitals, (hospital) => hospital.reports)
  @JoinColumn({ name: 'hospital_id' })
  hospital: Hospitals;
}
