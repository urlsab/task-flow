import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, combineLatest, debounceTime, distinctUntilChanged, switchMap, takeUntil, startWith, catchError, of } from 'rxjs';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatFormField, MatLabel, MatPrefix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { MatDivider } from '@angular/material/divider';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SlicePipe } from '@angular/common';
import { ProjectService } from '../../../core/services/project.service';
import { TaskService } from '../../../core/services/task.service';
import { Task, TaskStatus, TaskPriority } from '../../../core/models/task.model';
import { Project, ProjectStats } from '../../../core/models/project.model';
import { TaskFormComponent } from '../../tasks/task-form/task-form.component';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    RouterLink, ReactiveFormsModule,
    MatCard, MatCardContent, MatButton, MatIconButton, MatIcon,
    MatFormField, MatLabel, MatPrefix, MatInput, MatSelect, MatOption,
    MatDivider, MatProgressSpinner, SlicePipe
  ],
  template: `
    @if (loadingProject()) {
      <div class="center"><mat-spinner /></div>
    } @else if (project()) {
      <div class="page-header">
        <a mat-button routerLink="/projects"><mat-icon>arrow_back</mat-icon> Projects</a>
        <h1>{{ project()!.name }}</h1>
        @if (project()!.description) { <p class="subtitle">{{ project()!.description }}</p> }
        @if (stats()) {
          <div class="stats-row">
            <span class="chip">{{ stats()!.totalTasks }} tasks</span>
            <span class="chip todo">{{ stats()!.todoCount }} todo</span>
            <span class="chip prog">{{ stats()!.inProgressCount }} in progress</span>
            <span class="chip done">{{ stats()!.doneCount }} done</span>
            @if (stats()!.overdueTasks > 0) {
              <span class="chip over">⚠ {{ stats()!.overdueTasks }} overdue</span>
            }
          </div>
        }
      </div>

      <mat-divider />

      <div class="filters">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Search tasks</mat-label>
          <mat-icon matPrefix>search</mat-icon>
          <input matInput [formControl]="searchCtrl" placeholder="Type to filter..." />
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Status</mat-label>
          <mat-select [formControl]="statusCtrl">
            <mat-option [value]="null">All</mat-option>
            <mat-option [value]="S.Todo">To Do</mat-option>
            <mat-option [value]="S.InProgress">In Progress</mat-option>
            <mat-option [value]="S.Review">Review</mat-option>
            <mat-option [value]="S.Done">Done</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Priority</mat-label>
          <mat-select [formControl]="priorityCtrl">
            <mat-option [value]="null">All</mat-option>
            <mat-option [value]="P.Low">Low</mat-option>
            <mat-option [value]="P.Medium">Medium</mat-option>
            <mat-option [value]="P.High">High</mat-option>
            <mat-option [value]="P.Critical">Critical</mat-option>
          </mat-select>
        </mat-form-field>

        <button mat-raised-button color="primary" (click)="openForm()">
          <mat-icon>add</mat-icon> New Task
        </button>
      </div>

      @if (loadingTasks()) {
        <div class="center"><mat-spinner diameter="40" /></div>
      } @else {
        <div class="task-list">
          @for (task of tasks(); track task.id) {
            <mat-card class="task-card" [class.done]="task.status === S.Done">
              <mat-card-content>
                <div class="task-row">
                  <div class="task-info">
                    <span class="title">{{ task.title }}</span>
                    @if (task.description) { <span class="desc">{{ task.description }}</span> }
                    <div class="meta">
                      <span class="badge" [class]="'s' + task.status">{{ task.statusLabel }}</span>
                      <span class="badge" [class]="'p' + task.priority">{{ task.priorityLabel }}</span>
                      @if (task.assigneeName) { <span class="meta-item">👤 {{ task.assigneeName }}</span> }
                      @if (task.dueDate) { <span class="meta-item">📅 {{ task.dueDate | slice:0:10 }}</span> }
                    </div>
                  </div>
                  <div class="actions">
                    <button mat-icon-button (click)="openForm(task)"><mat-icon>edit</mat-icon></button>
                    <button mat-icon-button color="warn" (click)="delete(task.id)"><mat-icon>delete</mat-icon></button>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          } @empty {
            <p class="empty">No tasks match your filters.</p>
          }
        </div>
      }
    }
  `,
  styles: [`
    .center { display:flex; justify-content:center; margin:60px 0; }
    .page-header { margin-bottom:16px; }
    .page-header h1 { margin:4px 0 0; }
    .subtitle { color:#666; margin:0; }
    .stats-row { display:flex; gap:8px; margin-top:12px; flex-wrap:wrap; }
    .chip { padding:4px 12px; border-radius:16px; font-size:13px; background:#e3f2fd; color:#1565c0; }
    .chip.todo { background:#e3f2fd; color:#1565c0; }
    .chip.prog { background:#fff3e0; color:#e65100; }
    .chip.done { background:#e8f5e9; color:#2e7d32; }
    .chip.over { background:#ffebee; color:#c62828; }
    .filters { display:flex; gap:12px; align-items:flex-start; margin:16px 0; flex-wrap:wrap; }
    .search-field { flex:1; min-width:200px; }
    .filter-field { width:140px; }
    .task-list { display:flex; flex-direction:column; gap:8px; }
    .task-card { transition:opacity 0.2s; }
    .task-card.done { opacity:0.55; }
    .task-row { display:flex; justify-content:space-between; align-items:flex-start; }
    .task-info { flex:1; }
    .title { font-weight:500; font-size:15px; display:block; }
    .desc { color:#666; font-size:13px; display:block; margin-top:2px; }
    .meta { display:flex; gap:8px; margin-top:8px; flex-wrap:wrap; align-items:center; }
    .badge { padding:2px 8px; border-radius:12px; font-size:12px; }
    .s0 { background:#e3f2fd; color:#1565c0; } .s1 { background:#fff3e0; color:#e65100; }
    .s2 { background:#f3e5f5; color:#6a1b9a; } .s3 { background:#e8f5e9; color:#2e7d32; }
    .p0 { background:#f5f5f5; color:#555; } .p1 { background:#e3f2fd; color:#1565c0; }
    .p2 { background:#fff3e0; color:#e65100; } .p3 { background:#ffebee; color:#c62828; }
    .meta-item { font-size:12px; color:#555; }
    .actions { display:flex; }
    .empty { color:#888; text-align:center; margin-top:40px; }
  `]
})
export class ProjectDetailComponent implements OnInit, OnDestroy {
  private readonly route          = inject(ActivatedRoute);
  private readonly projectService = inject(ProjectService);
  private readonly taskService    = inject(TaskService);
  private readonly dialog         = inject(MatDialog);
  private readonly snackBar       = inject(MatSnackBar);

