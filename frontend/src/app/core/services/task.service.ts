import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Task, CreateTaskRequest, UpdateTaskRequest, TaskQueryParams } from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/tasks`;

  getByProject(query: TaskQueryParams): Observable<Task[]> {
    // HttpParams is immutable — each .set() returns a new instance with the added param
    let params = new HttpParams().set('projectId', query.projectId);
    if (query.status !== undefined)   params = params.set('status',     query.status);
    if (query.priority !== undefined) params = params.set('priority',   query.priority);
    if (query.assigneeId)             params = params.set('assigneeId', query.assigneeId);
    if (query.search?.trim())         params = params.set('search',     query.search.trim());
    return this.http.get<Task[]>(this.base, { params });
  }

  getById(id: number): Observable<Task>                              { return this.http.get<Task>(`${this.base}/${id}`); }
  create(req: CreateTaskRequest): Observable<Task>                   { return this.http.post<Task>(this.base, req); }
  update(id: number, req: UpdateTaskRequest): Observable<Task>       { return this.http.put<Task>(`${this.base}/${id}`, req); }
  delete(id: number): Observable<void>                               { return this.http.delete<void>(`${this.base}/${id}`); }
}
