import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { CardValidationException } from '../exception';
import { Response } from 'express';

@Injectable()
export class CardsResponseInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> | Promise<Observable<any>> {
    return next.handle().pipe(
      map((data: unknown) => {
        if (data === true) {
          return { valid: true };
        }
        if (data && typeof data === 'object' && 'valid' in data) {
          return data;
        }
        return data;
      }),
      catchError((error) => {
        const response = context.switchToHttp().getResponse<Response>();

        if (error instanceof CardValidationException) {
          response.status(400).json({
            valid: false,
            error: {
              code: 400,
              message: error.message,
            },
          });
        } else if (error instanceof BadRequestException) {
          response.status(400).json({
            valid: false,
            error: {
              code: 400,
              message: (error.getResponse()['message'] as string[]).join(';'),
            },
          });
        } else {
          response.status(500).json({
            valid: false,
            error: {
              code: 500,
              message: 'Internal Server Error',
            },
          });
        }

        return of(null);
      }),
    );
  }
}
