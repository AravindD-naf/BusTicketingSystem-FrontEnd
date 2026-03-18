import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated() && auth.user()?.role === 'Admin') {
    return true;
  }
  return router.createUrlTree(['/auth'], {
    queryParams: { tab: 'login', redirectUrl: state.url }
  });
};
