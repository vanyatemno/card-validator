import { CardsValidatorService } from '../../src/domain/services/cards.service';
import { CardValidationRequestDto } from '../../src/application/dtos';
import { ValidationException } from '../../src/domain/exception';

describe('CardsValidatorService', () => {
  let service: CardsValidatorService;

  beforeEach(() => {
    service = new CardsValidatorService();
  });

  describe('validate', () => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    it('should return true for valid card with 16 digits', () => {
      const validCard: CardValidationRequestDto = {
        cardNumber: '4532015112830366',
        expiryYear: currentYear + 1,
        expiryMonth: 12,
      };

      expect(service.validate(validCard)).toBe(true);
    });

    it('should return true for valid card with 15 digits', () => {
      const validCard: CardValidationRequestDto = {
        cardNumber: '340000005000009',
        expiryYear: currentYear + 1,
        expiryMonth: 6,
      };

      expect(service.validate(validCard)).toBe(true);
    });

    it('should return true for valid card with 13 digits', () => {
      const validCard: CardValidationRequestDto = {
        cardNumber: '4000002000018',
        expiryYear: currentYear + 1,
        expiryMonth: 3,
      };

      expect(service.validate(validCard)).toBe(true);
    });

    it('should throw ValidationException for card number with 12 digits', () => {
      const invalidCard: CardValidationRequestDto = {
        cardNumber: '400000000000',
        expiryYear: currentYear + 1,
        expiryMonth: 12,
      };

      expect(() => service.validate(invalidCard)).toThrow(ValidationException);
      expect(() => service.validate(invalidCard)).toThrow(
        'Card number must be 13, 15, or 16 digits long',
      );
    });

    it('should throw ValidationException for card number with 17 digits', () => {
      const invalidCard: CardValidationRequestDto = {
        cardNumber: '45320151128303661',
        expiryYear: currentYear + 1,
        expiryMonth: 12,
      };

      expect(() => service.validate(invalidCard)).toThrow(ValidationException);
      expect(() => service.validate(invalidCard)).toThrow(
        'Card number must be 13, 15, or 16 digits long',
      );
    });

    it('should throw ValidationException for card number with 14 digits', () => {
      const invalidCard: CardValidationRequestDto = {
        cardNumber: '40000000000000',
        expiryYear: currentYear + 1,
        expiryMonth: 12,
      };

      expect(() => service.validate(invalidCard)).toThrow(ValidationException);
      expect(() => service.validate(invalidCard)).toThrow(
        'Card number must be 13, 15, or 16 digits long',
      );
    });

    it('should throw ValidationException for expired card (past year)', () => {
      const expiredCard: CardValidationRequestDto = {
        cardNumber: '4532015112830366',
        expiryYear: currentYear - 1,
        expiryMonth: 12,
      };

      expect(() => service.validate(expiredCard)).toThrow(ValidationException);
      expect(() => service.validate(expiredCard)).toThrow(
        'Card has expired or invalid expiry date',
      );
    });

    it('should throw ValidationException for expired card (current year, past month)', () => {
      const expiredCard: CardValidationRequestDto = {
        cardNumber: '4532015112830366',
        expiryYear: currentYear,
        expiryMonth: currentMonth - 1 > 0 ? currentMonth - 1 : 12,
      };

      if (currentMonth > 1) {
        expect(() => service.validate(expiredCard)).toThrow(
          ValidationException,
        );
        expect(() => service.validate(expiredCard)).toThrow(
          'Card has expired or invalid expiry date',
        );
      }
    });

    it('should return true for card expiring in current year, future month', () => {
      const validCard: CardValidationRequestDto = {
        cardNumber: '4532015112830366',
        expiryYear: currentYear,
        expiryMonth: currentMonth + 1 <= 12 ? currentMonth + 1 : 1,
      };

      if (currentMonth < 12) {
        expect(service.validate(validCard)).toBe(true);
      }
    });

    it('should throw ValidationException for invalid card number (fails Luhn algorithm)', () => {
      const invalidCard: CardValidationRequestDto = {
        cardNumber: '4532015112830367',
        expiryYear: currentYear + 1,
        expiryMonth: 12,
      };

      expect(() => service.validate(invalidCard)).toThrow(ValidationException);
      expect(() => service.validate(invalidCard)).toThrow(
        'Invalid card number (failed Luhn algorithm check)',
      );
    });

    it('should return true for all zeros card number that passes Luhn', () => {
      const validCard: CardValidationRequestDto = {
        cardNumber: '0000000000000000',
        expiryYear: currentYear + 1,
        expiryMonth: 12,
      };

      expect(service.validate(validCard)).toBe(true);
    });

    it('should throw ValidationException for card number with all same digits', () => {
      const invalidCard: CardValidationRequestDto = {
        cardNumber: '1111111111111111',
        expiryYear: currentYear + 1,
        expiryMonth: 12,
      };

      expect(() => service.validate(invalidCard)).toThrow(ValidationException);
      expect(() => service.validate(invalidCard)).toThrow(
        'Invalid card number (failed Luhn algorithm check)',
      );
    });

    it('should return true for valid Visa card number', () => {
      const validCard: CardValidationRequestDto = {
        cardNumber: '4111111111111111',
        expiryYear: currentYear + 1,
        expiryMonth: 12,
      };

      expect(service.validate(validCard)).toBe(true);
    });

    it('should return true for valid Mastercard number', () => {
      const validCard: CardValidationRequestDto = {
        cardNumber: '5555555555554444',
        expiryYear: currentYear + 1,
        expiryMonth: 12,
      };

      expect(service.validate(validCard)).toBe(true);
    });

    it('should return true for valid American Express number', () => {
      const validCard: CardValidationRequestDto = {
        cardNumber: '372449635398432',
        expiryYear: currentYear + 1,
        expiryMonth: 12,
      };

      expect(service.validate(validCard)).toBe(true);
    });

    it('should throw ValidationException for card with future year but invalid Luhn', () => {
      const invalidCard: CardValidationRequestDto = {
        cardNumber: '4111111111111112',
        expiryYear: currentYear + 5,
        expiryMonth: 12,
      };

      expect(() => service.validate(invalidCard)).toThrow(ValidationException);
      expect(() => service.validate(invalidCard)).toThrow(
        'Invalid card number (failed Luhn algorithm check)',
      );
    });
  });
});
