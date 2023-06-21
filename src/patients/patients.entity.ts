import {
  BaseEntity,
  Column,
  PrimaryGeneratedColumn,
  Entity,
  CreateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Gender } from './patients.enum';
import { Reports } from '../reports/reports.entity';

@Entity()
export class Patients extends BaseEntity {
  @PrimaryGeneratedColumn()
  patient_id: number;

  @Column({ type: 'varchar', nullable: false, unique: true })
  patient_rrn: string;

  @Column({ type: 'varchar', nullable: true })
  @Index()
  name: string;

  @Column({ nullable: true })
  gender: Gender;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Reports, (report) => report.patient, { cascade: true })
  reports: Reports[];
}
