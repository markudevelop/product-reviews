import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: any;
  let cache: any;

  const mockProduct = {
    id: 'test-id',
    name: 'Test Product',
    description: 'A test product',
    category: 'Electronics',
    price: 99.99,
    avgRating: 4.5,
    reviewCount: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      product: {
        findMany: jest.fn().mockResolvedValue([mockProduct]),
        findUnique: jest.fn().mockResolvedValue({
          ...mockProduct,
          reviews: [],
        }),
        count: jest.fn().mockResolvedValue(1),
      },
    };

    cache = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
      store: { keys: jest.fn().mockResolvedValue([]) },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: prisma },
        { provide: CACHE_MANAGER, useValue: cache },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated products', async () => {
      const result = await service.findAll({ page: 1, limit: 12 });

      expect(result.data).toEqual([mockProduct]);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
    });

    it('should return cached results when available', async () => {
      const cachedResult = { data: [mockProduct], meta: { total: 1, page: 1, limit: 12, totalPages: 1 } };
      cache.get.mockResolvedValue(cachedResult);

      const result = await service.findAll({ page: 1, limit: 12 });

      expect(result).toEqual(cachedResult);
      expect(prisma.product.findMany).not.toHaveBeenCalled();
    });

    it('should filter by category', async () => {
      await service.findAll({ page: 1, limit: 12, category: 'Electronics' });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { category: 'Electronics' },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a product with reviews', async () => {
      const result = await service.findOne('test-id');

      expect(result).toBeDefined();
      expect(prisma.product.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'test-id' },
        }),
      );
    });

    it('should throw NotFoundException for invalid id', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(service.findOne('bad-id')).rejects.toThrow(NotFoundException);
    });
  });
});
