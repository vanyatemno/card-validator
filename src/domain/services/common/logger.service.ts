import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Response } from 'express';

@Injectable()
export class LoggerService {
  private readonly logger = new Logger();

  public logHttpRequest(context: ExecutionContext, responseTime: number) {
    const { req, res } = this.extractHttpInfo(context);
    this.logger.debug(
      `${req.method} ${req.url} ${res.statusCode} : ${responseTime}ms`,
    );
  }

  public logError(error: Error) {
    this.logger.error(error);
  }

  private extractHttpInfo(context: ExecutionContext): {
    req: Request;
    res: Response;
  } {
    return {
      req: context.switchToHttp().getRequest<Request>(),
      res: context.switchToHttp().getResponse<Response>(),
    };
  }
}
