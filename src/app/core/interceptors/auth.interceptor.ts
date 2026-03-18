import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.token;

  // Attach bearer token to all non-auth requests
  const isAuthCall = req.url.includes('/auth/register') || req.url.includes('/auth/login');
  const cloned = (!token || isAuthCall)
    ? req
    : req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });

  return next(cloned).pipe(
    catchError((error: HttpErrorResponse) => {
      // Only auto-logout on 401 if we actually had a token (real expiry/invalid token)
      // This prevents a bad API call from logging out an otherwise valid session
      if (error.status === 401 && token) {
        auth.logout(false);
        router.navigate(['/auth'], { queryParams: { tab: 'login' } }).catch(() => {});
      }
      return throwError(() => error);
    })
  );
};
