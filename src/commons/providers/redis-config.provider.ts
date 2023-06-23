import {
  CacheModuleOptions,
  CacheOptionsFactory,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as redisCacheStore from 'cache-manager-ioredis';

@Injectable()
export class RedisConfigProvider implements CacheOptionsFactory {
  constructor(private configService: ConfigService) {}

  createCacheOptions(): CacheModuleOptions {
    return {
      store: redisCacheStore,
      host: this.configService.get('REDIS_HOST'),
      port: parseInt(this.configService.get('REDIS_PORT')),
      ttl: parseInt(this.configService.get('REDIS_TTL')),
      username: this.configService.get('REDIS_USERNAME'),
      password: this.configService.get('REDIS_PASSWORD'),
    };
  }
}
