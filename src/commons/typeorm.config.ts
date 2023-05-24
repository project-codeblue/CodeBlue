import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Hospitals } from 'src/hospitals/hospitals.entity';
import { Reports } from 'src/reports/reports.entity';
import { Patients } from 'src/reports/patients.entity';
import * as dotenv from 'dotenv';

dotenv.config();
export const typeORMConfig: TypeOrmModuleOptions = {
  type: 'mysql',
  host: process.env.RDS_HOSTNAME,
  port: parseInt(process.env.RDS_PORT),
  username: process.env.RDS_USERNAME,
  password: process.env.RDS_PASSWORD,
  database: process.env.RDS_DB_NAME,
  entities: [Hospitals, Patients, Reports],
  synchronize: true, // 한번 true한 뒤로 false해줘야지 db에 데이터가 안날라감
};
