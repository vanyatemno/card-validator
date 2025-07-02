import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';

export class LoggerInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const requestType = context.getType();
    const time = Date.now();

    if (requestType === 'http') {
      return next.handle().pipe(
        tap(
          () => this.logHttpRequest(context, time),
          (error: Error) => {
            console.error(error);
          },
        ),
      );
    } else {
      return next.handle();
    }
  }

  private logHttpRequest(context: ExecutionContext, startTime: number) {
    if (context.getType() !== 'http') return;

    // todo: add log of controller and handler name

    const req = context.switchToHttp().getRequest<Request>();
    // const res = context.switchToHttp().getResponse<Response>();
    const executionTime = Date.now() - startTime;

    console.log(`[HTTP] ${req.method} ${req.url} : ${executionTime}ms`);
  }
}
