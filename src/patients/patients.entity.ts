import {
  BaseEntity,
  Column,
  PrimaryGeneratedColumn,
  Entity,
  CreateDateColumn,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Gender, BloodType } from './patients-info.enum';
import { Reports } from '../reports/reports.entity';

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

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Reports, (report) => report.patient)
  @JoinColumn({ name: 'report_id' })
  reports: Reports;
}
