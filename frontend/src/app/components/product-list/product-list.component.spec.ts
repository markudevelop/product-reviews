import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ProductListComponent } from './product-list.component';
import { ProductService } from '../../services/product.service';
import { of } from 'rxjs';

describe('ProductListComponent', () => {
  let component: ProductListComponent;
  let fixture: ComponentFixture<ProductListComponent>;
  let productService: jasmine.SpyObj<ProductService>;

  const mockProducts = {
    data: [
      {
        id: '1',
        name: 'Test Product',
        description: 'A test product description',
        imageUrl: null,
        category: 'Electronics',
        price: 99.99,
        avgRating: 4.5,
        reviewCount: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    meta: { total: 1, page: 1, limit: 12, totalPages: 1 },
  };

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ProductService', ['getProducts', 'getCategories']);
    spy.getProducts.and.returnValue(of(mockProducts));
    spy.getCategories.and.returnValue(of(['Electronics', 'Clothing']));

    await TestBed.configureTestingModule({
      imports: [
        ProductListComponent,
        HttpClientTestingModule,
        RouterTestingModule,
      ],
      providers: [{ provide: ProductService, useValue: spy }],
    }).compileComponents();

    productService = TestBed.inject(ProductService) as jasmine.SpyObj<ProductService>;
    fixture = TestBed.createComponent(ProductListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load products on init', () => {
    expect(productService.getProducts).toHaveBeenCalled();
    expect(component.products().length).toBe(1);
    expect(component.products()[0].name).toBe('Test Product');
  });

  it('should load categories on init', () => {
    expect(productService.getCategories).toHaveBeenCalled();
    expect(component.categories()).toEqual(['Electronics', 'Clothing']);
  });

  it('should set loading to false after products load', () => {
    expect(component.loading()).toBeFalse();
  });

  it('should update meta data', () => {
    expect(component.meta().total).toBe(1);
    expect(component.meta().totalPages).toBe(1);
  });
});
