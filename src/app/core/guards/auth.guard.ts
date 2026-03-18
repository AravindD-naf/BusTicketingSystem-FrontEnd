import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }
  // Redirect to login, preserving intended URL
  return router.createUrlTree(['/auth'], {
    queryParams: { tab: 'login', redirectUrl: state.url }
  });
};
