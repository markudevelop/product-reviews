import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent],
  template: `
    <app-header />
    <main class="container" style="padding-top: 24px; padding-bottom: 48px;">
      <router-outlet />
    </main>
  `,
})
export class AppComponent {}
