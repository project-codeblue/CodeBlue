import { Module } from '@nestjs/common';
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
import { ConfigModule } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ReportsModule,
    HospitalsModule,
    BullModule.forRootAsync('bullqueue-config', {
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          maxRetriesPerRequest: 20,
          host: configService.get('redis.host'),
          port: configService.get('redis.port'),
          username: configService.get('redis.username'),
          password: configService.get('redis.password'),
        },
      }),
      inject: [ConfigService],
    }), // task queue (BullQueue)를 위해 import
    BullModule.registerQueue({
      configKey: 'bullqueue-config',
      name: 'requestQueue',
    }),
  ],
  controllers: [RequestsController],
  providers: [RequestsService, RequestQueueConsumer, EventEmitter2],
})
export class RequestsModule {
  constructor(@InjectQueue('requestQueue') private requestQueue: Queue) {}

  configure(consumer) {
    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath('/queues-board');

    createBullBoard({
      queues: [new BullAdapter(this.requestQueue)],
      serverAdapter,
    });

    consumer.apply(serverAdapter.getRouter()).forRoutes('/queues-board');
  }
}
