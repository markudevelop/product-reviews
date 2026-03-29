import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { AuthService } from '../../services/auth.service';
import { StarRatingComponent } from '../star-rating/star-rating.component';
import { ReviewListComponent } from '../review-list/review-list.component';
import { ReviewFormComponent } from '../review-form/review-form.component';
import { ReviewInsightsComponent } from '../review-insights/review-insights.component';
import { ProductDetail } from '../../models';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    CurrencyPipe,
    StarRatingComponent,
    ReviewListComponent,
    ReviewFormComponent,
    ReviewInsightsComponent,
  ],
  template: `
    <a routerLink="/" class="back-link">
      <span class="material-icons-outlined">arrow_back</span>
      Back to Products
    </a>

    @if (loading()) {
      <div class="loading">
        <div class="spinner"></div>
        <p>Loading product...</p>
      </div>
    } @else if (product()) {
      <div class="product-detail fade-in">
        <!-- Product Header -->
        <div class="product-hero card">
          <div class="hero-image">
            @if (product()!.imageUrl) {
              <img [src]="product()!.imageUrl" [alt]="product()!.name" />
            } @else {
              <div class="image-placeholder">
                <span class="material-icons-outlined">image</span>
              </div>
            }
          </div>
          <div class="hero-content">
            <span class="category-tag">{{ product()!.category }}</span>
            <h1>{{ product()!.name }}</h1>
            <p class="description">{{ product()!.description }}</p>
            <div class="rating-summary">
              <span class="big-rating">{{ product()!.avgRating | number:'1.1-1' }}</span>
              <div class="rating-details">
                <app-star-rating [rating]="product()!.avgRating" />
                <span class="review-count">{{ product()!.reviewCount }} review{{ product()!.reviewCount !== 1 ? 's' : '' }}</span>
              </div>
            </div>
            <p class="price">{{ product()!.price | currency }}</p>
          </div>
        </div>

        <!-- Rating Distribution -->
        <div class="distribution card">
          <h2>Rating Breakdown</h2>
          <div class="bars">
            @for (bucket of product()!.ratingDistribution.slice().reverse(); track bucket.stars) {
              <div class="bar-row">
                <span class="bar-label">{{ bucket.stars }} star</span>
                <div class="bar-track">
                  <div
                    class="bar-fill"
                    [style.width.%]="product()!.reviewCount ? (bucket.count / product()!.reviewCount * 100) : 0"
                  ></div>
                </div>
                <span class="bar-count">{{ bucket.count }}</span>
              </div>
            }
          </div>
        </div>

        <!-- AI Insights -->
        <app-review-insights
          [productId]="product()!.id"
          [reviewCount]="product()!.reviewCount"
        />

        <!-- Review Form -->
        @if (auth.isLoggedIn()) {
          @if (!hasUserReviewed()) {
            <div class="card review-form-section">
              <h2>Write a Review</h2>
              <app-review-form
                [productId]="product()!.id"
                (reviewSubmitted)="reload()"
              />
            </div>
          }
        } @else {
          <div class="card login-prompt">
            <span class="material-icons-outlined">rate_review</span>
            <p><a routerLink="/login">Sign in</a> to write a review</p>
          </div>
        }

        <!-- Reviews -->
        <div class="reviews-section">
          <h2>Reviews ({{ product()!.reviews.length }})</h2>
          <app-review-list
            [reviews]="product()!.reviews"
            [productId]="product()!.id"
            [currentUserId]="auth.currentUser()?.id || ''"
            (reviewChanged)="reload()"
          />
        </div>
      </div>
    }
  `,
  styles: [`
    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 20px;
      font-size: 14px;
      color: var(--text-secondary);
      text-decoration: none;
    }
    .back-link:hover { color: var(--primary); text-decoration: none; }
    .product-hero {
      display: grid;
      grid-template-columns: 1fr 1fr;
      overflow: hidden;
      margin-bottom: 24px;
    }
    @media (max-width: 768px) {
      .product-hero { grid-template-columns: 1fr; }
    }
    .hero-image {
      height: 360px;
      background: #f1f5f9;
      overflow: hidden;
    }
    .hero-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .image-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--text-muted);
    }
    .image-placeholder .material-icons-outlined { font-size: 64px; }
    .hero-content {
      padding: 32px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .category-tag {
      display: inline-block;
      width: fit-content;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--primary);
      background: var(--primary-light);
      padding: 4px 12px;
      border-radius: 20px;
    }
    h1 { font-size: 26px; font-weight: 700; }
    .description {
      color: var(--text-secondary);
      line-height: 1.6;
    }
    .rating-summary {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .big-rating {
      font-size: 36px;
      font-weight: 700;
      color: var(--text-primary);
    }
    .rating-details {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .review-count {
      font-size: 13px;
      color: var(--text-muted);
    }
    .price {
      font-size: 28px;
      font-weight: 700;
      margin-top: auto;
    }
    .distribution {
      padding: 24px;
      margin-bottom: 24px;
    }
    .distribution h2 {
      font-size: 18px;
      margin-bottom: 16px;
    }
    .bars { display: flex; flex-direction: column; gap: 8px; }
    .bar-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .bar-label {
      width: 52px;
      font-size: 13px;
      color: var(--text-secondary);
      white-space: nowrap;
    }
    .bar-track {
      flex: 1;
      height: 10px;
      background: #f1f5f9;
      border-radius: 5px;
      overflow: hidden;
    }
    .bar-fill {
      height: 100%;
      background: var(--star);
      border-radius: 5px;
      transition: width 0.4s ease;
    }
    .bar-count {
      width: 24px;
      text-align: right;
      font-size: 13px;
      color: var(--text-muted);
    }
    .review-form-section {
      padding: 24px;
      margin-bottom: 24px;
    }
    .review-form-section h2 {
      font-size: 18px;
      margin-bottom: 16px;
    }
    .login-prompt {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px 24px;
      margin-bottom: 24px;
      color: var(--text-secondary);
    }
    .login-prompt .material-icons-outlined {
      font-size: 24px;
      color: var(--primary);
    }
    .reviews-section h2 {
      font-size: 18px;
      margin-bottom: 16px;
    }
    .loading {
      text-align: center;
      padding: 60px 0;
      color: var(--text-muted);
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--border);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 12px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class ProductDetailComponent implements OnInit {
  product = signal<ProductDetail | null>(null);
  loading = signal(true);

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    public auth: AuthService,
  ) {}

  ngOnInit() {
    this.route.params.subscribe((params) => {
      this.loadProduct(params['id']);
    });
  }

  loadProduct(id: string) {
    this.loading.set(true);
    this.productService.getProduct(id).subscribe({
      next: (p) => {
        this.product.set(p);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  hasUserReviewed(): boolean {
    const userId = this.auth.currentUser()?.id;
    if (!userId || !this.product()) return false;
    return this.product()!.reviews.some((r) => r.userId === userId);
  }

  reload() {
    const id = this.product()?.id;
    if (id) this.loadProduct(id);
  }
}
