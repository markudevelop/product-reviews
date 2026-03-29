import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stars" [class.interactive]="interactive">
      @for (star of [1,2,3,4,5]; track star) {
        <span
          class="material-icons-outlined star"
          [class.filled]="star <= displayRating"
          [class.half]="star === Math.ceil(displayRating) && displayRating % 1 >= 0.25 && displayRating % 1 < 0.75"
          (click)="interactive && onSelect(star)"
          (mouseenter)="interactive && onHover(star)"
          (mouseleave)="interactive && onLeave()"
        >
          {{ star <= displayRating ? 'star' : (star === Math.ceil(displayRating) && displayRating % 1 >= 0.25 ? 'star_half' : 'star_border') }}
        </span>
      }
      @if (showCount) {
        <span class="count">({{ count }})</span>
      }
    </div>
  `,
  styles: [`
    .stars {
      display: inline-flex;
      align-items: center;
      gap: 2px;
    }
    .star {
      color: var(--border);
      font-size: 20px;
      transition: color 100ms;
    }
    .star.filled, .star.half {
      color: var(--star);
    }
    .interactive .star {
      cursor: pointer;
    }
    .interactive .star:hover {
      transform: scale(1.15);
    }
    .count {
      font-size: 13px;
      color: var(--text-muted);
      margin-left: 4px;
    }
  `],
})
export class StarRatingComponent {
  @Input() rating = 0;
  @Input() count = 0;
  @Input() showCount = false;
  @Input() interactive = false;
  @Input() selectedRating = 0;

  Math = Math;
  hoverRating = 0;

  get displayRating(): number {
    if (this.interactive) {
      return this.hoverRating || this.selectedRating || 0;
    }
    return this.rating;
  }

  onSelect(star: number) {
    this.selectedRating = star;
  }

  onHover(star: number) {
    this.hoverRating = star;
  }

  onLeave() {
    this.hoverRating = 0;
  }
}
