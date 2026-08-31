import { HttpInterceptorFn, HttpStatusCode } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

// Catches 401 responses — token expired or invalid — and forces re-login.
export const unauthorizedInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError(err => {
      if (err.status === HttpStatusCode.Unauthorized) {
        inject(AuthService).logout();
        inject(Router).navigate(['/auth/login']);
      }
      return throwError(() => err);
    })
  );
