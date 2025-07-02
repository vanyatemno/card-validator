export interface TestCard {
  cardNumber: string;
  expiryYear: number;
  expiryMonth: number;
  description: string;
  isValid: boolean;
}

export class TestDataHelper {
  private static currentYear = new Date().getFullYear();
  private static currentMonth = new Date().getMonth() + 1;

  // Valid card numbers that pass Luhn algorithm
  static readonly VALID_CARDS: TestCard[] = [
    {
      cardNumber: '4532015112830366',
      expiryYear: this.currentYear + 1,
      expiryMonth: 12,
      description: 'Valid Visa 16-digit card',
      isValid: true,
    },
    {
      cardNumber: '4111111111111111',
      expiryYear: this.currentYear + 2,
      expiryMonth: 6,
      description: 'Valid Visa test card',
      isValid: true,
    },
    {
      cardNumber: '5555555555554444',
      expiryYear: this.currentYear + 1,
      expiryMonth: 3,
      description: 'Valid Mastercard 16-digit card',
      isValid: true,
    },
    {
      cardNumber: '372449635398432',
      expiryYear: this.currentYear + 1,
      expiryMonth: 9,
      description: 'Valid American Express 15-digit card',
      isValid: true,
    },
    {
      cardNumber: '340000005000009',
      expiryYear: this.currentYear + 3,
      expiryMonth: 11,
      description: 'Valid American Express 15-digit card',
      isValid: true,
    },
    {
      cardNumber: '4000002000018',
      expiryYear: this.currentYear + 1,
      expiryMonth: 4,
      description: 'Valid 13-digit card',
      isValid: true,
    },
    {
      cardNumber: '0000000000000000',
      expiryYear: this.currentYear + 1,
      expiryMonth: 12,
      description: 'Valid all-zeros card (passes Luhn)',
      isValid: true,
    },
  ];

  // Invalid card numbers that fail Luhn algorithm
  static readonly INVALID_LUHN_CARDS: TestCard[] = [
    {
      cardNumber: '4532015112830367',
      expiryYear: this.currentYear + 1,
      expiryMonth: 12,
      description: 'Invalid Visa card (fails Luhn)',
      isValid: false,
    },
    {
      cardNumber: '4111111111111112',
      expiryYear: this.currentYear + 1,
      expiryMonth: 6,
      description: 'Invalid Visa test card (fails Luhn)',
      isValid: false,
    },
    {
      cardNumber: '1111111111111111',
      expiryYear: this.currentYear + 1,
      expiryMonth: 12,
      description: 'Invalid all-ones card (fails Luhn)',
      isValid: false,
    },
    {
      cardNumber: '1234567890123456',
      expiryYear: this.currentYear + 1,
      expiryMonth: 8,
      description: 'Invalid sequential card (fails Luhn)',
      isValid: false,
    },
  ];

  // Cards with invalid lengths
  static readonly INVALID_LENGTH_CARDS: TestCard[] = [
    {
      cardNumber: '400000000000',
      expiryYear: this.currentYear + 1,
      expiryMonth: 12,
      description: '12-digit card (too short)',
      isValid: false,
    },
    {
      cardNumber: '40000000000000',
      expiryYear: this.currentYear + 1,
      expiryMonth: 12,
      description: '14-digit card (invalid length)',
      isValid: false,
    },
    {
      cardNumber: '45320151128303661',
      expiryYear: this.currentYear + 1,
      expiryMonth: 12,
      description: '17-digit card (too long)',
      isValid: false,
    },
    {
      cardNumber: '453201511283036612345',
      expiryYear: this.currentYear + 1,
      expiryMonth: 12,
      description: '21-digit card (way too long)',
      isValid: false,
    },
  ];

