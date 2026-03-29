import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { QueryProductsDto } from './dto/query-products.dto';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async findAll(query: QueryProductsDto) {
    const { page = 1, limit = 12, category, sort = 'newest', search } = query;
    const skip = (page - 1) * limit;

    const cacheKey = `products:${JSON.stringify(query)}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const where: any = {};
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy = this.getOrderBy(sort);

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          _count: { select: { reviews: true } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    const result = {
      data: products,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    await this.cacheManager.set(cacheKey, result, 30 * 1000);
    return result;
  }

  async findOne(id: string) {
    const cacheKey = `product:${id}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        reviews: {
          include: {
            user: {
              select: { id: true, username: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product) throw new NotFoundException('Product not found');

    // Compute rating distribution
    const ratingDistribution = [1, 2, 3, 4, 5].map((star) => ({
      stars: star,
      count: product.reviews.filter((r) => r.rating === star).length,
    }));

    const result = { ...product, ratingDistribution };

    await this.cacheManager.set(cacheKey, result, 30 * 1000);
    return result;
  }

  async getCategories(): Promise<string[]> {
    const cacheKey = 'product:categories';
    const cached = await this.cacheManager.get<string[]>(cacheKey);
    if (cached) return cached;

    const categories = await this.prisma.product.findMany({
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });

    const result = categories.map((c) => c.category);
    await this.cacheManager.set(cacheKey, result, 60 * 1000);
    return result;
  }

  async invalidateCache(productId?: string) {
    // Invalidate specific product and listing caches
    if (productId) {
      await this.cacheManager.del(`product:${productId}`);
    }
    // For simplicity, we clear all product listing caches by resetting the store
    // In production, use cache tags or a more targeted approach
    const keys = await this.cacheManager.store.keys?.('products:*');
    if (keys) {
      for (const key of keys) {
        await this.cacheManager.del(key);
      }
    }
  }

  private getOrderBy(sort: string) {
    switch (sort) {
      case 'price_asc':
        return { price: 'asc' as const };
      case 'price_desc':
        return { price: 'desc' as const };
      case 'rating':
        return { avgRating: 'desc' as const };
      case 'reviews':
        return { reviewCount: 'desc' as const };
      case 'newest':
      default:
        return { createdAt: 'desc' as const };
    }
  }
}
