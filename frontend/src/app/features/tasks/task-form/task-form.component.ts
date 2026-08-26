import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose, MatDialogRef } from '@angular/material/dialog';
import { MatFormField, MatLabel, MatError } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { MatButton } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { TaskService } from '../../../core/services/task.service';
import { Task, TaskStatus, TaskPriority } from '../../../core/models/task.model';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose,
    MatFormField, MatLabel, MatError, MatInput, MatSelect, MatOption,
    MatButton, MatDatepickerModule, MatNativeDateModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.task ? 'Edit Task' : 'New Task' }}</h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Title</mat-label>
          <input matInput formControlName="title" />
          @if (form.get('title')?.invalid && form.get('title')?.touched) {
            <mat-error>Title is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
        </mat-form-field>

        <div class="row">
          <mat-form-field appearance="outline" class="half">
            <mat-label>Priority</mat-label>
            <mat-select formControlName="priority">
              <mat-option [value]="P.Low">Low</mat-option>
              <mat-option [value]="P.Medium">Medium</mat-option>
              <mat-option [value]="P.High">High</mat-option>
              <mat-option [value]="P.Critical">Critical</mat-option>
            </mat-select>
          </mat-form-field>

          @if (data.task) {
            <mat-form-field appearance="outline" class="half">
              <mat-label>Status</mat-label>
              <mat-select formControlName="status">
                <mat-option [value]="S.Todo">To Do</mat-option>
                <mat-option [value]="S.InProgress">In Progress</mat-option>
                <mat-option [value]="S.Review">Review</mat-option>
                <mat-option [value]="S.Done">Done</mat-option>
              </mat-select>
            </mat-form-field>
          }
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Due Date</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="dueDate" />
          <mat-datepicker-toggle matIconSuffix [for]="picker" />
          <mat-datepicker #picker />
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" (click)="submit()" [disabled]="saving()">
        @if (saving()) { Saving... } @else { {{ data.task ? 'Save Changes' : 'Create Task' }} }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form { display:flex; flex-direction:column; padding-top:8px; min-width:400px; }
    .full-width { width:100%; }
    .row { display:flex; gap:12px; }
    .half { flex:1; }
  `]
})
export class TaskFormComponent implements OnInit {
  readonly data: { projectId: number; task?: Task } = inject(MAT_DIALOG_DATA);
  private readonly taskService = inject(TaskService);
  private readonly dialogRef   = inject(MatDialogRef<TaskFormComponent>);
  private readonly fb          = inject(FormBuilder);

  readonly S = TaskStatus;
  readonly P = TaskPriority;
  readonly saving = signal(false);

  readonly form = this.fb.group({
    title:       ['', Validators.required],
    description: [''],
    priority:    [TaskPriority.Medium as TaskPriority],
    status:      [TaskStatus.Todo as TaskStatus],
    dueDate:     [null as Date | null]
  });

  ngOnInit(): void {
    if (this.data.task) {
      this.form.patchValue({
        title:       this.data.task.title,
        description: this.data.task.description ?? '',
        priority:    this.data.task.priority,
        status:      this.data.task.status,
        dueDate:     this.data.task.dueDate ? new Date(this.data.task.dueDate) : null
      });
    }
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);

    const { title, description, priority, status, dueDate } = this.form.getRawValue();
    const dueDateIso = dueDate ? (dueDate as Date).toISOString() : null;

    const req$ = this.data.task
      ? this.taskService.update(this.data.task.id, { title: title!, description: description ?? null, status: status!, priority: priority!, dueDate: dueDateIso })
      : this.taskService.create({ title: title!, description: description ?? null, projectId: this.data.projectId, priority: priority!, dueDate: dueDateIso });

    req$.subscribe({
      next: () => this.dialogRef.close(true),
      error: () => this.saving.set(false)
    });
  }
}
