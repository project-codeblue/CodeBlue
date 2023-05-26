import { Catch, HttpException } from '@nestjs/common';

@Catch(HttpException)
export class HttpExceptionFilter {
  catch(exception, host) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const status = exception.getStatus();
    const error = exception.getResponse() as
      | string
      | { error: string; statusCode: number; message: string | string[] };

    // 우리가 설정한 throw new HttpException()의 경우
    if (typeof error === 'string') {
      response.status(status).json({
        success: false,
        error,
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }
    // nest 자체에서 처리해주는 error handling의 경우
    else {
      response.status(status).json({
        success: false,
        ...error,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }
  }
}
