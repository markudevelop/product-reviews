import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { ProductDetailComponent } from './product-detail.component';
import { ProductService } from '../../services/product.service';
import { AuthService } from '../../services/auth.service';

describe('ProductDetailComponent', () => {
  let component: ProductDetailComponent;
  let fixture: ComponentFixture<ProductDetailComponent>;

  const mockProduct = {
    id: 'prod-1',
    name: 'Test Product',
    description: 'Description',
    imageUrl: null,
    category: 'Electronics',
    price: 99.99,
    avgRating: 4.0,
    reviewCount: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    reviews: [
      {
        id: 'rev-1',
        rating: 5,
        title: 'Great',
        body: 'Loved it',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        productId: 'prod-1',
        userId: 'user-1',
        user: { id: 'user-1', username: 'alice' },
      },
    ],
    ratingDistribution: [
      { stars: 1, count: 0 },
      { stars: 2, count: 0 },
      { stars: 3, count: 0 },
      { stars: 4, count: 1 },
      { stars: 5, count: 1 },
    ],
  };

  beforeEach(async () => {
    const productSpy = jasmine.createSpyObj('ProductService', ['getProduct']);
    productSpy.getProduct.and.returnValue(of(mockProduct));

    await TestBed.configureTestingModule({
      imports: [
        ProductDetailComponent,
        HttpClientTestingModule,
        RouterTestingModule,
      ],
      providers: [
        { provide: ProductService, useValue: productSpy },
        {
          provide: ActivatedRoute,
          useValue: { params: of({ id: 'prod-1' }) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load product on init', () => {
    expect(component.product()).toBeTruthy();
    expect(component.product()!.name).toBe('Test Product');
  });

  it('should detect if current user has reviewed', () => {
    // No user logged in
    expect(component.hasUserReviewed()).toBeFalse();
  });

  it('should have rating distribution with 5 buckets', () => {
    expect(component.product()!.ratingDistribution.length).toBe(5);
  });
});
