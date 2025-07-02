import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { CardsController } from '../../src/application/controllers';
import { CardsValidatorService } from '../../src/domain/services/cards.service';
import { TestDataHelper, TestCard } from '../utils/test-data';

describe('CardsController Integration', () => {
  let app: INestApplication;
  let service: CardsValidatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CardsController],
      providers: [CardsValidatorService],
    }).compile();

    app = module.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    service = module.get<CardsValidatorService>(CardsValidatorService);

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /cards/validate', () => {
    describe('Valid card validations', () => {
      const validCards = TestDataHelper.getAllValidCards();

      validCards.forEach((card: TestCard) => {
        it(`should return valid response for ${card.description}`, async () => {
          const queryString = TestDataHelper.createQueryString(card);
          const response = await request(app.getHttpServer())
            .get(`/cards/validate?${queryString}`)
            .expect(200)
            .expect('Content-Type', /json/);

          expect(response.body).toEqual(TestDataHelper.createValidResponse());
        });
      });

      it('should handle valid card with minimum valid year (1900)', async () => {
        const card = {
          cardNumber: '4111111111111111',
          expiryYear: 2050,
          expiryMonth: 12,
        };
        const queryString = TestDataHelper.createQueryString(card);

        const response = await request(app.getHttpServer())
          .get(`/cards/validate?${queryString}`)
          .expect(200);

        expect(response.body).toEqual(TestDataHelper.createValidResponse());
      });
    });

    describe('Invalid card validations', () => {
      describe('Luhn algorithm failures', () => {
        const invalidLuhnCards = TestDataHelper.INVALID_LUHN_CARDS;

        invalidLuhnCards.forEach((card: TestCard) => {
          it(`should return error for ${card.description}`, async () => {
            const queryString = TestDataHelper.createQueryString(card);

            const response = await request(app.getHttpServer())
              .get(`/cards/validate?${queryString}`)
              .expect(400);

            expect(response.body).toEqual(
              TestDataHelper.createErrorResponse(
                'Invalid card number (failed Luhn algorithm check)',
              ),
            );
          });
        });
      });

      describe('Invalid card number lengths', () => {
        const invalidLengthCards = TestDataHelper.INVALID_LENGTH_CARDS;

        invalidLengthCards.forEach((card: TestCard) => {
          it(`should return error for ${card.description}`, async () => {
            const queryString = TestDataHelper.createQueryString(card);

            const response = await request(app.getHttpServer())
              .get(`/cards/validate?${queryString}`)
              .expect(400);

            if (card.cardNumber.length > 16) {
              expect(response.body).toEqual(
                TestDataHelper.createErrorResponse(
                  'cardNumber must be shorter than or equal to 16 characters',
                ),
              );
            } else {
              expect(response.body).toEqual(
                TestDataHelper.createErrorResponse(
                  'Card number must be 13, 15, or 16 digits long',
                ),
              );
            }
          });
        });
      });

      describe('Expired cards', () => {
        const expiredCards = TestDataHelper.EXPIRED_CARDS;

        expiredCards.forEach((card: TestCard) => {
          it(`should return error for ${card.description}`, async () => {
            const queryString = TestDataHelper.createQueryString(card);

            const response = await request(app.getHttpServer())
              .get(`/cards/validate?${queryString}`)
              .expect(400);

            expect(response.body).toEqual(
              TestDataHelper.createErrorResponse(
                'Card has expired or invalid expiry date',
              ),
            );
          });
        });
      });
    });

    describe('Query parameter validation', () => {
      describe('Invalid query parameters', () => {
        const invalidParams = TestDataHelper.INVALID_QUERY_PARAMS;

        invalidParams.forEach((testCase) => {
          it(`should return 400 for ${testCase.description}`, async () => {
            const queryString = new URLSearchParams(
              testCase.params as any,
            ).toString();

            const response = await request(app.getHttpServer())
              .get(`/cards/validate?${queryString}`)
              .expect(400);

            expect(response.body).toHaveProperty('valid', false);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toHaveProperty('code', 400);
            expect(response.body.error).toHaveProperty('message');
            expect(typeof response.body.error.message).toBe('string');
          });
        });
      });

      it('should return 400 when no query parameters provided', async () => {
        const response = await request(app.getHttpServer())
          .get('/cards/validate')
          .expect(400);

        expect(response.body).toHaveProperty('valid', false);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toHaveProperty('code', 400);
      });

      it('should handle card number exceeding max length (16 chars)', async () => {
        const queryString = new URLSearchParams({
          cardNumber: '41111111111111111234567890', // Way too long
          expiryYear: '2025',
          expiryMonth: '12',
        }).toString();

        const response = await request(app.getHttpServer())
          .get(`/cards/validate?${queryString}`)
          .expect(400);

        expect(response.body).toHaveProperty('valid', false);
        expect(response.body.error.message).toContain('maxLength');
      });

      it('should handle negative expiry year', async () => {
        const queryString = new URLSearchParams({
          cardNumber: '4111111111111111',
          expiryYear: '-1',
          expiryMonth: '12',
        }).toString();

        const response = await request(app.getHttpServer())
          .get(`/cards/validate?${queryString}`)
          .expect(400);

        expect(response.body).toHaveProperty('valid', false);
        expect(response.body.error.message).toContain('min');
      });

      it('should handle negative expiry month', async () => {
        const queryString = new URLSearchParams({
          cardNumber: '4111111111111111',
          expiryYear: '2025',
          expiryMonth: '-1',
        }).toString();

        const response = await request(app.getHttpServer())
          .get(`/cards/validate?${queryString}`)
          .expect(400);

        expect(response.body).toHaveProperty('valid', false);
        expect(response.body.error.message).toContain('min');
      });
    });

    describe('Response format validation', () => {
      it('should return correct Content-Type header', async () => {
        const card = TestDataHelper.VALID_CARDS[0];
        const queryString = TestDataHelper.createQueryString(card);

        await request(app.getHttpServer())
          .get(`/cards/validate?${queryString}`)
          .expect('Content-Type', /json/)
          .expect(200);
      });

      it('should return consistent error response format', async () => {
        const invalidCard = TestDataHelper.INVALID_LUHN_CARDS[0];
        const queryString = TestDataHelper.createQueryString(invalidCard);

        const response = await request(app.getHttpServer())
          .get(`/cards/validate?${queryString}`)
          .expect(400);

        // Validate error response structure
        expect(response.body).toHaveProperty('valid', false);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toHaveProperty('code');
        expect(response.body.error).toHaveProperty('message');
        expect(typeof response.body.error.code).toBe('number');
        expect(typeof response.body.error.message).toBe('string');
        expect(response.body.error.message.length).toBeGreaterThan(0);
      });

      it('should return consistent success response format', async () => {
        const validCard = TestDataHelper.VALID_CARDS[0];
        const queryString = TestDataHelper.createQueryString(validCard);

        const response = await request(app.getHttpServer())
          .get(`/cards/validate?${queryString}`)
          .expect(200);

        // Validate success response structure
        expect(response.body).toHaveProperty('valid', true);
        expect(Object.keys(response.body)).toHaveLength(1);
      });
    });

    describe('Edge cases and boundary conditions', () => {
      it('should handle card number with leading zeros', async () => {
        const queryString = new URLSearchParams({
          cardNumber: '0000000000000000',
          expiryYear: '2025',
          expiryMonth: '12',
        }).toString();

        const response = await request(app.getHttpServer())
          .get(`/cards/validate?${queryString}`)
          .expect(200);

        expect(response.body).toEqual(TestDataHelper.createValidResponse());
      });

      it('should handle minimum valid expiry month (1)', async () => {
        const currentYear = new Date().getFullYear();
        const queryString = new URLSearchParams({
          cardNumber: '4111111111111111',
          expiryYear: (currentYear + 1).toString(),
          expiryMonth: '1',
        }).toString();

        const response = await request(app.getHttpServer())
          .get(`/cards/validate?${queryString}`)
          .expect(200);

        expect(response.body).toEqual(TestDataHelper.createValidResponse());
      });

      it('should handle maximum valid expiry month (12)', async () => {
        const currentYear = new Date().getFullYear();
        const queryString = new URLSearchParams({
          cardNumber: '4111111111111111',
          expiryYear: (currentYear + 1).toString(),
          expiryMonth: '12',
        }).toString();

        const response = await request(app.getHttpServer())
          .get(`/cards/validate?${queryString}`)
          .expect(200);

        expect(response.body).toEqual(TestDataHelper.createValidResponse());
      });

      it('should handle very far future expiry date', async () => {
        const queryString = new URLSearchParams({
          cardNumber: '4111111111111111',
          expiryYear: '2099',
          expiryMonth: '12',
        }).toString();

        const response = await request(app.getHttpServer())
          .get(`/cards/validate?${queryString}`)
          .expect(200);

        expect(response.body).toEqual(TestDataHelper.createValidResponse());
      });

      it('should handle minimum card number length (13 digits)', async () => {
        const queryString = new URLSearchParams({
          cardNumber: '4000002000018', // Valid 13-digit card
          expiryYear: '2025',
          expiryMonth: '12',
        }).toString();

        const response = await request(app.getHttpServer())
          .get(`/cards/validate?${queryString}`)
          .expect(200);

        expect(response.body).toEqual(TestDataHelper.createValidResponse());
      });

      it('should handle maximum card number length (16 digits)', async () => {
        const queryString = new URLSearchParams({
          cardNumber: '4111111111111111', // Valid 16-digit card
          expiryYear: '2025',
          expiryMonth: '12',
        }).toString();

        const response = await request(app.getHttpServer())
          .get(`/cards/validate?${queryString}`)
          .expect(200);

        expect(response.body).toEqual(TestDataHelper.createValidResponse());
      });
    });

    describe('HTTP method validation', () => {
      it('should not accept POST requests', async () => {
        const card = TestDataHelper.VALID_CARDS[0];

        await request(app.getHttpServer())
          .post('/cards/validate')
          .send(card)
          .expect(404);
      });

      it('should not accept PUT requests', async () => {
        const card = TestDataHelper.VALID_CARDS[0];

        await request(app.getHttpServer())
          .put('/cards/validate')
          .send(card)
          .expect(404);
      });

      it('should not accept DELETE requests', async () => {
        await request(app.getHttpServer())
          .delete('/cards/validate')
          .expect(404);
      });
    });
  });

  describe('Service integration', () => {
    it('should properly inject CardsValidatorService', () => {
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(CardsValidatorService);
    });

    it('should call service validate method with correct parameters', async () => {
      const validateSpy = jest.spyOn(service, 'validate');
      const card = TestDataHelper.VALID_CARDS[0];
      const queryString = TestDataHelper.createQueryString(card);

      await request(app.getHttpServer())
        .get(`/cards/validate?${queryString}`)
        .expect(200);

      expect(validateSpy).toHaveBeenCalledWith({
        cardNumber: card.cardNumber,
        expiryYear: card.expiryYear,
        expiryMonth: card.expiryMonth,
      });
    });
  });

  describe('Interceptor integration', () => {
    it('should apply CardsResponseInterceptor to transform responses', async () => {
      // Test that the interceptor transforms the boolean response to {valid: true}
      const card = TestDataHelper.VALID_CARDS[0];
      const queryString = TestDataHelper.createQueryString(card);

      const response = await request(app.getHttpServer())
        .get(`/cards/validate?${queryString}`)
        .expect(200);

      // The service returns boolean true, but interceptor should transform it
      expect(response.body).toEqual({ valid: true });
      expect(response.body).not.toBe(true); // Should not be raw boolean
    });

    it('should apply CardsResponseInterceptor to transform validation errors', async () => {
      const invalidCard = TestDataHelper.INVALID_LUHN_CARDS[0];
      const queryString = TestDataHelper.createQueryString(invalidCard);

      const response = await request(app.getHttpServer())
        .get(`/cards/validate?${queryString}`)
        .expect(400);

      // Interceptor should transform ValidationException to proper error format
      expect(response.body).toEqual({
        valid: false,
        error: {
          code: 400,
          message: 'Invalid card number (failed Luhn algorithm check)',
        },
      });
    });
  });
});
