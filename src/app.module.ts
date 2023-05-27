import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ReportsModule } from './reports/reports.module';
import { HospitalsModule } from './hospitals/hospitals.module';
import { RequestsModule } from './requests/requests.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MysqlConfigProvider } from './commons/config/typeorm-config.provider';
import { HTTPLoggerMiddleware } from './commons/middlewares/http-logger.middleware';
import { ConfigModule } from '@nestjs/config';
import { ConfigValidator } from 'config/config.validator';

@Module({
  imports: [
    ConfigModule.forRoot(ConfigValidator),
    TypeOrmModule.forRootAsync({
      useClass: MysqlConfigProvider,
    }),
    ReportsModule,
    HospitalsModule,
    RequestsModule,
  ],
})
export class AppModule implements NestModule {
  private readonly isDev: boolean =
    process.env.MODE === 'development' ? true : false;

  // dev mode일 때 HTTP 요청 로그 남기는 부분
  configure(consumer: MiddlewareConsumer) {
    if (this.isDev) {
      consumer.apply(HTTPLoggerMiddleware).forRoutes('*');
    }
  }
}
