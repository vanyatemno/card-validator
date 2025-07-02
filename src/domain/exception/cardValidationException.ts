import { HttpException, HttpStatus } from '@nestjs/common';

export class CardValidationException extends HttpException {
  public readonly message: string;

  constructor(message: string) {
    super(message, HttpStatus.BAD_REQUEST);
    this.message = message;
  }
}
