import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { LoggerService } from '../services/common';

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  constructor(private readonly loggerService: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const contextType = context.getType();
    const startTime = Date.now();

    return next.handle().pipe(
      tap(
        () => {
          if (contextType === 'http') {
            const responseTime = Date.now() - startTime;
            this.loggerService.logHttpRequest(context, responseTime);
          }
        },
        (error: Error) => {
          this.loggerService.logError(error);
        },
      ),
    );
  }
}
