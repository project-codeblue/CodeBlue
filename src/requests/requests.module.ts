import { Module } from '@nestjs/common';
import { RequestsController } from './controller/requests.controller';
import { RequestsService } from './service/requests.service';
import { ReportsModule } from '../reports/reports.module';
import { HospitalsModule } from '../hospitals/hospitals.module';

@Module({
  imports: [ReportsModule, HospitalsModule],
  controllers: [RequestsController],
  providers: [RequestsService],
})
export class RequestsModule {}
