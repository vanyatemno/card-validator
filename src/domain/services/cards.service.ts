import { Injectable } from '@nestjs/common';
import { CardValidationRequestDto } from '../../application/dtos';
import { CardValidationException } from '../exception';

@Injectable()
export class CardsValidatorService {
  private permittedCardNumberLength = [13, 15, 16];

  /**
   * Validates card data including number, length, and expiry date
   * @param cardDto - Card validation request data
   * @returns True if valid
   * @throws CardValidationException when validation fails
   */
  public validate(cardDto: CardValidationRequestDto): boolean {
    this.validateCardNumberLength(cardDto);
    this.validateDate(cardDto);
    this.validateCardNumber(cardDto);
    return true;
  }

  /**
   * Validates card expiry date against current date
   * @param cardDto - Card validation request data
   * @throws CardValidationException if card has expired
   */
  private validateDate(cardDto: CardValidationRequestDto): void {
    const currentDate = new Date();

    const isValid =
      (currentDate.getFullYear() === cardDto.expiryYear &&
        currentDate.getMonth() <= cardDto.expiryMonth) ||
      currentDate.getFullYear() < cardDto.expiryYear;
    if (!isValid) {
      throw new CardValidationException('Card has expired');
    }
  }

  /**
   * Validates card number length (13, 15, or 16 digits)
   * @param cardDto - Card validation request data
   * @throws CardValidationException if length is invalid
   */
  private validateCardNumberLength({ cardNumber }: CardValidationRequestDto) {
    if (!this.permittedCardNumberLength.includes(cardNumber.length)) {
      throw new CardValidationException('Wrong card number length');
    }
  }

  /**
   * Validates card number using Luhn algorithm
   * @param cardDto - Card validation request data
   * @throws CardValidationException if Luhn check fails
   */
  private validateCardNumber({ cardNumber }: CardValidationRequestDto): void {
    const nums = cardNumber.split('').map(Number).reverse();
    const sum = nums.reduce((acc, cur, index) => {
      if (index % 2 === 1) {
        return acc + cur;
      } else if (cur * 2 > 9) {
        return acc + (cur * 2 - 9);
      } else {
        return acc + cur * 2;
      }
    }, 0);
    if (sum % 10 !== 0) {
      throw new CardValidationException(
        'Invalid card number (failed Luhn algorithm check)',
      );
    }
  }
}
