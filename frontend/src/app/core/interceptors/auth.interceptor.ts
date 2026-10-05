import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AdminService } from '../services/admin.service';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const isAdminRequest = req.url.includes('/api/admin');
  const token = isAdminRequest
    ? inject(AdminService).token()
    : inject(AuthService).token();

  if (!token) return next(req);

  return next(req.clone({
    headers: req.headers.set('Authorization', `Bearer ${token}`)
  }));
};
