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

@Module({
  imports: [
    TypeOrmModule.forFeature([Hospitals]),
    CacheModule.register({
      lagacyMode: true,
      isGlobal: true,
      name: 'redis-cache',
      useFactory: async () => ({
        store: redisStore,
        host: 'localhost',
        port: 6379,
        ttl: 60,
      }),
    }),
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
