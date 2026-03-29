import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReviewService } from '../../services/review.service';

@Component({
  selector: 'app-review-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="review-form">
      <!-- Star Selector -->
      <div class="form-group">
        <label>Your Rating</label>
        <div class="star-selector">
          @for (star of [1,2,3,4,5]; track star) {
            <span
              class="material-icons-outlined star"
              [class.active]="star <= (hoverRating || rating)"
              (click)="rating = star"
              (mouseenter)="hoverRating = star"
              (mouseleave)="hoverRating = 0"
            >
              {{ star <= (hoverRating || rating) ? 'star' : 'star_border' }}
            </span>
          }
          @if (rating) {
            <span class="rating-label">{{ ratingLabels[rating - 1] }}</span>
          }
        </div>
        @if (submitted && !rating) {
          <span class="error-text">Please select a rating</span>
        }
      </div>

      <div class="form-group">
        <label for="title">Review Title</label>
        <input
          id="title"
          class="form-control"
          placeholder="Summarize your experience"
          [(ngModel)]="title"
          maxlength="200"
        />
        @if (submitted && title.length < 3) {
          <span class="error-text">Title must be at least 3 characters</span>
        }
      </div>

      <div class="form-group">
        <label for="body">Your Review</label>
        <textarea
          id="body"
          class="form-control"
          placeholder="What did you like or dislike? How did you use this product?"
          [(ngModel)]="body"
          rows="4"
          maxlength="5000"
        ></textarea>
        <div class="char-count">{{ body.length }} / 5000</div>
        @if (submitted && body.length < 10) {
          <span class="error-text">Review must be at least 10 characters</span>
        }
      </div>

      @if (error()) {
        <div class="error-banner">{{ error() }}</div>
      }

      <button
        class="btn btn-primary"
        [disabled]="submitting()"
        (click)="submit()"
      >
        @if (submitting()) {
          Submitting...
        } @else {
          Submit Review
        }
      </button>
    </div>
  `,
  styles: [`
    .star-selector {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .star {
      font-size: 32px;
      color: var(--border);
      cursor: pointer;
      transition: color 100ms, transform 100ms;
    }
    .star:hover { transform: scale(1.15); }
    .star.active { color: var(--star); }
    .rating-label {
      margin-left: 8px;
      font-size: 14px;
      font-weight: 500;
      color: var(--text-secondary);
    }
    .char-count {
      text-align: right;
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 4px;
    }
    .error-banner {
      padding: 10px 14px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: var(--radius-sm);
      color: var(--danger);
      font-size: 14px;
      margin-bottom: 12px;
    }
  `],
})
export class ReviewFormComponent {
  @Input() productId = '';
  @Output() reviewSubmitted = new EventEmitter<void>();

  rating = 0;
  hoverRating = 0;
  title = '';
  body = '';
  submitted = false;
  submitting = signal(false);
  error = signal('');

  ratingLabels = ['Terrible', 'Poor', 'Average', 'Good', 'Excellent'];

  constructor(private reviewService: ReviewService) {}

  submit() {
    this.submitted = true;
    this.error.set('');

    if (!this.rating || this.title.length < 3 || this.body.length < 10) return;

    this.submitting.set(true);
    this.reviewService
      .createReview(this.productId, {
        rating: this.rating,
        title: this.title,
        body: this.body,
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.reviewSubmitted.emit();
          this.reset();
        },
        error: (err) => {
          this.submitting.set(false);
          this.error.set(err.error?.message || 'Failed to submit review');
        },
      });
  }

  private reset() {
    this.rating = 0;
    this.title = '';
    this.body = '';
    this.submitted = false;
  }
}
