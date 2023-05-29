import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ReportsModule } from './reports/reports.module';
import { HospitalsModule } from './hospitals/hospitals.module';
import { RequestsModule } from './requests/requests.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeORMConfig } from './commons/typeorm.config';
import { HTTPLoggerMiddleware } from './commons/middlewares/http-logger.middleware';
import { ConfigModule, ConfigService } from '@nestjs/config';
import appConfig from 'config/app.config';


@Module({
  imports: [
    ConfigModule.forRoot({
      load: [appConfig],
    }),
    TypeOrmModule.forRoot(typeORMConfig),
    ReportsModule,
    HospitalsModule,
    RequestsModule,
  ],
})
export class AppModule implements NestModule {
  constructor(private readonly configService: ConfigService) {}

  private readonly isDev: boolean =
    process.env.MODE === 'development' ? true : false;

  // dev mode일 때 HTTP 요청 로그 남기는 부분
  configure(consumer: MiddlewareConsumer) {
    if (this.isDev) {
      consumer.apply(HTTPLoggerMiddleware).forRoutes('*');
    }
  }
}