  // Cards with expired dates
  static readonly EXPIRED_CARDS: TestCard[] = [
    {
      cardNumber: '4532015112830366',
      expiryYear: this.currentYear - 1,
      expiryMonth: 12,
      description: 'Valid card number but expired (past year)',
      isValid: false,
    },
    {
      cardNumber: '4111111111111111',
      expiryYear: this.currentYear - 2,
      expiryMonth: 6,
      description: 'Valid card number but expired (2 years ago)',
      isValid: false,
    },
    ...(this.currentMonth > 1
      ? [
          {
            cardNumber: '5555555555554444',
            expiryYear: this.currentYear,
            expiryMonth: this.currentMonth - 1,
            description: 'Valid card number but expired (past month this year)',
            isValid: false,
          },
        ]
      : []),
  ];

  // Edge case cards for current year/month validation
  static readonly EDGE_CASE_CARDS: TestCard[] = [
    ...(this.currentMonth < 12 ? [{
      cardNumber: '4532015112830366',
      expiryYear: this.currentYear,
      expiryMonth: this.currentMonth + 1,
      description: 'Valid card expiring next month this year',
      isValid: true,
    }] : []),
    {
      cardNumber: '4111111111111111',
      expiryYear: this.currentYear,
      expiryMonth: 12,
      description: 'Valid card expiring December this year',
      isValid: true,
    },
  ];

  // Invalid query parameter test cases
  static readonly INVALID_QUERY_PARAMS = [
    {
      params: { cardNumber: '', expiryYear: '2025', expiryMonth: '12' },
      description: 'Empty card number',
    },
    {
      params: {
        cardNumber: '4111111111111111',
        expiryYear: '',
        expiryMonth: '12',
      },
      description: 'Empty expiry year',
    },
    {
      params: {
        cardNumber: '4111111111111111',
        expiryYear: '2025',
        expiryMonth: '',
      },
      description: 'Empty expiry month',
    },
    {
      params: {
        cardNumber: '4111111111111111',
        expiryYear: 'abc',
        expiryMonth: '12',
      },
      description: 'Non-numeric expiry year',
    },
    {
      params: {
        cardNumber: '4111111111111111',
        expiryYear: '2025',
        expiryMonth: 'xyz',
      },
      description: 'Non-numeric expiry month',
    },
    {
      params: {
        cardNumber: '4111111111111111',
        expiryYear: '1899',
        expiryMonth: '12',
      },
      description: 'Expiry year too low (< 1900)',
    },
    {
      params: {
        cardNumber: '4111111111111111',
        expiryYear: '2025',
        expiryMonth: '0',
      },
      description: 'Expiry month too low (< 1)',
    },
    {
      params: {
        cardNumber: '4111111111111111',
        expiryYear: '2025',
        expiryMonth: '13',
      },
      description: 'Expiry month too high (> 12)',
    },
    {
      params: { expiryYear: '2025', expiryMonth: '12' },
      description: 'Missing card number',
    },
    {
      params: { cardNumber: '4111111111111111', expiryMonth: '12' },
      description: 'Missing expiry year',
    },
    {
      params: { cardNumber: '4111111111111111', expiryYear: '2025' },
      description: 'Missing expiry month',
    },
  ];

  static getAllValidCards(): TestCard[] {
    return [...this.VALID_CARDS, ...this.EDGE_CASE_CARDS];
  }

  static getAllInvalidCards(): TestCard[] {
    return [
      ...this.INVALID_LUHN_CARDS,
      ...this.INVALID_LENGTH_CARDS,
      ...this.EXPIRED_CARDS,
    ];
  }

  static getAllTestCards(): TestCard[] {
    return [...this.getAllValidCards(), ...this.getAllInvalidCards()];
  }

  static createQueryString(card: Partial<TestCard>): string {
    const params = new URLSearchParams();
    if (card.cardNumber) {
      params.append('cardNumber', card.cardNumber);
    }
    if (card.expiryYear)
      params.append('expiryYear', card.expiryYear.toString());
    if (card.expiryMonth)
      params.append('expiryMonth', card.expiryMonth.toString());
    return params.toString();
  }

  static createValidResponse() {
    return { valid: true };
  }

  static createErrorResponse(message: string, code: number = 400) {
    return {
      valid: false,
      error: {
        code,
        message,
      },
    };
  }
}
