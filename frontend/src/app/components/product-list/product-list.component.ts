import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { StarRatingComponent } from '../star-rating/star-rating.component';
import { Product, PaginatedResponse } from '../../models';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, StarRatingComponent, CurrencyPipe],
  template: `
    <div class="page-header">
      <h1>Products</h1>
      <p class="subtitle">Browse and review your favorite products</p>
    </div>

    <!-- Filters -->
    <div class="filters card">
      <div class="filter-row">
        <div class="search-box">
          <span class="material-icons-outlined">search</span>
          <input
            class="form-control"
            placeholder="Search products..."
            [(ngModel)]="search"
            (input)="onSearch()"
          />
        </div>
        <select class="form-control select" [(ngModel)]="category" (change)="loadProducts()">
          <option value="">All Categories</option>
          @for (cat of categories(); track cat) {
            <option [value]="cat">{{ cat }}</option>
          }
        </select>
        <select class="form-control select" [(ngModel)]="sort" (change)="loadProducts()">
          <option value="newest">Newest</option>
          <option value="rating">Highest Rated</option>
          <option value="reviews">Most Reviews</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </div>
    </div>

    <!-- Product Grid -->
    @if (loading()) {
      <div class="loading">
        <div class="spinner"></div>
        <p>Loading products...</p>
      </div>
    } @else {
      <div class="product-grid">
        @for (product of products(); track product.id) {
          <a [routerLink]="['/products', product.id]" class="product-card card fade-in">
            <div class="product-image">
              @if (product.imageUrl) {
                <img [src]="product.imageUrl" [alt]="product.name" loading="lazy" />
              } @else {
                <div class="image-placeholder">
                  <span class="material-icons-outlined">image</span>
                </div>
              }
              <span class="category-badge">{{ product.category }}</span>
            </div>
            <div class="product-info">
              <h3 class="product-name">{{ product.name }}</h3>
              <p class="product-desc">{{ product.description | slice:0:80 }}...</p>
              <div class="product-meta">
                <app-star-rating
                  [rating]="product.avgRating"
                  [count]="product.reviewCount"
                  [showCount]="true"
                />
                <span class="price">{{ product.price | currency }}</span>
              </div>
            </div>
          </a>
        } @empty {
          <div class="empty-state">
            <span class="material-icons-outlined">inventory_2</span>
            <p>No products found</p>
          </div>
        }
      </div>

      <!-- Pagination -->
      @if (meta().totalPages > 1) {
        <div class="pagination">
          <button
            class="btn btn-secondary btn-sm"
            [disabled]="meta().page <= 1"
            (click)="goToPage(meta().page - 1)"
          >Previous</button>
          <span class="page-info">Page {{ meta().page }} of {{ meta().totalPages }}</span>
          <button
            class="btn btn-secondary btn-sm"
            [disabled]="meta().page >= meta().totalPages"
            (click)="goToPage(meta().page + 1)"
          >Next</button>
        </div>
      }
    }
  `,
  styles: [`
    .page-header {
      margin-bottom: 24px;
    }
    .page-header h1 {
      font-size: 28px;
      font-weight: 700;
    }
    .subtitle {
      color: var(--text-secondary);
      margin-top: 4px;
    }
    .filters {
      padding: 16px;
      margin-bottom: 24px;
    }
    .filter-row {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
    .search-box {
      flex: 1;
      min-width: 200px;
      position: relative;
    }
    .search-box .material-icons-outlined {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      font-size: 20px;
    }
    .search-box .form-control {
      padding-left: 40px;
    }
    .select {
      width: auto;
      min-width: 160px;
    }
    .product-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
    }
    .product-card {
      text-decoration: none;
      color: inherit;
      overflow: hidden;
      transition: transform var(--transition), box-shadow var(--transition);
    }
    .product-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-lg);
      text-decoration: none;
    }
    .product-image {
      position: relative;
      height: 200px;
      overflow: hidden;
      background: #f1f5f9;
    }
    .product-image img {
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
    .image-placeholder .material-icons-outlined {
      font-size: 48px;
    }
    .category-badge {
      position: absolute;
      top: 12px;
      left: 12px;
      background: rgba(255,255,255,0.92);
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
      color: var(--text-secondary);
    }
    .product-info {
      padding: 16px;
    }
    .product-name {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 6px;
    }
    .product-desc {
      font-size: 13px;
      color: var(--text-secondary);
      margin-bottom: 12px;
      line-height: 1.5;
    }
    .product-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .price {
      font-size: 18px;
      font-weight: 700;
      color: var(--text-primary);
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
    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: 60px;
      color: var(--text-muted);
    }
    .empty-state .material-icons-outlined {
      font-size: 48px;
      margin-bottom: 8px;
    }
    .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      margin-top: 32px;
    }
    .page-info {
      font-size: 14px;
      color: var(--text-secondary);
    }
  `],
})
export class ProductListComponent implements OnInit {
  products = signal<Product[]>([]);
  categories = signal<string[]>([]);
  meta = signal<{ total: number; page: number; limit: number; totalPages: number }>({
    total: 0, page: 1, limit: 12, totalPages: 0,
  });
  loading = signal(true);

  search = '';
  category = '';
  sort = 'newest';
  private searchTimeout: any;

  constructor(private productService: ProductService) {}

  ngOnInit() {
    this.loadProducts();
    this.productService.getCategories().subscribe((cats) => this.categories.set(cats));
  }

  loadProducts(page = 1) {
    this.loading.set(true);
    this.productService
      .getProducts({
        page,
        limit: 12,
        category: this.category || undefined,
        sort: this.sort,
        search: this.search || undefined,
      })
      .subscribe({
        next: (res) => {
          this.products.set(res.data);
          this.meta.set(res.meta);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onSearch() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.loadProducts(), 350);
  }

  goToPage(page: number) {
    this.loadProducts(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
