import {
  BaseEntity,
  Column,
  PrimaryGeneratedColumn,
  Entity,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Gender, BloodType } from './patients-info.enum';
import { Reports } from './reports.entity';

@Entity()
export class Patients extends BaseEntity {
  @PrimaryGeneratedColumn()
  patients_id: number;

  @Column()
  name: string;

  @Column()
  gender: Gender;

  @Column()
  age: number;

  @Column()
  blood_type: BloodType;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Reports, (report) => report.patient, { eager: true })
  reports: Reports;
}
