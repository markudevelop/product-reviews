import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from '../products/products.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let prisma: any;
  let productsService: any;
  let notificationsService: any;

  const mockReview = {
    id: 'review-1',
    rating: 5,
    title: 'Great',
    body: 'Really great product',
    productId: 'product-1',
    userId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    user: { id: 'user-1', username: 'alice' },
  };

  beforeEach(async () => {
    prisma = {
      product: {
        findUnique: jest.fn().mockResolvedValue({ id: 'product-1', name: 'Test Product' }),
        update: jest.fn().mockResolvedValue({}),
      },
      review: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(mockReview),
        update: jest.fn().mockResolvedValue(mockReview),
        delete: jest.fn().mockResolvedValue(mockReview),
        aggregate: jest.fn().mockResolvedValue({
          _avg: { rating: 4.5 },
          _count: { rating: 2 },
        }),
      },
    };

    productsService = {
      invalidateCache: jest.fn().mockResolvedValue(undefined),
    };

    notificationsService = {
      onNewReview: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ProductsService, useValue: productsService },
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a review', async () => {
      const result = await service.create('product-1', 'user-1', {
        rating: 5,
        title: 'Great',
        body: 'Really great product',
      });

      expect(result).toEqual(mockReview);
      expect(productsService.invalidateCache).toHaveBeenCalledWith('product-1');
      expect(notificationsService.onNewReview).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: 'product-1',
          productName: 'Test Product',
          reviewerUsername: 'alice',
        }),
      );
    });

    it('should throw if product not found', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(
        service.create('bad-id', 'user-1', {
          rating: 5,
          title: 'Great',
          body: 'Really great product',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if already reviewed', async () => {
      prisma.review.findUnique.mockResolvedValue(mockReview);

      await expect(
        service.create('product-1', 'user-1', {
          rating: 5,
          title: 'Great',
          body: 'Really great product',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update own review', async () => {
      prisma.review.findUnique.mockResolvedValue(mockReview);

      await service.update('review-1', 'user-1', { rating: 4 });

      expect(prisma.review.update).toHaveBeenCalled();
    });

    it('should throw ForbiddenException for other users review', async () => {
      prisma.review.findUnique.mockResolvedValue(mockReview);

      await expect(
        service.update('review-1', 'user-2', { rating: 4 }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should delete own review', async () => {
      prisma.review.findUnique.mockResolvedValue(mockReview);

      const result = await service.remove('review-1', 'user-1');

      expect(result.message).toBe('Review deleted successfully');
    });

    it('should throw ForbiddenException for other users review', async () => {
      prisma.review.findUnique.mockResolvedValue(mockReview);

      await expect(service.remove('review-1', 'user-2')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
