import { ApplicationConfig, ErrorHandler, APP_INITIALIZER } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { RouterErrorHandlerService } from './core/services/router-error-handler.service';
import { AuthService } from './core/services/auth.service';
import { routes } from './app.routes';

class GlobalErrorHandler implements ErrorHandler { 
  // Silently ignores router navigation errors (NoMatch, navigation issues) and Logs all other errors as real application errors

  handleError(error: Error | any): void {
    if (error?.name === 'NoMatch' ||
        error?.message?.includes('NoMatch') ||
        error?.message?.includes('navigation') ||
        error?.message?.includes('Navigation')) {
      console.debug('Navigation error (handled):', error?.message);
      return;
    }
    console.error('Application error:', error);
  }
}

function initializeRouterErrorHandler(service: RouterErrorHandlerService) {
  return () => { console.debug('Router error handler initialized'); };
}

// Runs BEFORE any route guard so guards see the correct user role
function initializeAuth(auth: AuthService) {
  return () => auth.initializeFromStorage();
}

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    RouterErrorHandlerService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeRouterErrorHandler,
      deps: [RouterErrorHandlerService],
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAuth,
      deps: [AuthService],
      multi: true
    },
    // provideRouter(routes),
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
    provideHttpClient(withInterceptors([authInterceptor]))
  ]
};
