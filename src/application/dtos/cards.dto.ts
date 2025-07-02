import {
  IsDefined,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CardValidationRequestDto {
  @ApiProperty({
    description: 'Card number',
    example: '4111111111111111',
    maxLength: 16,
  })
  @IsDefined({ message: 'Card number has to be defined' })
  @IsString({ message: 'Card number has to be a string' })
  @MaxLength(16, {
    message: 'Card number is too long',
  })
  cardNumber: string;

  @ApiProperty({
    description: 'Card expiry year (minimum 1900)',
    example: 2025,
    minimum: 1900,
  })
  @IsDefined()
  @IsNotEmpty()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(1900)
  expiryYear: number;

  @ApiProperty({
    description: 'Card expiry month (1-12)',
    example: 12,
    minimum: 1,
    maximum: 12,
  })
  @IsDefined()
  @IsNotEmpty()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(1)
  @Max(12)
  expiryMonth: number;
}

export class CardValidationSuccessResponseDto {
  @ApiProperty({
    description: 'Indicates if the card validation was successful',
    example: true,
  })
  valid: boolean;
}

export class CardValidationErrorDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 400,
  })
  code: number;

  @ApiProperty({
    description: 'Error message describing the validation failure',
    example: 'Card has expired',
  })
  message: string;
}

export class CardValidationErrorResponseDto {
  @ApiProperty({
    description: 'Indicates if the card validation failed',
    example: false,
  })
  valid: boolean;

  @ApiProperty({
    description: 'Error details',
    type: CardValidationErrorDto,
  })
  error: CardValidationErrorDto;
}
