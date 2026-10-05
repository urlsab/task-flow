import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdminCreateUserRequest, AdminLoginRequest, AdminLoginResponse, AdminUser } from '../models/admin.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = `${environment.apiUrl}/api/admin`;
  private readonly storageKey = 'tf_admin_token';

  private readonly _token = signal<string | null>(this.loadToken());

  readonly token = this._token.asReadonly();
  readonly isAuthenticated = computed(() => this._token() !== null);

  login(request: AdminLoginRequest) {
    return this.http.post<AdminLoginResponse>(`${this.apiUrl}/login`, request).pipe(
      tap(res => {
        localStorage.setItem(this.storageKey, res.token);
        this._token.set(res.token);
      }),
      catchError(err => throwError(() => err.error?.error ?? 'התחברות מנהל נכשלה.'))
    );
  }

  getUsers() {
    return this.http.get<AdminUser[]>(`${this.apiUrl}/users`);
  }

  createUser(request: AdminCreateUserRequest) {
    return this.http.post<AdminUser>(`${this.apiUrl}/users`, request);
  }

  deleteUser(id: number) {
    return this.http.delete<void>(`${this.apiUrl}/users/${id}`);
  }

  logout(redirectToLogin = true): void {
    localStorage.removeItem(this.storageKey);
    this._token.set(null);
    if (redirectToLogin) {
      this.router.navigate(['/m-root-admin/login']);
    }
  }

  private loadToken(): string | null {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return null;
    if (this.isTokenExpired(raw)) {
      localStorage.removeItem(this.storageKey);
      return null;
    }
    return raw;
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }
}
