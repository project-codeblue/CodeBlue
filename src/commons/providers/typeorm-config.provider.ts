import { Injectable, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { Hospitals } from '../../hospitals/hospitals.entity';
import { Reports } from '../../reports/reports.entity';
import { Patients } from '../../patients/patients.entity';
import dbConfig from '../../../config/db.config';

@Injectable()
export class MysqlConfigProvider implements TypeOrmOptionsFactory {
  constructor(
    @Inject(dbConfig.KEY) private config: ConfigType<typeof dbConfig>,
  ) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'mysql',
      host: this.config.host,
      port: this.config.port,
      username: this.config.username,
      password: this.config.password,
      database:
        this.config.mode === 'test'
          ? this.config.test_database
          : this.config.database,
      entities: [Hospitals, Reports, Patients],
      synchronize: this.config.mode === 'test',
      dropSchema: this.config.mode === 'test',
      logging: this.config.mode !== 'production',
    };
  }
}
