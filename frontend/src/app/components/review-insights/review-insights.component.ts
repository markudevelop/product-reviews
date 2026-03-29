import { Component, Input, OnChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InsightsService, ReviewInsight } from '../../services/insights.service';

@Component({
  selector: 'app-review-insights',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (!loaded() && !error()) {
      <div class="insights-card card">
        <div class="insights-header">
          <span class="material-icons-outlined icon">auto_awesome</span>
          <h3>AI Review Insights</h3>
        </div>
        <button class="btn btn-secondary btn-sm" (click)="load()" [disabled]="loading()">
          @if (loading()) {
            <span class="spinner-sm"></span> Analyzing reviews...
          } @else {
            Generate Insights
          }
        </button>
      </div>
    }

    @if (insight()) {
      <div class="insights-card card fade-in">
        <div class="insights-header">
          <span class="material-icons-outlined icon">auto_awesome</span>
          <h3>AI Review Insights</h3>
          <span class="badge" [class]="'badge-' + insight()!.sentiment">
            {{ insight()!.sentiment }}
          </span>
          <span class="source-tag">{{ insight()!.source === 'llm' ? 'AI Generated' : 'Auto Analysis' }}</span>
        </div>

        <p class="summary">{{ insight()!.summary }}</p>

        <div class="themes-grid">
          <div class="theme-col">
            <h4>
              <span class="material-icons-outlined pros-icon">thumb_up</span>
              What customers love
            </h4>
            <ul>
              @for (pro of insight()!.pros; track pro) {
                <li>{{ pro }}</li>
              }
            </ul>
          </div>
          <div class="theme-col">
            <h4>
              <span class="material-icons-outlined cons-icon">thumb_down</span>
              Common concerns
            </h4>
            <ul>
              @for (con of insight()!.cons; track con) {
                <li>{{ con }}</li>
              }
            </ul>
          </div>
        </div>
      </div>
    }

    @if (error()) {
      <div class="insights-card card error-card">
        <span class="material-icons-outlined">info</span>
        <p>{{ error() }}</p>
      </div>
    }
  `,
  styles: [`
    .insights-card {
      padding: 20px;
      margin-bottom: 24px;
      border-left: 3px solid var(--primary);
    }
    .insights-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }
    .insights-header h3 {
      font-size: 16px;
      font-weight: 600;
      margin: 0;
    }
    .icon {
      color: var(--primary);
      font-size: 22px;
    }
    .badge {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 2px 10px;
      border-radius: 20px;
    }
    .badge-positive { background: #dcfce7; color: #166534; }
    .badge-mixed { background: #fef3c7; color: #92400e; }
    .badge-negative { background: #fee2e2; color: #991b1b; }
    .source-tag {
      font-size: 11px;
      color: var(--text-muted);
      margin-left: auto;
    }
    .summary {
      font-size: 14px;
      color: var(--text-secondary);
      line-height: 1.6;
      margin-bottom: 16px;
    }
    .themes-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    @media (max-width: 600px) {
      .themes-grid { grid-template-columns: 1fr; }
    }
    .theme-col h4 {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .pros-icon { color: var(--success); font-size: 18px; }
    .cons-icon { color: var(--warning); font-size: 18px; }
    .theme-col ul {
      list-style: none;
      padding: 0;
    }
    .theme-col li {
      font-size: 13px;
      color: var(--text-secondary);
      padding: 4px 0;
      padding-left: 16px;
      position: relative;
    }
    .theme-col li::before {
      content: '•';
      position: absolute;
      left: 0;
      color: var(--text-muted);
    }
    .spinner-sm {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid var(--border);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .error-card {
      display: flex;
      align-items: center;
      gap: 10px;
      border-left-color: var(--warning);
      color: var(--text-secondary);
      font-size: 14px;
    }
  `],
})
export class ReviewInsightsComponent implements OnChanges {
  @Input() productId = '';
  @Input() reviewCount = 0;

  insight = signal<ReviewInsight | null>(null);
  loading = signal(false);
  loaded = signal(false);
  error = signal('');

  constructor(private insightsService: InsightsService) {}

  ngOnChanges() {
    // Reset when product changes
    this.insight.set(null);
    this.loaded.set(false);
    this.error.set('');
  }

  load() {
    if (this.reviewCount === 0) {
      this.error.set('No reviews to analyze yet.');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.insightsService.getInsights(this.productId).subscribe({
      next: (data) => {
        this.insight.set(data);
        this.loading.set(false);
        this.loaded.set(true);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Could not generate insights');
      },
    });
  }
}
