import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin, switchMap } from 'rxjs';
import { map, of } from 'rxjs';
import { MatCard, MatCardHeader, MatCardContent, MatCardActions, MatCardTitle, MatCardSubtitle } from '@angular/material/card';
import { MatButton } from '@angular/material/button';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { ProjectService } from '../../core/services/project.service';
import { AuthService } from '../../core/services/auth.service';
import { Project, ProjectStats } from '../../core/models/project.model';

interface DashboardEntry { project: Project; stats: ProjectStats; }

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, MatCard, MatCardHeader, MatCardContent, MatCardActions,
            MatCardTitle, MatCardSubtitle, MatButton, MatProgressSpinner],
  template: `
    <h1>Welcome, {{ auth.currentUser()?.fullName }}!</h1>

    @if (loading()) {
      <div class="center"><mat-spinner /></div>
    } @else if (entries().length === 0) {
      <mat-card>
        <mat-card-content>
          <p>No projects yet. <a routerLink="/projects">Create your first project →</a></p>
        </mat-card-content>
      </mat-card>
    } @else {
      <div class="grid">
        @for (entry of entries(); track entry.project.id) {
          <mat-card>
            <mat-card-header>
              <mat-card-title>{{ entry.project.name }}</mat-card-title>
              <mat-card-subtitle>{{ entry.project.description ?? 'No description' }}</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="stats-row">
                <div class="stat"><span class="val">{{ entry.stats.totalTasks }}</span><span class="lbl">Total</span></div>
                <div class="stat todo"><span class="val">{{ entry.stats.todoCount }}</span><span class="lbl">Todo</span></div>
                <div class="stat prog"><span class="val">{{ entry.stats.inProgressCount }}</span><span class="lbl">In Progress</span></div>
                <div class="stat done"><span class="val">{{ entry.stats.doneCount }}</span><span class="lbl">Done</span></div>
              </div>
              @if (entry.stats.overdueTasks > 0) {
                <p class="overdue">⚠ {{ entry.stats.overdueTasks }} overdue</p>
              }
            </mat-card-content>
            <mat-card-actions align="end">
              <a mat-button [routerLink]="['/projects', entry.project.id]">View Tasks →</a>
            </mat-card-actions>
          </mat-card>
        }
      </div>
    }
  `,
  styles: [`
    h1 { margin-bottom: 24px; }
    .center { display:flex; justify-content:center; margin-top:60px; }
    .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:16px; }
    .stats-row { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin:12px 0; }
    .stat { text-align:center; padding:8px; border-radius:8px; background:#f5f5f5; }
    .stat .val { display:block; font-size:24px; font-weight:700; }
    .stat .lbl { font-size:11px; color:#666; }
    .stat.todo .val { color:#1976d2; }
    .stat.prog .val { color:#f57c00; }
    .stat.done .val { color:#388e3c; }
    .overdue { color:#d32f2f; font-size:13px; margin:4px 0 0; }
  `]
})
export class DashboardComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly projectService = inject(ProjectService);
  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal(true);
  readonly entries = signal<DashboardEntry[]>([]);

  ngOnInit(): void {
    this.projectService.getAll().pipe(
      // switchMap: replaces the current Observable with a new one.
      // Here: "when projects arrive, create a new Observable that loads all stats in parallel"
      switchMap(projects => {
        if (projects.length === 0) return of<DashboardEntry[]>([]);

        // forkJoin: fires all requests simultaneously, emits once ALL have completed.
        // Think of it as Promise.all() — perfect when results are independent.
        return forkJoin(
          projects.map(p =>
            this.projectService.getStats(p.id).pipe(
              map(stats => ({ project: p, stats } as DashboardEntry))
            )
          )
        );
      })
    ).subscribe({
      next: entries => { this.entries.set(entries); this.loading.set(false); },
      error: (err)  => {
        this.loading.set(false);
        this.snackBar.open(err?.error?.error ?? 'Failed to load dashboard', 'Close', { duration: 6000 });
      }
    });
  }
}
