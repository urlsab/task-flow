import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Project, CreateProjectRequest, UpdateProjectRequest, ProjectStats } from '../models/project.model';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/projects`;

  // Each method returns an Observable — the HTTP call only fires when subscribed to
  getAll(): Observable<Project[]>                                { return this.http.get<Project[]>(this.base); }
  getById(id: number): Observable<Project>                       { return this.http.get<Project>(`${this.base}/${id}`); }
  getStats(id: number): Observable<ProjectStats>                 { return this.http.get<ProjectStats>(`${this.base}/${id}/stats`); }
  create(req: CreateProjectRequest): Observable<Project>         { return this.http.post<Project>(this.base, req); }
  update(id: number, req: UpdateProjectRequest): Observable<Project> { return this.http.put<Project>(`${this.base}/${id}`, req); }
  delete(id: number): Observable<void>                           { return this.http.delete<void>(`${this.base}/${id}`); }
}
