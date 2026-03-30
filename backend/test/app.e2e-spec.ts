import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';

describe('Product Reviews API (e2e)', () => {
  let app: INestApplication;
  let _prisma: PrismaService;
  let authToken: string;
  let testProductId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    await app.init();
    _prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth', () => {
    const testUser = {
      email: `e2e-${Date.now()}@test.com`,
      username: `e2euser${Date.now()}`,
      password: 'testpass123',
    };

    it('POST /api/auth/register - should register a new user', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testUser)
        .expect(201)
        .expect((res) => {
          expect(res.body.accessToken).toBeDefined();
          expect(res.body.user.email).toBe(testUser.email);
          expect(res.body.user.username).toBe(testUser.username);
          authToken = res.body.accessToken;
        });
    });

    it('POST /api/auth/register - should reject duplicate email', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testUser)
        .expect(409);
    });

    it('POST /api/auth/login - should login with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(201)
        .expect((res) => {
          expect(res.body.accessToken).toBeDefined();
        });
    });

    it('POST /api/auth/login - should reject invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'wrongpassword' })
        .expect(401);
    });

    it('GET /api/auth/profile - should return user profile with token', () => {
      return request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.email).toBe(testUser.email);
        });
    });

    it('GET /api/auth/profile - should reject without token', () => {
      return request(app.getHttpServer())
        .get('/api/auth/profile')
        .expect(401);
    });
  });

  describe('Products', () => {
    it('GET /api/products - should return paginated products', () => {
      return request(app.getHttpServer())
        .get('/api/products')
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeDefined();
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.meta).toBeDefined();
          expect(res.body.meta.total).toBeGreaterThan(0);
          testProductId = res.body.data[0].id;
        });
    });

    it('GET /api/products - should filter by category', () => {
      return request(app.getHttpServer())
        .get('/api/products?category=Electronics')
        .expect(200)
        .expect((res) => {
          res.body.data.forEach((product: any) => {
            expect(product.category).toBe('Electronics');
          });
        });
    });

    it('GET /api/products - should search by name', () => {
      return request(app.getHttpServer())
        .get('/api/products?search=Sony')
        .expect(200)
        .expect((res) => {
          expect(res.body.data.length).toBeGreaterThan(0);
        });
    });

    it('GET /api/products - should sort by price ascending', () => {
      return request(app.getHttpServer())
        .get('/api/products?sort=price_asc')
        .expect(200)
        .expect((res) => {
          const prices = res.body.data.map((p: any) => parseFloat(p.price));
          for (let i = 1; i < prices.length; i++) {
            expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
          }
        });
    });

    it('GET /api/products/categories - should return category list', () => {
      return request(app.getHttpServer())
        .get('/api/products/categories')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });

    it('GET /api/products/:id - should return product detail with reviews', () => {
      return request(app.getHttpServer())
        .get(`/api/products/${testProductId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(testProductId);
          expect(res.body.reviews).toBeDefined();
          expect(res.body.ratingDistribution).toBeDefined();
          expect(res.body.ratingDistribution).toHaveLength(5);
        });
    });

    it('GET /api/products/:id - should 404 for non-existent product', () => {
      return request(app.getHttpServer())
        .get('/api/products/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });

  describe('Reviews', () => {
    let reviewId: string;

    it('POST /api/products/:id/reviews - should create a review', () => {
      return request(app.getHttpServer())
        .post(`/api/products/${testProductId}/reviews`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rating: 4,
          title: 'E2E Test Review',
          body: 'This is a review created during end-to-end testing.',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.rating).toBe(4);
          expect(res.body.title).toBe('E2E Test Review');
          reviewId = res.body.id;
        });
    });

    it('POST /api/products/:id/reviews - should reject duplicate review', () => {
      return request(app.getHttpServer())
        .post(`/api/products/${testProductId}/reviews`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rating: 5,
          title: 'Another review',
          body: 'Should not be allowed to review same product twice.',
        })
        .expect(409);
    });

    it('POST /api/products/:id/reviews - should reject without auth', () => {
      return request(app.getHttpServer())
        .post(`/api/products/${testProductId}/reviews`)
        .send({
          rating: 5,
          title: 'Unauthorized review',
          body: 'This should be rejected because no token.',
        })
        .expect(401);
    });

    it('POST /api/products/:id/reviews - should validate input', () => {
      return request(app.getHttpServer())
        .post(`/api/products/${testProductId}/reviews`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rating: 6, // invalid: max 5
          title: 'OK',
          body: 'short', // too short
        })
        .expect(400);
    });

    it('PUT /api/products/:id/reviews/:reviewId - should update own review', () => {
      return request(app.getHttpServer())
        .put(`/api/products/${testProductId}/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ rating: 5, title: 'Updated E2E Review' })
        .expect(200)
        .expect((res) => {
          expect(res.body.rating).toBe(5);
          expect(res.body.title).toBe('Updated E2E Review');
        });
    });

    it('DELETE /api/products/:id/reviews/:reviewId - should delete own review', () => {
      return request(app.getHttpServer())
        .delete(`/api/products/${testProductId}/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe('Review deleted successfully');
        });
    });
  });
});
