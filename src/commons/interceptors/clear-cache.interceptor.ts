import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class ClearCacheInterceptor implements NestInterceptor {
  protected clearCacheMethods = ['POST', 'DELETE'];
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    // 이송 신청 & 철회 요청인 경우 캐시 삭제
    if (this.isRequestPostOrDelete(context)) {
      const request = context.switchToHttp().getRequest();
      console.log('request.params.report_id:', request.params.report_id);
      await this.clearCacheKeysStartingWith(request.params.report_id);
    }
    return next.handle();
  }

  private async clearCacheKeysStartingWith(reportId: string): Promise<void> {
    const cacheKeys = await this.getCacheKeysStartingWith(reportId);
    console.log('before Clear - cacheKeys:', cacheKeys);
    await Promise.all(cacheKeys.map((key) => this.cacheManager.del(key)));
  }

  private async getCacheKeysStartingWith(prefix: string): Promise<string[]> {
    const cacheKeys = await this.cacheManager.store.keys('*');
    console.log('cacheKeys:', cacheKeys);
    return cacheKeys.filter((key) => key.startsWith(`${prefix}:`));
  }

  private isRequestPostOrDelete(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    return this.clearCacheMethods.includes(req.method);
  }
}
