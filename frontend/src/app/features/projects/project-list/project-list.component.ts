import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCard, MatCardHeader, MatCardContent, MatCardTitle, MatCardSubtitle } from '@angular/material/card';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatFormField, MatLabel, MatError } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProjectService } from '../../../core/services/project.service';
import { Project } from '../../../core/models/project.model';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [
    RouterLink, ReactiveFormsModule,
    MatCard, MatCardHeader, MatCardContent, MatCardTitle, MatCardSubtitle,
    MatButton, MatIcon, MatFormField, MatLabel, MatError, MatInput, MatProgressSpinner
  ],
  template: `
    <div class="header">
      <h1>My Projects</h1>
      <button mat-raised-button color="primary" (click)="creating.set(true)">
        <mat-icon>add</mat-icon> New Project
      </button>
    </div>

    @if (creating()) {
      <mat-card class="create-form">
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="submitCreate()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Project Name</mat-label>
              <input matInput formControlName="name" placeholder="e.g. Website Redesign" autofocus />
              @if (form.get('name')?.invalid && form.get('name')?.touched) {
                <mat-error>Name is required</mat-error>
              }
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Description (optional)</mat-label>
              <textarea matInput formControlName="description" rows="2"></textarea>
            </mat-form-field>
            <div class="form-actions">
              <button mat-button type="button" (click)="creating.set(false)">Cancel</button>
              <button mat-raised-button color="primary" type="submit" [disabled]="saving()">
                @if (saving()) { Saving... } @else { Create }
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    }

    @if (loading()) {
      <div class="center"><mat-spinner /></div>
    } @else {
      <div class="grid">
        @for (p of projects(); track p.id) {
          <mat-card class="project-card" [routerLink]="['/projects', p.id]">
            <mat-card-header>
              <mat-card-title>{{ p.name }}</mat-card-title>
              <mat-card-subtitle>Owner: {{ p.ownerName }}</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <p class="desc">{{ p.description ?? 'No description' }}</p>
              <p class="count"><mat-icon inline>assignment</mat-icon> {{ p.taskCount }} task(s)</p>
            </mat-card-content>
          </mat-card>
        } @empty {
          <p>No projects yet — create one to get started.</p>
        }
      </div>
    }
  `,
  styles: [`
    .header { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; }
    .center { display:flex; justify-content:center; margin-top:60px; }
    .create-form { margin-bottom:24px; }
    .full-width { width:100%; display:block; margin-bottom:4px; }
    .form-actions { display:flex; gap:8px; justify-content:flex-end; margin-top:8px; }
    .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:16px; }
    .project-card { cursor:pointer; transition:box-shadow 0.2s; }
    .project-card:hover { box-shadow:0 4px 12px rgba(0,0,0,0.15); }
    .desc { color:#666; font-size:14px; margin:8px 0 4px; }
    .count { display:flex; align-items:center; gap:4px; font-size:13px; color:#444; margin:0; }
  `]
})
export class ProjectListComponent implements OnInit {
  private readonly projectService = inject(ProjectService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);

  readonly loading  = signal(true);
  readonly creating = signal(false);
  readonly saving   = signal(false);
  readonly projects = signal<Project[]>([]);

  readonly form = this.fb.group({
    name:        ['', Validators.required],
    description: ['']
  });

  ngOnInit(): void {
    this.projectService.getAll().subscribe({
      next: p => { this.projects.set(p); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  submitCreate(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);

    this.projectService.create(this.form.getRawValue() as any).subscribe({
      next: p => {
        // update() mutates the signal value without replacing the whole array ref
        this.projects.update(list => [p, ...list]);
        this.creating.set(false);
        this.saving.set(false);
        this.form.reset();
        this.snackBar.open('Project created!', '', { duration: 3000 });
      },
      error: () => this.saving.set(false)
    });
  }
}
