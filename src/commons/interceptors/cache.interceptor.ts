import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  protected allowedMethods = ['GET'];
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    // 추천 병원 조회 GET 요청인 경우에만 캐시 적용
    if (this.isRequestGetRecommendedHospital(context)) {
      const request = context.switchToHttp().getRequest();
      const cacheKey = this.generateCacheKey(request);
      console.log('cacheKey:', cacheKey);
      // 캐시 데이터 확인
      const cachedData = await this.cacheManager.get(cacheKey);
      if (cachedData) {
        console.log('캐시된 데이터를 사용합니다.');
        return of(cachedData);
      }

      console.log('cacheManager:', this.cacheManager);
      // 캐시된 데이터가 없는 경우 요청 처리
      return next.handle().pipe(
        tap((data) => {
          // 데이터를 캐시에 저장
          console.log('캐시에 데이터를 저장합니다.');
          this.cacheManager.set(cacheKey, data, 60000);
        }),
      );
    }
  }

  private generateCacheKey(request: Request): string {
    // 요청 URL과 쿼리 파라미터를 기반으로 고유한 캐시 키 생성
    const url = request.url;
    console.log('url:', url);
    const queryParams = JSON.stringify(url);
    console.log('queryParams:', queryParams);
    return `${queryParams}`;
  }

  private isRequestGetRecommendedHospital(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const url = req.url;
    return (
      this.allowedMethods.includes(req.method) && url.startsWith('/hospital/')
    );
  }
}
