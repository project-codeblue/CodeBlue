import { Injectable } from '@nestjs/common';
import {
  BullModuleOptions,
  SharedBullConfigurationFactory,
} from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BullConfigProvider implements SharedBullConfigurationFactory {
  constructor(private configService: ConfigService) {}

  createSharedConfiguration(): BullModuleOptions {
    return {
      redis: {
        maxRetriesPerRequest: 20,
        host: this.configService.get('REDIS_HOST'),
        port: parseInt(this.configService.get('REDIS_PORT')),
        username: this.configService.get('REDIS_USERNAME'),
        password: this.configService.get('REDIS_PASSWORD'),
      },
    };
  }
}
