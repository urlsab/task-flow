import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { AdminUser } from '../../../core/models/admin.model';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [
    ReactiveFormsModule, DatePipe,
    MatButton, MatIconButton, MatIcon,
    MatCard, MatCardHeader, MatCardTitle, MatCardContent,
    MatFormField, MatLabel, MatInput, MatProgressSpinner
  ],
  template: `
    <section class="admin-shell">
      <header class="admin-header">
        <div class="head-brand">
          <img src="/icons/igabi-logo.svg" alt="iGabi" class="brand-logo" />
          <h1>ניהול משתמשי iGabi</h1>
        </div>
        <button mat-stroked-button color="warn" (click)="logout()">יציאה מאזור מנהל</button>
      </header>

      <mat-card class="create-card">
        <mat-card-header><mat-card-title>הוספת גבאי חדש</mat-card-title></mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="create()" class="grid">
            <mat-form-field appearance="outline">
              <mat-label>שם מלא</mat-label>
              <input matInput formControlName="fullName" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>שם משתמש</mat-label>
              <input matInput formControlName="username" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>סיסמה</mat-label>
              <input matInput type="password" formControlName="password" />
            </mat-form-field>
            <button mat-raised-button color="primary" type="submit" [disabled]="saving()">
              @if (saving()) { מוסיף... } @else { הוספת משתמש }
            </button>
          </form>
        </mat-card-content>
      </mat-card>

      <mat-card>
        <mat-card-header><mat-card-title>כל הגבאים במערכת</mat-card-title></mat-card-header>
        <mat-card-content>
          @if (loading()) {
            <div class="center"><mat-spinner /></div>
          } @else {
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>שם מלא</th>
                    <th>שם משתמש</th>
                    <th>נוצר בתאריך</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  @for (user of users(); track user.id) {
                    <tr>
                      <td>{{ user.fullName }}</td>
                      <td>{{ user.username }}</td>
                      <td>{{ user.createdAt | date:'dd/MM/yyyy HH:mm' }}</td>
                      <td>
                        <button mat-icon-button color="warn" (click)="remove(user)">
                          <mat-icon>delete</mat-icon>
                        </button>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="4">אין משתמשים</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </mat-card-content>
      </mat-card>
    </section>
  `,
  styles: [`
    .admin-shell {
      max-width: 980px;
      margin: 16px auto;
      padding: 10px 12px 16px;
      border-radius: 18px;
      background-image:
        linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.85)),
        url('/backgrounds/bimah.svg');
      background-size: cover, 820px auto;
      background-repeat: no-repeat;
      background-position: center, right -120px top 90px;
      box-shadow: 0 10px 28px rgba(19, 34, 63, 0.12);
    }
    .admin-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
    .head-brand { display:flex; align-items:center; gap:10px; }
    .brand-logo { width:98px; height:auto; }
    .grid { display:grid; grid-template-columns: 2fr 1.2fr 1.2fr auto; gap:10px; align-items:center; }
    .table-wrap { overflow-x:auto; }
    table { width:100%; border-collapse: collapse; }
    th, td { text-align:right; border-bottom:1px solid #e5e7eb; padding:8px; }
    .center { display:flex; justify-content:center; padding:24px; }
    @media (max-width:900px) {
      .grid { grid-template-columns:1fr; }
    }
  `]
})
export class AdminPanelComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly users = signal<AdminUser[]>([]);

  readonly form = this.fb.group({
    fullName: ['', Validators.required],
    username: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.admin.getUsers().subscribe({
      next: users => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: err => {
        this.loading.set(false);
        this.snackBar.open(err?.error?.error ?? 'טעינת משתמשים נכשלה', 'סגירה', { duration: 5000 });
      }
    });
  }

  create(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const value = this.form.getRawValue();
    this.admin.createUser({
      fullName: value.fullName?.trim() ?? '',
      username: value.username?.trim() ?? '',
      password: value.password ?? ''
    }).subscribe({
      next: user => {
        this.saving.set(false);
        this.users.update(items => [user, ...items]);
        this.form.reset();
        this.snackBar.open('הגבאי נוסף בהצלחה', '', { duration: 2500 });
      },
      error: err => {
        this.saving.set(false);
        this.snackBar.open(err?.error?.error ?? 'יצירת משתמש נכשלה', 'סגירה', { duration: 5000 });
      }
    });
  }

  remove(user: AdminUser): void {
    this.admin.deleteUser(user.id).subscribe({
      next: () => {
        this.users.update(items => items.filter(x => x.id !== user.id));
        this.snackBar.open('המשתמש הוסר', '', { duration: 2500 });
      },
      error: err => this.snackBar.open(err?.error?.error ?? 'מחיקת משתמש נכשלה', 'סגירה', { duration: 5000 })
    });
  }

  logout(): void {
    this.admin.logout();
  }
}
