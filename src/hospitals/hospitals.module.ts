import { Module } from '@nestjs/common';
import { HospitalsController } from './controller/hospitals.controller';
import { HospitalsService } from './service/hospitals.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hospitals } from './hospitals.entity';
import { HospitalsRepository } from './hospitals.repository';
import { ConfigModule } from '@nestjs/config'; // ConfigModule 임포트 추가
import appConfig from 'config/app.config'; // CONFIGURATION(app)이 정의된 모듈 임포트

@Module({
  imports: [TypeOrmModule.forFeature([Hospitals]),ConfigModule.forRoot({
    load: [appConfig], // CONFIGURATION(app)이 정의된 모듈 추가
  }),],
  controllers: [HospitalsController],
  providers: [HospitalsService],
})
export class HospitalsModule {}
