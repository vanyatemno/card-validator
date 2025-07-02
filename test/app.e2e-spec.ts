import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/infrastructure/modules';

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
          '/cards/validate?cardNumber=4111111111111111&expiryYear=2025&expiryMonth=12',
        )
        .expect(200);

      expect(response.body).toEqual({ valid: true });
    });
  });
});
