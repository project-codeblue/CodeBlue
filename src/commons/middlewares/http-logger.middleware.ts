import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class HTTPLoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP'); // HTTP 프로토콜에 대한 logger
  use(req: Request, res: Response, next: NextFunction) {
    // response가 완료 (finish event)되면 로그를 남김
    res.on('finish', () => {
      this.logger.log(
        `${req.ip} ${req.method}, ${res.statusCode}`,
        req.originalUrl,
      );
    });
    next();
  }
}
