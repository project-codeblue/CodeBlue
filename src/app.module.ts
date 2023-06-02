import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ReportsModule } from './reports/reports.module';
import { HospitalsModule } from './hospitals/hospitals.module';
import { RequestsModule } from './requests/requests.module';
import { MysqlConfigProvider } from './commons/providers/typeorm-config.provider';
import { HTTPLoggerMiddleware } from './commons/middlewares/http-logger.middleware';
import { ConfigValidator } from '../config/config.validator';

@Module({
  imports: [
    ConfigModule.forRoot(ConfigValidator), // config 설정을 위해 import
    TypeOrmModule.forRootAsync({
      useClass: MysqlConfigProvider,
    }), // mySQL 연결을 위해 import
    ScheduleModule.forRoot(), // task scheduling을 위해 import
    ReportsModule,
    HospitalsModule,
    RequestsModule,
  ],
})
export class AppModule implements NestModule {
  configService = new ConfigService();
  private readonly isDev: boolean =
    this.configService.get('MODE') === 'development' ? true : false;

  // dev mode일 때 HTTP 요청 로그 남기는 부분
  configure(consumer: MiddlewareConsumer) {
    if (this.isDev) {
      consumer.apply(HTTPLoggerMiddleware).forRoutes('*');
    }
  }
}
