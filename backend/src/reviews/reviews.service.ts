import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from '../products/products.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productsService: ProductsService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(productId: string, userId: string, dto: CreateReviewDto) {
    // Verify product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('Product not found');

    // Check if user already reviewed this product
    const existing = await this.prisma.review.findUnique({
      where: {
        productId_userId: { productId, userId },
      },
    });
    if (existing) {
      throw new ConflictException('You have already reviewed this product');
    }

    const review = await this.prisma.review.create({
      data: {
        ...dto,
        productId,
        userId,
      },
      include: {
        user: { select: { id: true, username: true } },
      },
    });

    await this.updateProductAggregates(productId);
    await this.productsService.invalidateCache(productId);

    // Notify admin of new review
    await this.notifications.onNewReview({
      productId,
      productName: product.name,
      reviewId: review.id,
      reviewerUsername: review.user.username,
      rating: review.rating,
      title: review.title,
    });

    return review;
  }

  async update(reviewId: string, userId: string, dto: UpdateReviewDto) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) throw new NotFoundException('Review not found');
    if (review.userId !== userId) throw new ForbiddenException('You can only edit your own reviews');

    const updated = await this.prisma.review.update({
      where: { id: reviewId },
      data: dto,
      include: {
        user: { select: { id: true, username: true } },
      },
    });

    await this.updateProductAggregates(review.productId);
    await this.productsService.invalidateCache(review.productId);

    return updated;
  }

  async remove(reviewId: string, userId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) throw new NotFoundException('Review not found');
    if (review.userId !== userId) throw new ForbiddenException('You can only delete your own reviews');

    await this.prisma.review.delete({ where: { id: reviewId } });

    await this.updateProductAggregates(review.productId);
    await this.productsService.invalidateCache(review.productId);

    return { message: 'Review deleted successfully' };
  }

  private async updateProductAggregates(productId: string) {
    const agg = await this.prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await this.prisma.product.update({
      where: { id: productId },
      data: {
        avgRating: agg._avg.rating ?? 0,
        reviewCount: agg._count.rating,
      },
    });
  }
}
