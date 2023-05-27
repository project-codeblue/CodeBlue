import { Injectable, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { Patients } from 'src/reports/patients.entity';
import { Hospitals } from 'src/hospitals/hospitals.entity';
import { Reports } from 'src/reports/reports.entity';
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
      database: this.config.database,
      entities: [Patients, Hospitals, Reports],
      synchronize: true,
      logging: true,
    };
  }
}
