import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCard, MatCardHeader, MatCardContent, MatCardTitle, MatCardSubtitle } from '@angular/material/card';
import { MatFormField, MatLabel, MatError } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatButton } from '@angular/material/button';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCard, MatCardHeader, MatCardContent, MatCardTitle, MatCardSubtitle,
    MatFormField, MatLabel, MatError, MatInput,
    MatButton, MatProgressSpinner
  ],
  template: `
    <div class="auth-container">
      <mat-card class="auth-card">
        <div class="auth-brand">
          <img src="/icons/igabi-logo.svg" alt="iGabi" class="brand-logo" />
          <p class="brand-caption">iGabi - Synagogue CRM</p>
        </div>

        <mat-card-header>
          <mat-card-title>התחברות ל-iGabi</mat-card-title>
          <mat-card-subtitle>ניהול חכם של תרומות, חובות והכנסות</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="submit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>שם משתמש</mat-label>
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

            <button mat-raised-button color="primary" type="submit"
                    class="full-width submit-btn" [disabled]="loading()">
              @if (loading()) { <mat-spinner diameter="20" /> }
              @else { התחברות }
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
      min-height:100svh;
      background-image:
        linear-gradient(180deg, rgba(255,255,255,0.78), rgba(255,255,255,0.72)),
        url('/backgrounds/synagogue.svg');
      background-size: cover, 1200px auto;
      background-repeat: no-repeat;
      background-position: center, center;
      padding: 36px 14px;
    }

    .auth-card {
      width: 100%;
      max-width: 420px;
      border-radius: 26px;
      padding: 20px 18px 18px;
      box-shadow:
        0 22px 44px rgba(21, 38, 77, 0.22),
        0 2px 8px rgba(17, 30, 56, 0.08);
      backdrop-filter: blur(8px);
      background:
        linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,251,255,0.92));
      border: 1px solid rgba(132, 162, 223, 0.35);
    }

    .auth-brand {
      display: grid;
      justify-items: center;
      gap: 6px;
      margin-bottom: 8px;
    }

    .brand-logo {
      width: 140px;
      height: auto;
      filter: drop-shadow(0 8px 18px rgba(26, 53, 108, 0.22));
    }

    .brand-caption {
      margin: 0;
      color: #4f5f7a;
      font-size: 0.82rem;
      font-weight: 500;
      letter-spacing: 0.2px;
    }

    mat-card-title {
      font-size: 1.5rem;
      font-weight: 700;
      line-height: 1.2;
      color: #1f3156;
    }

    mat-card-subtitle {
      color: #5b6d8e;
      font-size: 0.93rem;
      font-weight: 500;
      margin-top: 6px;
      margin-bottom: 4px;
    }

    .full-width { width:100%; display:block; margin-top: 4px; }

    .submit-btn {
      margin-top: 12px;
      border-radius: 14px;
      height: 50px;
      font-weight: 700;
      letter-spacing: 0.3px;
      box-shadow: 0 8px 20px rgba(44, 92, 183, 0.24);
    }

    .error-banner { color:#b00020; font-size:14px; margin:10px 0 4px; }

    @media (max-height: 700px) {
      .auth-container { padding-block: 22px; }
    }
  `]
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  // Signals for local UI state — simpler than a BehaviorSubject for values that live only in this component
  readonly loading = signal(false);
  readonly error   = signal('');

  readonly form = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set('');

    this.auth.login(this.form.getRawValue() as any).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (msg: string) => { this.error.set(msg); this.loading.set(false); }
    });
  }
}
