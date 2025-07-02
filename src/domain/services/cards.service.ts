import { Injectable } from '@nestjs/common';
import { CardValidationRequestDto } from '../../application/dtos';
import { ValidationException } from '../exception';

@Injectable()
export class CardsValidatorService {
  public validate(cardDto: CardValidationRequestDto): boolean {
    this.validateCardNumberLength(cardDto);
    this.validateDate(cardDto);
    this.validateCardNumber(cardDto);
    return true;
  }

  private validateDate(cardDto: CardValidationRequestDto): void {
    const currentDate = new Date();

    const isValid =
      (currentDate.getFullYear() === cardDto.expiryYear &&
        currentDate.getMonth() < cardDto.expiryMonth) ||
      currentDate.getFullYear() < cardDto.expiryYear;
    if (!isValid) {
      throw new ValidationException('Card has expired or invalid expiry date');
    }
  }

  private validateCardNumberLength({
    cardNumber,
  }: CardValidationRequestDto): void {
    if (![13, 15, 16].includes(cardNumber.length)) {
      throw new ValidationException(
        'Card number must be 13, 15, or 16 digits long',
      );
    }
  }

  private validateCardNumber({ cardNumber }: CardValidationRequestDto): void {
    const nums = cardNumber.split('').map(Number);
    const sum = nums.reduce((acc, cur, index) => {
      if (index % 2 === 1) {
        return acc + cur;
      } else if (cur * 2 > 9) {
        return acc + ((cur * 2) % 10) + 1;
      } else {
        return acc + cur * 2;
      }
    }, 0);
    console.log('sum of luhn:', sum);
    if (sum % 10 !== 0) {
      throw new ValidationException(
        'Invalid card number (failed Luhn algorithm check)',
      );
    }
  }
}
