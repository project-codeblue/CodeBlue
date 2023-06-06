import { Module } from '@nestjs/common';
import { RequestsController } from './controller/requests.controller';
import { RequestsService } from './service/requests.service';
import { ReportsModule } from '../reports/reports.module';
import { HospitalsModule } from '../hospitals/hospitals.module';
import { BullModule } from '@nestjs/bull';
import { RequestQueueConsumer } from './requests.consumer';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Module({
  imports: [
    ReportsModule,
    HospitalsModule,
    BullModule.registerQueue({
      configKey: 'config',
      name: 'requestQueue',
    }),
  ],
  controllers: [RequestsController],
  providers: [RequestsService, RequestQueueConsumer, EventEmitter2],
})
export class RequestsModule {}
