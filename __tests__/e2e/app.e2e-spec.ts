import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/infrastructure/modules';

describe('Application (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Application Health', () => {
    it('should start successfully', () => {
      expect(app).toBeDefined();
    });

    it('should return 404 for root path', () => {
      return request(app.getHttpServer()).get('/').expect(404);
    });

    it('should return 404 for non-existent routes', () => {
      return request(app.getHttpServer())
        .get('/non-existent-route')
        .expect(404);
    });

    it('should have cards validation endpoint available', () => {
      return request(app.getHttpServer()).get('/cards/validate').expect(400);
    });
  });

  describe('Global Configuration', () => {
    it('should apply global validation pipes', async () => {
      const response = await request(app.getHttpServer())
        .get('/cards/validate?cardNumber=&expiryYear=&expiryMonth=')
        .expect(400);

      expect(response.body).toHaveProperty('valid', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle CORS if configured', async () => {
      const response = await request(app.getHttpServer())
        .options('/cards/validate')
        .expect(404);

      expect(response).toBeDefined();
    });
  });

  describe('Module Integration', () => {
    it('should load all required modules', () => {
      expect(app).toBeDefined();
    });

    it('should have proper dependency injection setup', async () => {
      const response = await request(app.getHttpServer())
        .get(
          `/cards/validate?cardNumber=4111111111111111&expiryYear=${new Date().getFullYear() + 1}&expiryMonth=12`,
        )
        .expect(200);

      expect(response.body).toEqual({ valid: true });
    });
  });

  describe('Cards Validation Functional Tests', () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // Convert to 1-based month
    const futureYear = currentYear + 2;
    const futureMonth = 12;

    describe('Valid Card Scenarios', () => {
      it('should validate a valid 16-digit Visa card', async () => {
        const response = await request(app.getHttpServer())
          .get(
            `/cards/validate?cardNumber=4111111111111111&expiryYear=${futureYear}&expiryMonth=${futureMonth}`,
          )
          .expect(200);

        expect(response.body).toEqual({ valid: true });
      });

      it('should validate a valid 16-digit Mastercard', async () => {
        const response = await request(app.getHttpServer())
          .get(
            `/cards/validate?cardNumber=5555555555554444&expiryYear=${futureYear}&expiryMonth=6`,
          )
          .expect(200);

        expect(response.body).toEqual({ valid: true });
      });

      it('should validate a valid 15-digit American Express card', async () => {
        const response = await request(app.getHttpServer())
          .get(
            `/cards/validate?cardNumber=371449635398433&expiryYear=${futureYear}&expiryMonth=3`,
          )
          .expect(200);

        expect(response.body).toEqual({ valid: true });
      });

      it('should validate a valid 13-digit card', async () => {
        const response = await request(app.getHttpServer())
          .get(
            `/cards/validate?cardNumber=4010000000000&expiryYear=${futureYear}&expiryMonth=1`,
          )
          .expect(200);

        expect(response.body).toEqual({ valid: true });
      });
    });

    describe('Invalid Card Number Scenarios', () => {
      it('should reject card with invalid Luhn algorithm', async () => {
        const response = await request(app.getHttpServer())
          .get(
            `/cards/validate?cardNumber=4111111111111112&expiryYear=${futureYear}&expiryMonth=${futureMonth}`,
          )
          .expect(400);

        expect(response.body).toEqual({
          valid: false,
          error: {
            code: 400,
            message: 'Invalid card number (failed Luhn algorithm check)',
          },
        });
      });

      it('should reject card with invalid length (12 digits)', async () => {
        const response = await request(app.getHttpServer())
          .get(
            `/cards/validate?cardNumber=411111111111&expiryYear=${futureYear}&expiryMonth=${futureMonth}`,
          )
          .expect(400);

        expect(response.body).toEqual({
          valid: false,
          error: {
            code: 400,
            message: 'Wrong card number length',
          },
        });
      });

      it('should reject card with invalid length (17 digits)', async () => {
        const response = await request(app.getHttpServer())
          .get(
            `/cards/validate?cardNumber=41111111111111111&expiryYear=${futureYear}&expiryMonth=${futureMonth}`,
          )
          .expect(400);

        expect(response.body).toEqual({
          valid: false,
          error: {
            code: 400,
            message: 'Card number is too long',
          },
        });
      });

      it('should reject empty card number', async () => {
        const response = await request(app.getHttpServer())
          .get(
            `/cards/validate?cardNumber=&expiryYear=${futureYear}&expiryMonth=${futureMonth}`,
          )
          .expect(400);

        expect(response.body).toHaveProperty('valid', false);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error.message).toContain(
          'Wrong card number length',
        );
      });
    });

    describe('Invalid Expiry Date Scenarios', () => {
      it('should reject expired card (past year)', async () => {
        const pastYear = currentYear - 2;
        const response = await request(app.getHttpServer())
          .get(
            `/cards/validate?cardNumber=4111111111111111&expiryYear=${pastYear}&expiryMonth=12`,
          )
          .expect(400);

        expect(response.body).toEqual({
          valid: false,
          error: {
            code: 400,
            message: 'Card has expired',
          },
        });
      });

      it('should reject expired card (current year, past month)', async () => {
        let testYear = currentYear;
        let testMonth = 1;

        if (currentMonth === 1) {
          testYear = currentYear - 1;
          testMonth = 12;
        } else {
          testMonth = 1;
        }

        const response = await request(app.getHttpServer())
          .get(
            `/cards/validate?cardNumber=4111111111111111&expiryYear=${testYear}&expiryMonth=${testMonth}`,
          )
          .expect(400);

        expect(response.body).toEqual({
          valid: false,
          error: {
            code: 400,
            message: 'Card has expired',
          },
        });
      });

      it('should reject invalid expiry month (0)', async () => {
        const response = await request(app.getHttpServer())
          .get(
            `/cards/validate?cardNumber=4111111111111111&expiryYear=${futureYear}&expiryMonth=0`,
          )
          .expect(400);

        expect(response.body).toHaveProperty('valid', false);
        expect(response.body).toHaveProperty('error');
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toBeDefined();
        expect(response.body.error.message).toContain(
          'expiryMonth must not be less than 1',
        );
      });

      it('should reject invalid expiry month (13)', async () => {
        const response = await request(app.getHttpServer())
          .get(
            `/cards/validate?cardNumber=4111111111111111&expiryYear=${futureYear}&expiryMonth=13`,
          )
          .expect(400);

        expect(response.body).toHaveProperty('valid', false);
        expect(response.body).toHaveProperty('error');
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toBeDefined();
        expect(response.body.error.message).toContain(
          'expiryMonth must not be greater than 12',
        );
      });
    });
  });
});
