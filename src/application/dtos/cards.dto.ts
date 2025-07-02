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

export class CardValidationRequestDto {
  @IsDefined({ message: 'Card number has to be defined' })
  @IsString({ message: 'Card number has to be a string' })
  @MaxLength(16, {
    message: 'Card number is too long',
  })
  cardNumber: string;

  @IsDefined()
  @IsNotEmpty()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(1900)
  expiryYear: number;

  @IsDefined()
  @IsNotEmpty()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(1)
  @Max(12)
  expiryMonth: number;
}
