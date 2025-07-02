import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { EMPTY, Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ValidationException } from '../exception';
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

        if (error instanceof ValidationException) {
          const response = context.switchToHttp().getResponse<Response>();

          response.status(400).json({
            valid: false,
            error: {
              code: 400,
              message: error.message,
            },
          });

          return EMPTY;
        } else if (error instanceof BadRequestException) {
          response.status(400).json({
            valid: false,
            error: {
              code: 400,
              message: (error.getResponse()['message'] as string[]).join(';'),
            },
          });
          return EMPTY;
        }

        throw error;
      }),
    );
  }
}
