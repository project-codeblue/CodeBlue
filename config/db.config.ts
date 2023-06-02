import { registerAs } from '@nestjs/config';

export default registerAs('db', () => ({
  type: process.env.RDS_TYPE || 'mysql',
  host: process.env.RDS_HOSTNAME,
  port: parseInt(process.env.RDS_PORT, 10) || 3306,
  username: process.env.RDS_USERNAME,
  password: process.env.RDS_PASSWORD,
  database: process.env.RDS_DB_NAME,
  test_database: process.env.RDS_TEST_DB_NAME,
  mode: process.env.MODE || 'development',
}));
