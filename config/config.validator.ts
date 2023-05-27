import { ConfigModuleOptions } from '@nestjs/config/dist';
import appConfig from './app.config';
import dbConfig from './db.config';
import * as Joi from 'joi';

export const ConfigValidator: ConfigModuleOptions = {
  validationSchema: Joi.object({
    PORT: Joi.number().required(),
    MODE: Joi.string().required(),
    RDS_HOSTNAME: Joi.string().required(),
    RDS_PORT: Joi.number().required(),
    RDS_USERNAME: Joi.string().required(),
    RDS_PASSWORD: Joi.string().required(),
    RDS_DB_NAME: Joi.string().required(),
  }),
  isGlobal: true,
  load: [appConfig, dbConfig],
};