  // Expose enums to template
  readonly S = TaskStatus;
  readonly P = TaskPriority;

  readonly loadingProject = signal(true);
  readonly loadingTasks   = signal(true);
  readonly project        = signal<Project | null>(null);
  readonly stats          = signal<ProjectStats | null>(null);
  readonly tasks          = signal<Task[]>([]);

  readonly searchCtrl   = new FormControl('');
  readonly statusCtrl   = new FormControl<TaskStatus | null>(null);
  readonly priorityCtrl = new FormControl<TaskPriority | null>(null);

  private projectId!: number;
  // Subject used to clean up all subscriptions when the component is destroyed
  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.projectId = Number(this.route.snapshot.paramMap.get('id'));

    // combineLatest: emits whenever EITHER observable emits.
    // Both requests start simultaneously — this is parallel fetching.
    combineLatest([
      this.projectService.getById(this.projectId),
      this.projectService.getStats(this.projectId)
    ]).pipe(takeUntil(this.destroy$))
      .subscribe(([project, stats]) => {
        this.project.set(project);
        this.stats.set(stats);
        this.loadingProject.set(false);
      });

    combineLatest([
      // startWith('') makes the filter controls emit immediately so tasks load on init
      this.searchCtrl.valueChanges.pipe(startWith(''), debounceTime(300), distinctUntilChanged()),
      this.statusCtrl.valueChanges.pipe(startWith(null)),
      this.priorityCtrl.valueChanges.pipe(startWith(null))
    ]).pipe(
      // switchMap: if filters change before the HTTP response arrives, cancel the old request.
      // This prevents stale results from a slow network from overwriting fresh results.
      switchMap(([search, status, priority]) => {
        this.loadingTasks.set(true);
        return this.taskService.getByProject({
          projectId: this.projectId,
          search: search ?? undefined,
          status: status ?? undefined,
          priority: priority ?? undefined
        }).pipe(catchError(() => of<Task[]>([])));
      }),
      takeUntil(this.destroy$)
    ).subscribe(tasks => {
      this.tasks.set(tasks);
      this.loadingTasks.set(false);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  openForm(task?: Task): void {
    this.dialog.open(TaskFormComponent, { width: '500px', data: { projectId: this.projectId, task } })
      .afterClosed().subscribe(saved => {
        if (!saved) return;
        this.projectService.getStats(this.projectId).subscribe(s => this.stats.set(s));
        // Re-trigger the filter stream by emitting the current search value
        this.searchCtrl.setValue(this.searchCtrl.value);
      });
  }

  delete(id: number): void {
    this.taskService.delete(id).subscribe(() => {
      this.tasks.update(list => list.filter(t => t.id !== id));
      this.snackBar.open('Task deleted', '', { duration: 2500 });
      this.projectService.getStats(this.projectId).subscribe(s => this.stats.set(s));
    });
  }
}
