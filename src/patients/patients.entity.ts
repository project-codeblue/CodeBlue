import {
  BaseEntity,
  Column,
  PrimaryGeneratedColumn,
  Entity,
  CreateDateColumn,
  OneToMany,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { Gender, BloodType } from '../reports/patients-info.enum';
import { Reports } from '../reports/reports.entity';
import { Hospitals } from 'src/hospitals/hospitals.entity';

@Entity()
export class Patients extends BaseEntity {
  @PrimaryGeneratedColumn()
  patients_id: number;

  @Column({ type: 'varchar', nullable: true })
  name: string;

  @Column({ nullable: true })
  gender: Gender;

  @Column({ type: 'int', nullable: true })
  age: number;

  @Column({ nullable: true })
  blood_type: BloodType;

  @Column({ type: 'int', nullable: false })
  symptom_level: number;

  @CreateDateColumn()
  createdAt: Date;
}
