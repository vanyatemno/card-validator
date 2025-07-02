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
  @IsDefined()
  @IsString()
  @MaxLength(16)
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

  // todo: decide do i need it
  // constructor(properties: any = {}) {
  //   Object.keys(properties).forEach((key: string) => {
  //     if (allowedProperties.includes(key)) this[key as keyof this] = properties[key];
  //   });
  // }
}

// interface CardValidationResponse {
//   valid: boolean;
//   error?: {
//     code: number;
//     message: string;
//   };
// }
