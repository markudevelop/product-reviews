import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ReviewFormComponent } from './review-form.component';
import { ReviewService } from '../../services/review.service';
import { of } from 'rxjs';

describe('ReviewFormComponent', () => {
  let component: ReviewFormComponent;
  let fixture: ComponentFixture<ReviewFormComponent>;
  let reviewService: jasmine.SpyObj<ReviewService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ReviewService', ['createReview']);
    spy.createReview.and.returnValue(of({
      id: 'r1', rating: 5, title: 'Test', body: 'Test body text here',
      createdAt: '', updatedAt: '', productId: 'p1', userId: 'u1',
      user: { id: 'u1', username: 'alice' },
    }));

    await TestBed.configureTestingModule({
      imports: [ReviewFormComponent, HttpClientTestingModule],
      providers: [{ provide: ReviewService, useValue: spy }],
    }).compileComponents();

    reviewService = TestBed.inject(ReviewService) as jasmine.SpyObj<ReviewService>;
    fixture = TestBed.createComponent(ReviewFormComponent);
    component = fixture.componentInstance;
    component.productId = 'prod-1';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not submit with empty fields', () => {
    component.submit();
    expect(reviewService.createReview).not.toHaveBeenCalled();
  });

  it('should not submit without rating', () => {
    component.title = 'Good product';
    component.body = 'I really liked this product a lot';
    component.submit();
    expect(reviewService.createReview).not.toHaveBeenCalled();
  });

  it('should submit with valid data', () => {
    component.rating = 5;
    component.title = 'Amazing product';
    component.body = 'I really liked this product a lot';
    component.submit();
    expect(reviewService.createReview).toHaveBeenCalledWith('prod-1', {
      rating: 5,
      title: 'Amazing product',
      body: 'I really liked this product a lot',
    });
  });

  it('should reset form after successful submit', () => {
    component.rating = 5;
    component.title = 'Amazing product';
    component.body = 'I really liked this product a lot';
    component.submit();
    expect(component.rating).toBe(0);
    expect(component.title).toBe('');
    expect(component.body).toBe('');
  });
});
