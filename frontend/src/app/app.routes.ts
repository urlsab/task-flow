import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },

  // Public routes — no guard
  {
    path: 'auth',
    children: [
      { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) }
    ]
  },
  {
    path: 'm-root-admin',
    children: [
      { path: 'login', loadComponent: () => import('./features/admin/admin-login/admin-login.component').then(m => m.AdminLoginComponent) },
      { path: 'panel', canActivate: [adminGuard], loadComponent: () => import('./features/admin/admin-panel/admin-panel.component').then(m => m.AdminPanelComponent) }
    ]
  },

  // Protected routes — authGuard runs before each child loads
  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) }
    ]
  },

  { path: '**', redirectTo: 'auth/login' }
];
