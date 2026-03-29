import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink],
  template: `
    <header class="header">
      <div class="container header-inner">
        <a routerLink="/" class="logo">
          <span class="material-icons-outlined">storefront</span>
          ReviewHub
        </a>
        <nav class="nav">
          @if (auth.isLoggedIn()) {
            <span class="user-badge">{{ auth.currentUser()?.username }}</span>
            <button class="btn btn-secondary btn-sm" (click)="auth.logout()">Logout</button>
          } @else {
            <a routerLink="/login" class="btn btn-secondary btn-sm">Login</a>
            <a routerLink="/register" class="btn btn-primary btn-sm">Sign Up</a>
          }
        </nav>
      </div>
    </header>
  `,
  styles: [`
    .header {
      background: #fff;
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .header-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 60px;
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 20px;
      font-weight: 700;
      color: var(--text-primary);
      text-decoration: none;
    }
    .logo .material-icons-outlined {
      font-size: 26px;
      color: var(--primary);
    }
    .nav {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .user-badge {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-secondary);
      padding: 4px 12px;
      background: var(--primary-light);
      border-radius: 20px;
    }
  `],
})
export class HeaderComponent {
  constructor(public auth: AuthService) {}
}
