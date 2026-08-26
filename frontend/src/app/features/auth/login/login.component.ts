import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCard, MatCardHeader, MatCardContent, MatCardActions, MatCardTitle, MatCardSubtitle } from '@angular/material/card';
import { MatFormField, MatLabel, MatError } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatButton } from '@angular/material/button';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule, RouterLink,
    MatCard, MatCardHeader, MatCardContent, MatCardActions, MatCardTitle, MatCardSubtitle,
    MatFormField, MatLabel, MatError, MatInput,
    MatButton, MatProgressSpinner
  ],
  template: `
    <div class="auth-container">
      <mat-card class="auth-card">
        <mat-card-header>
          <mat-card-title>Sign In</mat-card-title>
          <mat-card-subtitle>Welcome back to TaskFlow</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="submit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" autocomplete="email" />
              @if (form.get('email')?.invalid && form.get('email')?.touched) {
                <mat-error>Enter a valid email address</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input matInput type="password" formControlName="password" autocomplete="current-password" />
              @if (form.get('password')?.invalid && form.get('password')?.touched) {
                <mat-error>Password is required</mat-error>
              }
            </mat-form-field>

            @if (error()) {
              <p class="error-banner">{{ error() }}</p>
            }

            <button mat-raised-button color="primary" type="submit"
                    class="full-width submit-btn" [disabled]="loading()">
              @if (loading()) { <mat-spinner diameter="20" /> }
              @else { Sign In }
            </button>
          </form>
        </mat-card-content>

        <mat-card-actions>
          <a mat-button routerLink="/auth/register">Don't have an account? Register</a>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .auth-container { display:flex; align-items:center; justify-content:center; min-height:100vh; background:#f0f2f5; }
    .auth-card { width:400px; padding:16px; }
    .full-width { width:100%; display:block; }
    .submit-btn { margin-top:8px; }
    .error-banner { color:#b00020; font-size:14px; margin:8px 0; }
    mat-card-actions { padding:8px 16px; }
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
    email:    ['', [Validators.required, Validators.email]],
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
