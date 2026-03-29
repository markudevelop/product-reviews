import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card card">
        <h1>Create an account</h1>
        <p class="subtitle">Join to start reviewing products</p>

        @if (error()) {
          <div class="error-banner">{{ error() }}</div>
        }

        <div class="form-group">
          <label for="username">Username</label>
          <input
            id="username"
            class="form-control"
            placeholder="Choose a username"
            [(ngModel)]="username"
          />
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            type="email"
            class="form-control"
            placeholder="you@example.com"
            [(ngModel)]="email"
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            type="password"
            class="form-control"
            placeholder="At least 6 characters"
            [(ngModel)]="password"
            (keyup.enter)="submit()"
          />
        </div>

        <button
          class="btn btn-primary full-width"
          [disabled]="loading()"
          (click)="submit()"
        >
          {{ loading() ? 'Creating account...' : 'Create Account' }}
        </button>

        <p class="auth-footer">
          Already have an account? <a routerLink="/login">Sign in</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      display: flex;
      justify-content: center;
      padding-top: 40px;
    }
    .auth-card {
      width: 100%;
      max-width: 420px;
      padding: 32px;
    }
    h1 { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
    .subtitle { color: var(--text-secondary); margin-bottom: 24px; }
    .full-width { width: 100%; }
    .error-banner {
      padding: 10px 14px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: var(--radius-sm);
      color: var(--danger);
      font-size: 14px;
      margin-bottom: 16px;
    }
    .auth-footer {
      text-align: center;
      margin-top: 16px;
      font-size: 14px;
      color: var(--text-secondary);
    }
  `],
})
export class RegisterComponent {
  username = '';
  email = '';
  password = '';
  loading = signal(false);
  error = signal('');

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  submit() {
    if (!this.username || !this.email || !this.password) {
      this.error.set('Please fill in all fields');
      return;
    }
    if (this.password.length < 6) {
      this.error.set('Password must be at least 6 characters');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.auth.register(this.email, this.username, this.password).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Registration failed');
      },
    });
  }
}
