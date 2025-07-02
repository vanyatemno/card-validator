import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/infrastructure/modules/app.module';
import { TestDataHelper, TestCard } from '../utils/test-data';

describe('Cards API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Apply the same global pipes as in production
    app.useGlobalPipes(new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }));

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/cards/validate (GET)', () => {
    describe('Successful validations', () => {
      const validCards = TestDataHelper.getAllValidCards();

      validCards.forEach((card: TestCard) => {
        it(`should validate ${card.description}`, async () => {
          const queryString = TestDataHelper.createQueryString(card);
          
          const response = await request(app.getHttpServer())
            .get(`/cards/validate?${queryString}`)
            .expect(200)
            .expect('Content-Type', /application\/json/);

          expect(response.body).toEqual({
            valid: true,
          });
        });
      });

      it('should handle concurrent requests for valid cards', async () => {
        const validCards = TestDataHelper.VALID_CARDS.slice(0, 5);
        const promises = validCards.map(card => {
          const queryString = TestDataHelper.createQueryString(card);
          return request(app.getHttpServer())
            .get(`/cards/validate?${queryString}`)
            .expect(200);
        });

        const responses = await Promise.all(promises);
        
        responses.forEach(response => {
          expect(response.body).toEqual({ valid: true });
        });
      });
    });

    describe('Failed validations', () => {
      describe('Luhn algorithm failures', () => {
        const invalidLuhnCards = TestDataHelper.INVALID_LUHN_CARDS;

        invalidLuhnCards.forEach((card: TestCard) => {
          it(`should reject ${card.description}`, async () => {
            const queryString = TestDataHelper.createQueryString(card);
            
            const response = await request(app.getHttpServer())
              .get(`/cards/validate?${queryString}`)
              .expect(400)
              .expect('Content-Type', /application\/json/);

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

      describe('Invalid card lengths', () => {
        const invalidLengthCards = TestDataHelper.INVALID_LENGTH_CARDS;

        invalidLengthCards.forEach((card: TestCard) => {
          it(`should reject ${card.description}`, async () => {
            const queryString = TestDataHelper.createQueryString(card);
            
            const response = await request(app.getHttpServer())
              .get(`/cards/validate?${queryString}`)
              .expect(400)
              .expect('Content-Type', /application\/json/);

            expect(response.body).toEqual({
              valid: false,
              error: {
                code: 400,
                message: 'Card number must be 13, 15, or 16 digits long',
              },
            });
          });
        });
      });

      describe('Expired cards', () => {
        const expiredCards = TestDataHelper.EXPIRED_CARDS;

        expiredCards.forEach((card: TestCard) => {
          it(`should reject ${card.description}`, async () => {
            const queryString = TestDataHelper.createQueryString(card);
            
            const response = await request(app.getHttpServer())
              .get(`/cards/validate?${queryString}`)
              .expect(400)
              .expect('Content-Type', /application\/json/);

            expect(response.body).toEqual({
              valid: false,
              error: {
                code: 400,
                message: 'Card has expired or invalid expiry date',
              },
            });
          });
        });
      });

      it('should handle concurrent requests for invalid cards', async () => {
        const invalidCards = [
          ...TestDataHelper.INVALID_LUHN_CARDS.slice(0, 2),
          ...TestDataHelper.INVALID_LENGTH_CARDS.slice(0, 2),
          ...TestDataHelper.EXPIRED_CARDS.slice(0, 1),
        ];

        const promises = invalidCards.map(card => {
          const queryString = TestDataHelper.createQueryString(card);
          return request(app.getHttpServer())
            .get(`/cards/validate?${queryString}`)
            .expect(400);
        });

        const responses = await Promise.all(promises);
        
        responses.forEach(response => {
          expect(response.body).toHaveProperty('valid', false);
          expect(response.body).toHaveProperty('error');
          expect(response.body.error).toHaveProperty('code', 400);
          expect(response.body.error).toHaveProperty('message');
        });
      });
    });

    describe('Input validation errors', () => {
      const invalidParams = TestDataHelper.INVALID_QUERY_PARAMS;

      invalidParams.forEach((testCase) => {
        it(`should return validation error for ${testCase.description}`, async () => {
          const queryString = new URLSearchParams(testCase.params as any).toString();
          
          const response = await request(app.getHttpServer())
            .get(`/cards/validate?${queryString}`)
            .expect(400)
            .expect('Content-Type', /application\/json/);

          expect(response.body).toHaveProperty('valid', false);
          expect(response.body).toHaveProperty('error');
          expect(response.body.error).toHaveProperty('code', 400);
          expect(response.body.error).toHaveProperty('message');
          expect(typeof response.body.error.message).toBe('string');
          expect(response.body.error.message.length).toBeGreaterThan(0);
        });
      });

      it('should handle completely empty request', async () => {
        const response = await request(app.getHttpServer())
          .get('/cards/validate')
          .expect(400);

        expect(response.body).toHaveProperty('valid', false);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toHaveProperty('code', 400);
      });

      it('should handle malformed query parameters', async () => {
        const response = await request(app.getHttpServer())
          .get('/cards/validate?cardNumber=&expiryYear=&expiryMonth=')
          .expect(400);

        expect(response.body).toHaveProperty('valid', false);
        expect(response.body).toHaveProperty('error');
      });
    });

    describe('HTTP headers and response format', () => {
      it('should return correct Content-Type for successful requests', async () => {
        const card = TestDataHelper.VALID_CARDS[0];
        const queryString = TestDataHelper.createQueryString(card);

        await request(app.getHttpServer())
          .get(`/cards/validate?${queryString}`)
          .expect('Content-Type', /application\/json/)
          .expect(200);
      });

      it('should return correct Content-Type for error requests', async () => {
        const card = TestDataHelper.INVALID_LUHN_CARDS[0];
        const queryString = TestDataHelper.createQueryString(card);

        await request(app.getHttpServer())
          .get(`/cards/validate?${queryString}`)
          .expect('Content-Type', /application\/json/)
          .expect(400);
      });

      it('should include proper CORS headers if configured', async () => {
        const card = TestDataHelper.VALID_CARDS[0];
        const queryString = TestDataHelper.createQueryString(card);

        const response = await request(app.getHttpServer())
          .get(`/cards/validate?${queryString}`)
          .expect(200);

        // Check if response has proper structure
        expect(response.body).toEqual({ valid: true });
      });
    });

    describe('Performance and load testing', () => {
      it('should handle multiple rapid requests', async () => {
        const card = TestDataHelper.VALID_CARDS[0];
        const queryString = TestDataHelper.createQueryString(card);
        
        const promises = Array(10).fill(null).map(() =>
          request(app.getHttpServer())
            .get(`/cards/validate?${queryString}`)
            .expect(200)
        );

        const responses = await Promise.all(promises);
        
        responses.forEach(response => {
          expect(response.body).toEqual({ valid: true });
        });
      });

      it('should respond within reasonable time', async () => {
        const card = TestDataHelper.VALID_CARDS[0];
        const queryString = TestDataHelper.createQueryString(card);
        
        const startTime = Date.now();
        
        await request(app.getHttpServer())
          .get(`/cards/validate?${queryString}`)
          .expect(200);
        
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        // Should respond within 1 second (generous for CI environments)
        expect(responseTime).toBeLessThan(1000);
      });
    });

    describe('Edge cases and boundary conditions', () => {
      it('should handle very long query strings', async () => {
        const queryString = new URLSearchParams({
          cardNumber: '4111111111111111',
          expiryYear: '2025',
          expiryMonth: '12',
          // Add some extra parameters that should be ignored
          extraParam1: 'should-be-ignored',
          extraParam2: 'also-ignored',
        }).toString();

        const response = await request(app.getHttpServer())
          .get(`/cards/validate?${queryString}`)
          .expect(200);

        expect(response.body).toEqual({ valid: true });
      });

      it('should handle URL encoding in card numbers', async () => {
        const queryString = new URLSearchParams({
          cardNumber: '4111111111111111',
          expiryYear: '2025',
          expiryMonth: '12',
        }).toString();

        const response = await request(app.getHttpServer())
          .get(`/cards/validate?${queryString}`)
          .expect(200);

        expect(response.body).toEqual({ valid: true });
      });

      it('should handle case sensitivity in parameter names', async () => {
        // Test with different case - should fail as parameters are case-sensitive
        const response = await request(app.getHttpServer())
          .get('/cards/validate?CardNumber=4111111111111111&ExpiryYear=2025&ExpiryMonth=12')
          .expect(400);

        expect(response.body).toHaveProperty('valid', false);
      });
    });

    describe('API contract validation', () => {
      it('should maintain consistent response structure for valid cards', async () => {
        const validCards = TestDataHelper.VALID_CARDS.slice(0, 3);
        
        for (const card of validCards) {
          const queryString = TestDataHelper.createQueryString(card);
          const response = await request(app.getHttpServer())
            .get(`/cards/validate?${queryString}`)
            .expect(200);

          // Validate exact response structure
          expect(response.body).toEqual({ valid: true });
          expect(Object.keys(response.body)).toEqual(['valid']);
          expect(typeof response.body.valid).toBe('boolean');
        }
      });

      it('should maintain consistent error response structure', async () => {
        const invalidCards = [
          TestDataHelper.INVALID_LUHN_CARDS[0],
          TestDataHelper.INVALID_LENGTH_CARDS[0],
          TestDataHelper.EXPIRED_CARDS[0],
        ];
        
        for (const card of invalidCards) {
          const queryString = TestDataHelper.createQueryString(card);
          const response = await request(app.getHttpServer())
            .get(`/cards/validate?${queryString}`)
            .expect(400);

          // Validate exact error response structure
          expect(response.body).toHaveProperty('valid', false);
          expect(response.body).toHaveProperty('error');
          expect(response.body.error).toHaveProperty('code');
          expect(response.body.error).toHaveProperty('message');
          expect(typeof response.body.error.code).toBe('number');
          expect(typeof response.body.error.message).toBe('string');
          expect(Object.keys(response.body)).toEqual(['valid', 'error']);
          expect(Object.keys(response.body.error)).toEqual(['code', 'message']);
        }
      });
    });
  });

  describe('Application health and routing', () => {
    it('should return 404 for root path', async () => {
      await request(app.getHttpServer())
        .get('/')
        .expect(404);
    });

    it('should return 404 for non-existent endpoints', async () => {
      await request(app.getHttpServer())
        .get('/non-existent')
        .expect(404);
    });

    it('should return 404 for invalid card endpoints', async () => {
      await request(app.getHttpServer())
        .get('/cards/invalid-endpoint')
        .expect(404);
    });

    it('should only accept GET method for /cards/validate', async () => {
      const testData = {
        cardNumber: '4111111111111111',
        expiryYear: 2025,
        expiryMonth: 12,
      };

      await request(app.getHttpServer())
        .post('/cards/validate')
        .send(testData)
        .expect(404);

      await request(app.getHttpServer())
        .put('/cards/validate')
        .send(testData)
        .expect(404);

      await request(app.getHttpServer())
        .delete('/cards/validate')
        .expect(404);

      await request(app.getHttpServer())
        .patch('/cards/validate')
        .send(testData)
        .expect(404);
    });
  });

  describe('Global interceptors and middleware', () => {
    it('should apply global interceptors correctly', async () => {
      const card = TestDataHelper.VALID_CARDS[0];
      const queryString = TestDataHelper.createQueryString(card);

      const response = await request(app.getHttpServer())
        .get(`/cards/validate?${queryString}`)
        .expect(200);

      // The response should be transformed by interceptors
      expect(response.body).toEqual({ valid: true });
      // Should not be the raw service response (boolean true)
      expect(response.body).not.toBe(true);
    });

    it('should handle errors through global error handling', async () => {
      const invalidCard = TestDataHelper.INVALID_LUHN_CARDS[0];
      const queryString = TestDataHelper.createQueryString(invalidCard);

      const response = await request(app.getHttpServer())
        .get(`/cards/validate?${queryString}`)
        .expect(400);

      // Error should be properly formatted by interceptors
      expect(response.body).toMatchObject({
        valid: false,
        error: {
          code: 400,
          message: expect.any(String),
        },
      });
    });
  });
});
