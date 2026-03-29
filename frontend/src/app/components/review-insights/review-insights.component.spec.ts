import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ReviewInsightsComponent } from './review-insights.component';
import { InsightsService } from '../../services/insights.service';
import { of, throwError } from 'rxjs';

describe('ReviewInsightsComponent', () => {
  let component: ReviewInsightsComponent;
  let fixture: ComponentFixture<ReviewInsightsComponent>;
  let insightsService: jasmine.SpyObj<InsightsService>;

  const mockInsight = {
    productId: 'p1',
    productName: 'Test Product',
    summary: 'Customers love this product.',
    pros: ['Great quality', 'Good value'],
    cons: ['Slightly heavy'],
    sentiment: 'positive' as const,
    averageRating: 4.5,
    reviewCount: 3,
    generatedAt: new Date().toISOString(),
    source: 'heuristic' as const,
  };

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('InsightsService', ['getInsights']);
    spy.getInsights.and.returnValue(of(mockInsight));

    await TestBed.configureTestingModule({
      imports: [ReviewInsightsComponent, HttpClientTestingModule],
      providers: [{ provide: InsightsService, useValue: spy }],
    }).compileComponents();

    insightsService = TestBed.inject(InsightsService) as jasmine.SpyObj<InsightsService>;
    fixture = TestBed.createComponent(ReviewInsightsComponent);
    component = fixture.componentInstance;
    component.productId = 'p1';
    component.reviewCount = 3;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not load insights automatically', () => {
    expect(component.insight()).toBeNull();
    expect(insightsService.getInsights).not.toHaveBeenCalled();
  });

  it('should load insights on button click', () => {
    component.load();
    expect(insightsService.getInsights).toHaveBeenCalledWith('p1');
    expect(component.insight()).toEqual(mockInsight);
    expect(component.loaded()).toBeTrue();
  });

  it('should show error when no reviews exist', () => {
    component.reviewCount = 0;
    component.load();
    expect(component.error()).toBe('No reviews to analyze yet.');
    expect(insightsService.getInsights).not.toHaveBeenCalled();
  });

  it('should handle API errors gracefully', () => {
    insightsService.getInsights.and.returnValue(
      throwError(() => ({ error: { message: 'Service unavailable' } })),
    );
    component.load();
    expect(component.error()).toBe('Service unavailable');
    expect(component.insight()).toBeNull();
  });

  it('should reset state on product change', () => {
    component.load();
    expect(component.loaded()).toBeTrue();
    component.productId = 'p2';
    component.ngOnChanges();
    expect(component.insight()).toBeNull();
    expect(component.loaded()).toBeFalse();
  });
});
