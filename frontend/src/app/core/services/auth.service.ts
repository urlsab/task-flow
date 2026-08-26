import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = `${environment.apiUrl}/api/auth`;

  // Signal: a reactive cell — any template that reads it re-evaluates when it changes.
  // Replaces the BehaviorSubject<User | null> pattern from older Angular.
  private readonly _currentUser = signal<AuthResponse | null>(this.loadFromStorage());

  readonly currentUser    = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);
  // computed() is a derived signal — recalculates automatically when _currentUser changes
  readonly token           = computed(() => this._currentUser()?.token ?? null);

  login(request: LoginRequest) {
    // tap() = side effect without altering the stream value (here: persist to storage)
    // catchError() = intercept errors and transform them before they reach the subscriber
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, request).pipe(
      tap(user => this.persist(user)),
      catchError(err => throwError(() => err.error?.error ?? 'Login failed.'))
    );
  }

  register(request: RegisterRequest) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, request).pipe(
      tap(user => this.persist(user)),
      catchError(err => throwError(() => err.error?.error ?? 'Registration failed.'))
    );
  }

  logout(): void {
    localStorage.removeItem('tf_user');
    this._currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  private persist(user: AuthResponse): void {
    localStorage.setItem('tf_user', JSON.stringify(user));
    this._currentUser.set(user);
  }

  private loadFromStorage(): AuthResponse | null {
    const raw = localStorage.getItem('tf_user');
    return raw ? (JSON.parse(raw) as AuthResponse) : null;
  }
}
