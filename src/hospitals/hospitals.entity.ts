import {
  BaseEntity,
  Column,
  PrimaryGeneratedColumn,
  Entity,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Reports } from '../reports/reports.entity';

@Entity()
export class Hospitals extends BaseEntity {
  @PrimaryGeneratedColumn()
  hospital_id: number;

  @Column({ type: 'varchar', nullable: false })
  name: string;

  @Column({ type: 'varchar', nullable: false })
  address: string;

  @Column({ type: 'varchar', nullable: false })
  phone: string;

  @Column({ type: 'int', nullable: false, default: 5 })
  available_beds: number;

  @Column('decimal', { precision: 15, scale: 10 })
  latitude: number;

  @Column('decimal', { precision: 15, scale: 10 })
  longitude: number;

  @Column({ type: 'varchar', nullable: false })
  emogList: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Reports, (report) => report.hospital)
  reports: Reports[];
}
