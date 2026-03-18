import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { authInterceptor } from './app/core/interceptors/auth.interceptor';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

// Handle unhandled promise rejections globally
window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
  // Ignore NoMatch errors from router - these are handled at component level
  if (event.reason?.name === 'NoMatch' || 
      event.reason?.message?.includes('NoMatch') ||
      event.reason?.message?.includes('navigation')) {
    console.debug('Navigation promise rejection (handled):', event.reason?.message);
    // Prevent the unhandled rejection warning
    event.preventDefault();
    return;
  }
  
  console.error('Unhandled promise rejection:', event.reason);
});

bootstrapApplication(App, appConfig)
  .catch((err) => console.error('Bootstrap error:', err));

provideHttpClient(withInterceptors([authInterceptor]))
