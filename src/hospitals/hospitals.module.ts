import { Module } from '@nestjs/common';
import { HospitalsController } from './controller/hospitals.controller';
import { HospitalsService } from './service/hospitals.service';
import { HospitalsRepository } from './hospitals.repository';
import { ReportsRepository } from '../reports/reports.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hospitals } from './hospitals.entity';
import { Crawling } from '../commons/middlewares/crawling';
import { KakaoMapService } from '../commons/providers/kakao-map.service';
import { MedicalOpenAPI } from '../commons/middlewares/medicalOpenAPI';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';
import redisConfig from '../../config/redis.config';
import { ConfigModule, ConfigType } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Hospitals]),
    CacheModule.register({
      imports: [ConfigModule],
      useFactory: async (config: ConfigType<typeof redisConfig>) => ({
        lagacyMode: true,
        isGlobal: true,
        name: 'redis-cache',
        store: redisStore,
        host: config.host,
        port: config.port,
        username: config.username,
        password: config.password,
        ttl: config.ttl,
      }),
      inject: [redisConfig.KEY],
    }),
    ConfigModule.forFeature(redisConfig),
  ],
  controllers: [HospitalsController],
  providers: [
    HospitalsService,
    HospitalsRepository,
    ReportsRepository,
    Crawling,
    KakaoMapService,
    MedicalOpenAPI,
  ],
  exports: [HospitalsService, HospitalsRepository],
})
export class HospitalsModule {}
