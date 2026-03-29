import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StarRatingComponent } from '../star-rating/star-rating.component';
import { ReviewService } from '../../services/review.service';
import { Review } from '../../models';

@Component({
  selector: 'app-review-list',
  standalone: true,
  imports: [CommonModule, FormsModule, StarRatingComponent, DatePipe],
  template: `
    @for (review of reviews; track review.id) {
      <div class="review-item card fade-in">
        @if (editingId() === review.id) {
          <!-- Edit mode -->
          <div class="edit-form">
            <div class="form-group">
              <label>Rating</label>
              <div class="star-selector">
                @for (star of [1,2,3,4,5]; track star) {
                  <span
                    class="material-icons-outlined star"
                    [class.active]="star <= editRating"
                    (click)="editRating = star"
                  >{{ star <= editRating ? 'star' : 'star_border' }}</span>
                }
              </div>
            </div>
            <div class="form-group">
              <label>Title</label>
              <input class="form-control" [(ngModel)]="editTitle" />
            </div>
            <div class="form-group">
              <label>Review</label>
              <textarea class="form-control" [(ngModel)]="editBody" rows="3"></textarea>
            </div>
            <div class="edit-actions">
              <button class="btn btn-primary btn-sm" (click)="saveEdit(review)">Save</button>
              <button class="btn btn-secondary btn-sm" (click)="cancelEdit()">Cancel</button>
            </div>
          </div>
        } @else {
          <!-- Display mode -->
          <div class="review-header">
            <div class="reviewer">
              <div class="avatar">{{ review.user.username.charAt(0).toUpperCase() }}</div>
              <div>
                <span class="username">{{ review.user.username }}</span>
                <span class="date">{{ review.createdAt | date:'mediumDate' }}</span>
              </div>
            </div>
            @if (review.userId === currentUserId) {
              <div class="review-actions">
                <button class="icon-btn" title="Edit" (click)="startEdit(review)">
                  <span class="material-icons-outlined">edit</span>
                </button>
                <button class="icon-btn danger" title="Delete" (click)="confirmDelete(review)">
                  <span class="material-icons-outlined">delete_outline</span>
                </button>
              </div>
            }
          </div>
          <app-star-rating [rating]="review.rating" />
          <h4 class="review-title">{{ review.title }}</h4>
          <p class="review-body">{{ review.body }}</p>
        }
      </div>
    } @empty {
      <div class="empty-reviews">
        <span class="material-icons-outlined">rate_review</span>
        <p>No reviews yet. Be the first to share your thoughts!</p>
      </div>
    }
  `,
  styles: [`
    .review-item {
      padding: 20px;
      margin-bottom: 12px;
    }
    .review-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    .reviewer {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--primary-light);
      color: var(--primary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 14px;
    }
    .username {
      font-weight: 600;
      font-size: 14px;
      display: block;
    }
    .date {
      font-size: 12px;
      color: var(--text-muted);
    }
    .review-actions {
      display: flex;
      gap: 4px;
    }
    .icon-btn {
      background: none;
      border: none;
      padding: 6px;
      border-radius: var(--radius-sm);
      color: var(--text-muted);
      transition: all var(--transition);
    }
    .icon-btn:hover {
      background: var(--bg);
      color: var(--text-primary);
    }
    .icon-btn.danger:hover {
      color: var(--danger);
      background: #fef2f2;
    }
    .icon-btn .material-icons-outlined { font-size: 18px; }
    .review-title {
      font-size: 15px;
      font-weight: 600;
      margin: 8px 0 6px;
    }
    .review-body {
      font-size: 14px;
      color: var(--text-secondary);
      line-height: 1.6;
    }
    .edit-form .form-group { margin-bottom: 12px; }
    .edit-form label { font-size: 13px; font-weight: 500; margin-bottom: 4px; display: block; }
    .star-selector { display: flex; gap: 2px; }
    .star {
      font-size: 24px;
      color: var(--border);
      cursor: pointer;
    }
    .star.active { color: var(--star); }
    .edit-actions { display: flex; gap: 8px; margin-top: 8px; }
    .empty-reviews {
      text-align: center;
      padding: 40px;
      color: var(--text-muted);
    }
    .empty-reviews .material-icons-outlined {
      font-size: 40px;
      margin-bottom: 8px;
    }
  `],
})
export class ReviewListComponent {
  @Input() reviews: Review[] = [];
  @Input() productId = '';
  @Input() currentUserId = '';
  @Output() reviewChanged = new EventEmitter<void>();

  editingId = signal<string | null>(null);
  editRating = 0;
  editTitle = '';
  editBody = '';

  constructor(private reviewService: ReviewService) {}

  startEdit(review: Review) {
    this.editingId.set(review.id);
    this.editRating = review.rating;
    this.editTitle = review.title;
    this.editBody = review.body;
  }

  cancelEdit() {
    this.editingId.set(null);
  }

  saveEdit(review: Review) {
    this.reviewService
      .updateReview(this.productId, review.id, {
        rating: this.editRating,
        title: this.editTitle,
        body: this.editBody,
      })
      .subscribe({
        next: () => {
          this.editingId.set(null);
          this.reviewChanged.emit();
        },
      });
  }

  confirmDelete(review: Review) {
    if (confirm('Are you sure you want to delete this review?')) {
      this.reviewService.deleteReview(this.productId, review.id).subscribe({
        next: () => this.reviewChanged.emit(),
      });
    }
  }
}
