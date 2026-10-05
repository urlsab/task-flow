import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';
import { FinanceService } from '../../core/services/finance.service';
import { NotificationService } from '../../core/services/notification.service';
import { PwaInstallService } from '../../core/services/pwa-install.service';
import { CreateFinancialRecordRequest, FinanceDashboard, FinancialRecord } from '../../core/models/finance.model';

interface TypeSlice {
  label: string;
  value: number;
  color: string;
  percent: number;
}

interface MonthlyPoint {
  monthLabel: string;
  amount: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DatePipe,
    DecimalPipe,
    MatButton,
    MatIcon,
    MatIconButton,
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
    MatFormField,
    MatInput,
    MatLabel,
    MatOption,
    MatProgressSpinner,
    MatSelect
  ],
  template: `
    <header id="top" class="page-header">
      <div>
        <h1>שלום {{ auth.currentUser()?.fullName }}</h1>
        <p>ניהול כספים מתקדם לבית הכנסת ממסך אחד</p>
      </div>
      <div class="header-date">
        <mat-icon>calendar_month</mat-icon>
        <span>{{ now | date:'dd/MM/yyyy' }}</span>
      </div>
      <div class="header-actions">
        @if (install.canInstall()) {
          <button mat-stroked-button class="header-action-btn" (click)="installApp()">
            <mat-icon>download</mat-icon>
            התקנה לטלפון
          </button>
        }
        <button mat-stroked-button class="header-action-btn" (click)="requestNotificationPermission()">
          <mat-icon>notifications</mat-icon>
          {{ notifications.permission() === 'granted' ? 'התראות פעילות' : 'הפעלת התראות' }}
        </button>
      </div>
    </header>

    @if (loading()) {
      <div class="center"><mat-spinner /></div>
    } @else {
      <section class="totals-grid">
        <mat-card class="metric-card success"><mat-card-content><mat-icon>trending_up</mat-icon><span>הכנסות</span><strong>{{ totals().incomes | number:'1.2-2' }} ₪</strong></mat-card-content></mat-card>
        <mat-card class="metric-card danger"><mat-card-content><mat-icon>trending_down</mat-icon><span>הוצאות</span><strong>{{ totals().expenses | number:'1.2-2' }} ₪</strong></mat-card-content></mat-card>
        <mat-card class="metric-card accent"><mat-card-content><mat-icon>volunteer_activism</mat-icon><span>תרומות</span><strong>{{ totals().donations | number:'1.2-2' }} ₪</strong></mat-card-content></mat-card>
        <mat-card class="metric-card info"><mat-card-content><mat-icon>receipt_long</mat-icon><span>קבלות</span><strong>{{ totals().receipts | number:'1.2-2' }} ₪</strong></mat-card-content></mat-card>
        <mat-card class="metric-card warn"><mat-card-content><mat-icon>payments</mat-icon><span>סה"כ חובות</span><strong>{{ totals().debts | number:'1.2-2' }} ₪</strong></mat-card-content></mat-card>
        <mat-card class="metric-card success"><mat-card-content><mat-icon>task_alt</mat-icon><span>חובות ששולמו</span><strong>{{ totals().paidDebts | number:'1.2-2' }} ₪</strong></mat-card-content></mat-card>
        <mat-card class="metric-card danger"><mat-card-content><mat-icon>warning_amber</mat-icon><span>חובות פתוחים</span><strong>{{ totals().pendingDebts | number:'1.2-2' }} ₪</strong></mat-card-content></mat-card>
      </section>

      <section class="analytics-grid">
        <mat-card class="analytics-card">
          <mat-card-header><mat-card-title>התפלגות כספית</mat-card-title></mat-card-header>
          <mat-card-content>
            <div class="donut-wrap">
              <div class="donut" [style.background]="donutGradient()">
                <span>{{ totalChartAmount() | number:'1.0-0' }} ₪</span>
              </div>
              <div class="legend-list">
                @for (slice of typeBreakdown(); track slice.label) {
                  <div class="legend-row">
                    <span class="dot" [style.background]="slice.color"></span>
                    <span>{{ slice.label }}</span>
                    <strong>{{ slice.percent | number:'1.0-0' }}%</strong>
                  </div>
                }
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="analytics-card">
          <mat-card-header><mat-card-title>מגמת חובות חודשית (6 חודשים)</mat-card-title></mat-card-header>
          <mat-card-content>
            <div class="bars">
              @for (point of monthlyDebtTrend(); track point.monthLabel) {
                <div class="bar-item">
                  <div class="bar-rail">
                    <div class="bar-fill" [style.height.%]="barHeight(point.amount)"></div>
                  </div>
                  <div class="bar-label">{{ point.monthLabel }}</div>
                  <div class="bar-value">{{ point.amount | number:'1.0-0' }}</div>
                </div>
              }
            </div>
          </mat-card-content>
        </mat-card>
      </section>

      <section class="panels-grid">
        <mat-card id="add-record">
          <mat-card-header><mat-card-title>הוספת רשומה כספית</mat-card-title></mat-card-header>
          <mat-card-content>
            <form [formGroup]="createForm" (ngSubmit)="createRecord()" class="form-grid">
              <mat-form-field appearance="outline">
                <mat-label>סוג</mat-label>
                <mat-select formControlName="type">
                  @for (option of typeOptions; track option.value) {
                    <mat-option [value]="option.value">{{ option.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>סטטוס תשלום</mat-label>
                <mat-select formControlName="paymentStatus">
                  <mat-option [value]="1">ממתין</mat-option>
                  <mat-option [value]="2">שולם</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>שם מתפלל</mat-label>
                <input matInput formControlName="payerName" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>סכום</mat-label>
                <input matInput type="number" formControlName="amount" min="0.01" step="0.01" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>תאריך</mat-label>
                <input matInput type="date" formControlName="date" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>על מה שילם</mat-label>
                <input matInput formControlName="paymentFor" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-row">
                <mat-label>פירוט</mat-label>
                <input matInput formControlName="description" />
              </mat-form-field>

              <button mat-raised-button color="primary" type="submit" [disabled]="creating()" class="save-btn">
                @if (creating()) { שומר... } @else { שמירת רשומה }
              </button>
            </form>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-header><mat-card-title>מצב חובות לפי מתפלל</mat-card-title></mat-card-header>
          <mat-card-content class="debt-status">
            <div>
              <h3>שילמו</h3>
              @if (dashboard()?.paidPayers?.length) {
                <ul>
                  @for (payer of dashboard()!.paidPayers; track payer.payerName) {
                    <li>{{ payer.payerName }} — {{ payer.totalAmount | number:'1.2-2' }} ₪ ({{ payer.recordCount }})</li>
                  }
                </ul>
              } @else {
                <p>אין רשומות.</p>
              }
            </div>

            <div>
              <h3>טרם שילמו</h3>
              @if (dashboard()?.pendingPayers?.length) {
                <ul>
                  @for (payer of dashboard()!.pendingPayers; track payer.payerName) {
                    <li>{{ payer.payerName }} — {{ payer.totalAmount | number:'1.2-2' }} ₪ ({{ payer.recordCount }})</li>
                  }
                </ul>
              } @else {
                <p>אין חובות פתוחים.</p>
              }
            </div>
          </mat-card-content>
        </mat-card>
      </section>

      <mat-card id="records" class="records-card">
        <mat-card-header><mat-card-title>רשומות כספיות</mat-card-title></mat-card-header>
        <mat-card-content>
          <form [formGroup]="filterForm" class="filters">
            <mat-form-field appearance="outline">
              <mat-label>חיפוש</mat-label>
              <input matInput formControlName="search" placeholder="שם, פירוט או מטרה" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>סוג</mat-label>
              <mat-select formControlName="type">
                <mat-option [value]="null">הכול</mat-option>
                @for (option of typeOptions; track option.value) {
                  <mat-option [value]="option.value">{{ option.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>סטטוס</mat-label>
              <mat-select formControlName="paymentStatus">
                <mat-option [value]="null">הכול</mat-option>
                <mat-option [value]="1">ממתין</mat-option>
                <mat-option [value]="2">שולם</mat-option>
              </mat-select>
            </mat-form-field>
            <button mat-stroked-button type="button" (click)="reloadRecords()">סינון</button>
          </form>

          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>תאריך</th>
                  <th>סוג</th>
                  <th>שם מתפלל</th>
                  <th>על מה</th>
                  <th>פירוט</th>
                  <th>סטטוס</th>
                  <th>סכום</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (record of records(); track record.id) {
                  <tr>
                    <td data-label="תאריך">{{ record.date | date:'dd/MM/yyyy' }}</td>
                    <td data-label="סוג">{{ typeLabel(record.type) }}</td>
                    <td data-label="שם מתפלל">{{ record.payerName }}</td>
                    <td data-label="על מה">{{ record.paymentFor || '-' }}</td>
                    <td data-label="פירוט">{{ record.description }}</td>
                    <td data-label="סטטוס">{{ paymentStatusLabel(record.paymentStatus) }}</td>
                    <td data-label="סכום">{{ record.amount | number:'1.2-2' }} ₪</td>
                    <td data-label="פעולות">
                      <button mat-icon-button color="warn" (click)="deleteRecord(record)">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="8">אין נתונים להצגה.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </mat-card-content>
      </mat-card>

      <nav class="mobile-bottom-nav">
        <button mat-button (click)="scrollToSection('top')"><mat-icon>home</mat-icon><span>ראשי</span></button>
        <button mat-button (click)="scrollToSection('add-record')"><mat-icon>add_circle</mat-icon><span>הוספה</span></button>
        <button mat-button (click)="scrollToSection('records')"><mat-icon>list_alt</mat-icon><span>רשומות</span></button>
      </nav>
    }
  `,
  styles: [`
    :host { display: block; padding-bottom: 86px; color: var(--tf-text); }
    .page-header {
      margin-bottom: 12px;
      padding: 14px;
      border-radius: 18px;
      color: #fff;
      background: linear-gradient(145deg, #1565c0, #7b1fa2);
      box-shadow: 0 12px 24px rgba(31, 68, 154, 0.25);
      display: flex;
      justify-content: space-between;
      align-items: start;
      gap: 10px;
    }
    .page-header h1 { margin: 0 0 6px; font-size: 1.25rem; }
    .page-header p { margin: 0; color: rgba(255, 255, 255, 0.9); font-size: 0.9rem; }
    .header-date {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 14px;
      padding: 4px 8px;
      font-size: 0.82rem;
    }
    .header-actions {
      display: grid;
      gap: 6px;
      justify-items: end;
    }
    .header-action-btn {
      color: #fff !important;
      border-color: rgba(255, 255, 255, 0.45) !important;
      min-height: 34px;
      border-radius: 11px;
      font-size: 0.76rem;
      backdrop-filter: blur(3px);
    }
    .center { display: flex; justify-content: center; margin-top: 64px; }

    .totals-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(140px, 1fr));
      gap: 10px;
      margin-bottom: 12px;
    }
    .metric-card {
      border-radius: 14px;
      box-shadow: var(--tf-shadow);
      background: var(--tf-surface);
      border: 1px solid var(--tf-border);
      transition: transform 160ms ease, box-shadow 160ms ease;
    }
    .metric-card:hover { transform: translateY(-2px); box-shadow: 0 10px 22px rgba(16, 30, 56, 0.15); }
    .metric-card mat-card-content {
      display: grid;
      gap: 2px;
      padding: 10px !important;
    }
    .metric-card mat-icon { font-size: 18px; width: 18px; height: 18px; opacity: 0.85; }
    .metric-card span { color: var(--tf-text-muted); font-size: 0.8rem; }
    .metric-card strong { font-size: 1rem; }
    .metric-card.success strong { color: #1f7a1f; }
    .metric-card.danger strong { color: #b02020; }
    .metric-card.warn strong { color: #ad6200; }
    .metric-card.info strong { color: #005fa0; }
    .metric-card.accent strong { color: #6a1b9a; }

    .analytics-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
      margin-bottom: 12px;
    }
    .analytics-card {
      background: var(--tf-surface);
      border: 1px solid var(--tf-border);
      box-shadow: var(--tf-shadow);
      border-radius: 16px;
    }
    .donut-wrap {
      display: grid;
      grid-template-columns: 130px 1fr;
      gap: 12px;
      align-items: center;
    }
    .donut {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      position: relative;
      display: grid;
      place-items: center;
      margin: 0 auto;
    }
    .donut::after {
      content: '';
      position: absolute;
      width: 74px;
      height: 74px;
      border-radius: 50%;
      background: var(--tf-surface);
      border: 1px solid var(--tf-border);
    }
    .donut span {
      position: relative;
      z-index: 1;
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--tf-text);
    }
    .legend-list { display: grid; gap: 6px; }
    .legend-row {
      display: grid;
      grid-template-columns: 12px 1fr auto;
      align-items: center;
      gap: 7px;
      font-size: 0.84rem;
      color: var(--tf-text);
    }
    .dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }

    .bars {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 10px;
      align-items: end;
      min-height: 175px;
    }
    .bar-item {
      display: grid;
      justify-items: center;
      gap: 4px;
      animation: fadeInUp 280ms ease both;
    }
    .bar-rail {
      width: 100%;
      max-width: 30px;
      height: 110px;
      background: var(--tf-surface-soft);
      border: 1px solid var(--tf-border);
      border-radius: 20px;
      display: flex;
      align-items: end;
      overflow: hidden;
    }
    .bar-fill {
      width: 100%;
      background: linear-gradient(180deg, #42a5f5, #1e88e5);
      border-radius: 20px;
      transition: height 280ms ease;
    }
    .bar-label { font-size: 0.74rem; color: var(--tf-text-muted); }
    .bar-value { font-size: 0.72rem; color: var(--tf-text); font-weight: 600; }

    .panels-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
      margin-bottom: 12px;
    }
    mat-card {
      border-radius: 16px;
      border: 1px solid var(--tf-border);
      background: var(--tf-surface);
      box-shadow: var(--tf-shadow);
      transition: transform 160ms ease;
    }
    mat-card:hover { transform: translateY(-1px); }
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      align-items: start;
    }
    .full-row { grid-column: 1 / -1; }
    .save-btn {
      grid-column: 1 / -1;
      border-radius: 12px;
      height: 44px;
      font-weight: 600;
      letter-spacing: 0.2px;
    }

    .debt-status {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .debt-status ul { margin: 0; padding-inline-start: 20px; }

    .records-card {
      background: linear-gradient(180deg, var(--tf-surface), var(--tf-surface-soft));
    }
    .filters {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr auto;
      gap: 10px;
      margin-bottom: 12px;
      align-items: center;
    }
    .table-wrapper { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th, td {
      border-bottom: 1px solid var(--tf-border);
      text-align: right;
      padding: 8px;
      font-size: 13px;
      color: var(--tf-text);
    }
    thead th { font-weight: 600; color: var(--tf-text-muted); }

    .mobile-bottom-nav {
      position: fixed;
      bottom: 8px;
      left: 50%;
      transform: translateX(-50%);
      width: min(430px, calc(100vw - 16px));
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
      background: rgba(255, 255, 255, 0.93);
      backdrop-filter: blur(14px);
      border: 1px solid var(--tf-border);
      border-radius: 18px;
      box-shadow: 0 10px 28px rgba(17, 28, 44, 0.2);
      z-index: 30;
      padding: 6px;
    }
    .mobile-bottom-nav button {
      border-radius: 12px;
      min-height: 46px;
      display: grid;
      gap: 2px;
      justify-items: center;
      color: #34445f;
    }
    .mobile-bottom-nav span { font-size: 0.73rem; }

    @media (max-width: 1000px) {
      .filters { grid-template-columns: 1fr; }
      .form-grid { grid-template-columns: 1fr; }
      .debt-status { grid-template-columns: 1fr; }
      .donut-wrap { grid-template-columns: 1fr; justify-items: center; }
    }

    @media (max-width: 768px) {
      table, thead, tbody, th, td, tr { display: block; }
      thead { display: none; }
      tbody tr {
        border: 1px solid var(--tf-border);
        border-radius: 12px;
        padding: 8px;
        margin-bottom: 10px;
        background: var(--tf-surface);
      }
      tbody td {
        border: 0;
        padding: 6px 4px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
      }
      tbody td::before {
        content: attr(data-label);
        color: var(--tf-text-muted);
        font-weight: 600;
      }
    }

    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class DashboardComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly financeService = inject(FinanceService);
  readonly notifications = inject(NotificationService);
  readonly install = inject(PwaInstallService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);

  readonly now = new Date();
  readonly typeOptions = [
    { value: 1, label: 'הוצאה' },
    { value: 2, label: 'הכנסה' },
    { value: 3, label: 'תרומה' },
    { value: 4, label: 'קבלה' },
    { value: 5, label: 'חוב' }
  ] as const;

  readonly loading = signal(true);
  readonly creating = signal(false);
  readonly dashboard = signal<FinanceDashboard | null>(null);
  readonly records = signal<FinancialRecord[]>([]);
  readonly totals = computed(() => this.dashboard()?.totals ?? {
    expenses: 0,
    incomes: 0,
    donations: 0,
    receipts: 0,
    debts: 0,
    paidDebts: 0,
    pendingDebts: 0
  });

  readonly typeBreakdown = computed<TypeSlice[]>(() => {
    const t = this.totals();
    const rows = [
      { label: 'הכנסות', value: t.incomes, color: '#2e7d32' },
      { label: 'הוצאות', value: t.expenses, color: '#d32f2f' },
      { label: 'תרומות', value: t.donations, color: '#8e24aa' },
      { label: 'קבלות', value: t.receipts, color: '#1565c0' },
      { label: 'חובות', value: t.debts, color: '#ef6c00' }
    ];
    const total = rows.reduce((sum, row) => sum + row.value, 0);
    return rows.map(row => ({
      ...row,
      percent: total > 0 ? (row.value / total) * 100 : 0
    }));
  });

  readonly totalChartAmount = computed(() =>
    this.typeBreakdown().reduce((sum, x) => sum + x.value, 0)
  );

  readonly monthlyDebtTrend = computed<MonthlyPoint[]>(() => {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      return { key, monthLabel: date.toLocaleDateString('he-IL', { month: 'short' }), amount: 0 };
    });

    const map = new Map(months.map(m => [m.key, m]));
    this.records().forEach(record => {
      if (record.type !== 5) return;
      const date = new Date(record.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const point = map.get(key);
      if (point) point.amount += record.amount;
    });

    return months;
  });

  readonly createForm = this.fb.group({
    type: [5, Validators.required],
    paymentStatus: [1, Validators.required],
    payerName: ['', Validators.required],
    description: ['', Validators.required],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    date: [new Date().toISOString().slice(0, 10), Validators.required],
    paymentFor: ['']
  });

  readonly filterForm = this.fb.group({
    search: [''],
    type: [null as number | null],
    paymentStatus: [null as number | null]
  });

  ngOnInit(): void {
    this.reloadAll();
  }

  reloadAll(): void {
    this.loading.set(true);
    this.financeService.getDashboard().subscribe({
      next: dashboard => {
        this.dashboard.set(dashboard);
        this.loading.set(false);
        void this.notifyOnPendingDebts(dashboard);
      },
      error: err => {
        this.loading.set(false);
        this.snackBar.open(err?.error?.error ?? 'טעינת הדאשבורד נכשלה', 'סגירה', { duration: 5000 });
      }
    });

    this.reloadRecords();
  }

  reloadRecords(): void {
    const query = this.filterForm.getRawValue();
    this.financeService.getRecords(query).subscribe({
      next: records => this.records.set(records),
      error: err => this.snackBar.open(err?.error?.error ?? 'טעינת הרשומות נכשלה', 'סגירה', { duration: 5000 })
    });
  }

  createRecord(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    this.creating.set(true);
    const value = this.createForm.getRawValue();
    const request: CreateFinancialRecordRequest = {
      type: value.type ?? 5,
      paymentStatus: value.paymentStatus ?? 1,
      payerName: value.payerName?.trim() ?? '',
      description: value.description?.trim() ?? '',
      amount: value.amount ?? 0,
      date: value.date ? `${value.date}T00:00:00Z` : new Date().toISOString(),
      paymentFor: value.paymentFor?.trim() ? value.paymentFor.trim() : null
    };

    this.financeService.createRecord(request).subscribe({
      next: () => {
        this.creating.set(false);
        this.createForm.patchValue({
          paymentStatus: 1,
          amount: null,
          description: '',
          payerName: '',
          paymentFor: ''
        });
        this.snackBar.open('הרשומה נשמרה בהצלחה', '', { duration: 2500 });
        void this.notifications.notify(
          'רשומה נשמרה בהצלחה',
          `${request.payerName} • ${request.amount.toFixed(2)} ₪`
        );
        this.reloadAll();
      },
      error: err => {
        this.creating.set(false);
        this.snackBar.open(err?.error?.error ?? 'שמירת הרשומה נכשלה', 'סגירה', { duration: 5000 });
      }
    });
  }

  deleteRecord(record: FinancialRecord): void {
    this.financeService.deleteRecord(record.id).subscribe({
      next: () => {
        this.records.update(items => items.filter(x => x.id !== record.id));
        this.snackBar.open('הרשומה נמחקה', '', { duration: 2000 });
        this.reloadAll();
      },
      error: err => this.snackBar.open(err?.error?.error ?? 'מחיקת רשומה נכשלה', 'סגירה', { duration: 5000 })
    });
  }

  typeLabel(type: number): string {
    return this.typeOptions.find(x => x.value === type)?.label ?? 'לא ידוע';
  }

  paymentStatusLabel(status: number): string {
    return status === 2 ? 'שולם' : 'ממתין';
  }

  donutGradient(): string {
    const slices = this.typeBreakdown();
    const total = slices.reduce((sum, slice) => sum + slice.value, 0);
    if (total <= 0) {
      return 'conic-gradient(#d9e2f1 0deg 360deg)';
    }

    let cursor = 0;
    const parts = slices.map(slice => {
      const size = (slice.value / total) * 360;
      const from = cursor;
      const to = cursor + size;
      cursor = to;
      return `${slice.color} ${from}deg ${to}deg`;
    });
    return `conic-gradient(${parts.join(', ')})`;
  }

  barHeight(amount: number): number {
    const max = Math.max(...this.monthlyDebtTrend().map(x => x.amount), 1);
    return Math.max((amount / max) * 100, amount > 0 ? 6 : 0);
  }

  scrollToSection(id: string): void {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async installApp(): Promise<void> {
    const outcome = await this.install.promptInstall();
    if (outcome === 'accepted') {
      this.snackBar.open('האפליקציה נוספה למכשיר', '', { duration: 2600 });
      return;
    }
    if (outcome === 'dismissed') {
      this.snackBar.open('ההתקנה בוטלה', '', { duration: 2600 });
      return;
    }
    this.snackBar.open('המכשיר לא מאפשר התקנה כרגע', 'סגירה', { duration: 3200 });
  }

  async requestNotificationPermission(): Promise<void> {
    if (!this.notifications.isSupported()) {
      this.snackBar.open('התראות זמינות רק ב-HTTPS או באפליקציה מותקנת', 'סגירה', { duration: 5000 });
      return;
    }

    const result = await this.notifications.requestPermission();
    if (result === 'granted') {
      this.snackBar.open('התראות הופעלו', '', { duration: 2500 });
      await this.notifications.notify('התראות פעילות', 'תקבל/י התראה על חובות פתוחים ושמירת רשומות.');
      return;
    }

    this.snackBar.open('לא אושרו התראות', 'סגירה', { duration: 3500 });
  }

  private async notifyOnPendingDebts(dashboard: FinanceDashboard): Promise<void> {
    if (dashboard.totals.pendingDebts <= 0) return;
    if (this.notifications.permission() !== 'granted') return;

    const today = new Date().toISOString().slice(0, 10);
    const key = `tf_pending_debt_notified_${today}`;
    if (localStorage.getItem(key) === '1') return;

    const topDebt = dashboard.pendingPayers[0];
    const body = topDebt
      ? `חובות פתוחים: ${dashboard.totals.pendingDebts.toFixed(2)} ₪. גבוה ביותר: ${topDebt.payerName}`
      : `חובות פתוחים: ${dashboard.totals.pendingDebts.toFixed(2)} ₪`;

    const sent = await this.notifications.notify('תזכורת גבייה יומית', body);
    if (sent) localStorage.setItem(key, '1');
  }
}
