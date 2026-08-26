import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  // Public routes — no guard
  {
    path: 'auth',
    children: [
      { path: 'login',    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
      { path: 'register', loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent) }
    ]
  },

  // Protected routes — authGuard runs before each child loads
  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'projects',  loadComponent: () => import('./features/projects/project-list/project-list.component').then(m => m.ProjectListComponent) },
      { path: 'projects/:id', loadComponent: () => import('./features/projects/project-detail/project-detail.component').then(m => m.ProjectDetailComponent) }
    ]
  },

  { path: '**', redirectTo: 'dashboard' }
];
