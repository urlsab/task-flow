import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatToolbar } from '@angular/material/toolbar';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, MatToolbar, MatButton, MatIconButton, MatIcon],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  readonly auth = inject(AuthService);
  darkMode = this.initTheme();

  toggleTheme(): void {
    const next = !this.darkMode;
    this.applyTheme(next);
  }

  private initTheme(): boolean {
    const stored = localStorage.getItem('tf_dark_theme');
    const resolved = stored === null
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : stored === '1';
    this.applyTheme(resolved);
    return resolved;
  }

  private applyTheme(isDark: boolean): void {
    this.darkMode = isDark;
    document.body.classList.toggle('dark-theme', isDark);
    localStorage.setItem('tf_dark_theme', isDark ? '1' : '0');
  }
}
