import { Module, MiddlewareConsumer } from '@nestjs/common';
import { RequestsController } from './controller/requests.controller';
import { RequestsService } from './service/requests.service';
import { ReportsModule } from '../reports/reports.module';
import { HospitalsModule } from '../hospitals/hospitals.module';
import { BullModule, InjectQueue } from '@nestjs/bull';
import { RequestQueueConsumer } from './requests.consumer';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { createBullBoard } from '@bull-board/api';
import { ExpressAdapter } from '@bull-board/express';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { Queue } from 'bull';
import { BullConfigProvider } from '../commons/providers/bull-config.provider';
import { RedisConfigProvider } from '../commons/providers/redis-config.provider';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    ReportsModule,
    HospitalsModule,
    BullModule.forRootAsync('bullqueue-config', {
      useClass: BullConfigProvider,
    }),
    BullModule.registerQueue({
      configKey: 'bullqueue-config',
      name: 'requestQueue',
    }),
    CacheModule.registerAsync({
      useClass: RedisConfigProvider,
    }),
  ],
  controllers: [RequestsController],
  providers: [RequestsService, RequestQueueConsumer, EventEmitter2],
})
export class RequestsModule {
  // bull-board UI 연결을 위한 설정
  constructor(@InjectQueue('requestQueue') private requestQueue: Queue) {}

  configure(consumer: MiddlewareConsumer) {
    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath('/queues-board');

    createBullBoard({
      queues: [new BullAdapter(this.requestQueue)],
      serverAdapter,
    });

    consumer.apply(serverAdapter.getRouter()).forRoutes('/queues-board');
  }
}
