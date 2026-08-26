import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

// Functional interceptor — Angular 15+ style.
// Equivalent to Express: app.use((req, res, next) => { req.headers.Authorization = ...; next(); })
// Runs for EVERY outbound HTTP request before it leaves the browser.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).token();

  if (!token) return next(req);

  // HttpRequest is immutable — clone() creates a new instance with the added header
  return next(req.clone({
    headers: req.headers.set('Authorization', `Bearer ${token}`)
  }));
};
