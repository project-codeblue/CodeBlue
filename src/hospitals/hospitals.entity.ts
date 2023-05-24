import {
  BaseEntity,
  Column,
  PrimaryGeneratedColumn,
  Entity,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Reports } from '../reports/reports.entity';

@Entity()
export class Hospitals extends BaseEntity {
  @PrimaryGeneratedColumn()
  hospital_id: number;

  @Column()
  name: string;

  @Column()
  address: string;

  @Column()
  phone: string;

  @Column('int')
  available_beds: number;

  @Column()
  latitude: number;

  @Column()
  longitude: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Reports, (report) => report.hospital, { eager: false })
  @JoinColumn({ name: 'report_id' })
  report_id: number;
}
