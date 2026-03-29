import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ReviewListComponent } from './review-list.component';
import { ReviewService } from '../../services/review.service';
import { of } from 'rxjs';

describe('ReviewListComponent', () => {
  let component: ReviewListComponent;
  let fixture: ComponentFixture<ReviewListComponent>;
  let reviewService: jasmine.SpyObj<ReviewService>;

  const mockReviews = [
    {
      id: 'r1', rating: 5, title: 'Great', body: 'Loved it',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      productId: 'p1', userId: 'u1',
      user: { id: 'u1', username: 'alice' },
    },
    {
      id: 'r2', rating: 3, title: 'OK', body: 'It was fine',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      productId: 'p1', userId: 'u2',
      user: { id: 'u2', username: 'bob' },
    },
  ];

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ReviewService', ['updateReview', 'deleteReview']);
    spy.updateReview.and.returnValue(of(mockReviews[0]));
    spy.deleteReview.and.returnValue(of({ message: 'Deleted' }));

    await TestBed.configureTestingModule({
      imports: [ReviewListComponent, HttpClientTestingModule],
      providers: [{ provide: ReviewService, useValue: spy }],
    }).compileComponents();

    reviewService = TestBed.inject(ReviewService) as jasmine.SpyObj<ReviewService>;
    fixture = TestBed.createComponent(ReviewListComponent);
    component = fixture.componentInstance;
    component.reviews = mockReviews;
    component.productId = 'p1';
    component.currentUserId = 'u1';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render all reviews', () => {
    const items = fixture.nativeElement.querySelectorAll('.review-item');
    expect(items.length).toBe(2);
  });

  it('should enter edit mode for own review', () => {
    component.startEdit(mockReviews[0]);
    expect(component.editingId()).toBe('r1');
    expect(component.editRating).toBe(5);
    expect(component.editTitle).toBe('Great');
  });

  it('should cancel edit mode', () => {
    component.startEdit(mockReviews[0]);
    component.cancelEdit();
    expect(component.editingId()).toBeNull();
  });

  it('should call updateReview on save', () => {
    component.startEdit(mockReviews[0]);
    component.editRating = 4;
    component.saveEdit(mockReviews[0]);
    expect(reviewService.updateReview).toHaveBeenCalledWith('p1', 'r1', {
      rating: 4, title: 'Great', body: 'Loved it',
    });
  });
});
