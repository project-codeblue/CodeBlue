import {
  BaseEntity,
  Column,
  PrimaryGeneratedColumn,
  Entity,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Gender } from './patients.enum';
import { Reports } from '../reports/reports.entity';

@Entity()
export class Patients extends BaseEntity {
  @PrimaryGeneratedColumn()
  patient_id: number;

  @Column({ type: 'varchar', nullable: false })
  patient_rrn: string;

  @Column({ type: 'varchar', nullable: true })
  name: string;

  @Column({ nullable: true })
  gender: Gender;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Reports, (report) => report.patient)
  reports: Reports[];
}
