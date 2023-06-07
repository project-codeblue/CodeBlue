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
    BullModule.forRoot({
      redis: {
        host: 'localhost', // 일단 localhost로 설정 -> 후에 docker-compose로 변경
        port: 6379,
      },
    }), // task queue (BullQueue)를 위해 import
    BullModule.registerQueue({
      name: 'requestQueue',
    }),
  ],
  controllers: [RequestsController],
  providers: [RequestsService, RequestQueueConsumer, EventEmitter2],
})
export class RequestsModule {}
