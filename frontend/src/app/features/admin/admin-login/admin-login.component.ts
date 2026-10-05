import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCard, MatCardContent, MatCardHeader, MatCardSubtitle, MatCardTitle } from '@angular/material/card';
import { MatFormField, MatLabel, MatError } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatButton } from '@angular/material/button';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { AdminLoginRequest } from '../../../core/models/admin.model';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCard, MatCardHeader, MatCardContent, MatCardTitle, MatCardSubtitle,
    MatFormField, MatLabel, MatError, MatInput, MatButton, MatProgressSpinner
  ],
  template: `
    <div class="auth-container">
      <mat-card class="auth-card">
        <div class="logo-wrap">
          <img src="/icons/igabi-logo.svg" alt="iGabi" class="brand-logo" />
        </div>
        <mat-card-header>
          <mat-card-title>כניסת מנהל iGabi</mat-card-title>
          <mat-card-subtitle>אזור ניהול משתמשים של iGabi</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="submit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>שם משתמש מנהל</mat-label>
              <input matInput formControlName="username" autocomplete="username" />
              @if (form.get('username')?.invalid && form.get('username')?.touched) {
                <mat-error>יש להזין שם משתמש</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>סיסמה</mat-label>
              <input matInput type="password" formControlName="password" autocomplete="current-password" />
              @if (form.get('password')?.invalid && form.get('password')?.touched) {
                <mat-error>יש להזין סיסמה</mat-error>
              }
            </mat-form-field>

            @if (error()) {
              <p class="error-banner">{{ error() }}</p>
            }

            <button mat-raised-button color="primary" type="submit" class="full-width submit-btn" [disabled]="loading()">
              @if (loading()) { <mat-spinner diameter="20" /> }
              @else { כניסה לניהול }
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .auth-container {
      display:flex;
      align-items:center;
      justify-content:center;
      min-height:100vh;
      padding:12px;
      background-image:
        linear-gradient(180deg, rgba(255,255,255,0.82), rgba(255,255,255,0.78)),
        url('/backgrounds/aron.svg');
      background-size: cover, 980px auto;
      background-position: center, center;
      background-repeat: no-repeat;
    }
    .auth-card {
      width:100%;
      max-width:380px;
      padding:16px;
      border-radius:16px;
      backdrop-filter: blur(5px);
      background: rgba(255,255,255,0.93);
    }
    .logo-wrap { display:grid; justify-items:center; margin-bottom:8px; }
    .brand-logo { width:126px; height:auto; filter: drop-shadow(0 6px 16px rgba(26, 53, 108, 0.2)); }
    .full-width { width:100%; display:block; }
    .submit-btn { margin-top:8px; }
    .error-banner { color:#b00020; font-size:14px; margin:8px 0; }
  `]
})
export class AdminLoginComponent {
  private readonly admin = inject(AdminService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal('');

  readonly form = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set('');
    const value = this.form.getRawValue();
    const request: AdminLoginRequest = {
      username: value.username?.trim() ?? '',
      password: value.password ?? ''
    };

    this.admin.login(request).subscribe({
      next: () => this.router.navigate(['/m-root-admin/panel']),
      error: (msg: string) => {
        this.loading.set(false);
        this.error.set(msg);
      }
    });
  }
}
