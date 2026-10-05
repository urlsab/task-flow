import { HttpInterceptorFn, HttpStatusCode } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AdminService } from '../services/admin.service';
import { AuthService } from '../services/auth.service';

export const unauthorizedInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError(err => {
      if (err.status === HttpStatusCode.Unauthorized) {
        const isAdminRequest = req.url.includes('/api/admin');
        if (isAdminRequest) {
          inject(AdminService).logout(false);
          inject(Router).navigate(['/m-root-admin/login']);
        } else {
          inject(AuthService).logout();
          inject(Router).navigate(['/auth/login']);
        }
      }
      return throwError(() => err);
    })
  );
