import { HttpException, HttpStatus } from '@nestjs/common';

export class ValidationException extends HttpException {
  public readonly message: string;

  constructor(message: string) {
    super(message, HttpStatus.BAD_REQUEST);
    this.message = message;
  }
}
