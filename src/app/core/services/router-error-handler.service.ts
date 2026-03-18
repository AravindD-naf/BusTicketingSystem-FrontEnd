import { Injectable, inject } from '@angular/core';
import { Router, NavigationError, NavigationCancel, NavigationStart, Event, NavigationEnd } from '@angular/router';

/**
 * Router Error Handler Service
 * Catches and suppresses unhandled navigation errors from the router
 * Handles redirects when guards block navigation
 * This prevents "Paused on promise rejection" errors in the debugger
 */
@Injectable({ providedIn: 'root' })
export class RouterErrorHandlerService {
  private router = inject(Router);
  private navigationInProgress = false;
  private lastCancelledUrl: string | null = null;

  constructor() {
    this.initializeRouterErrorHandling();
  }

  /**
   * Initialize router event listeners to catch and suppress navigation errors
   */
  private initializeRouterErrorHandling(): void {
    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationStart) {
        this.navigationInProgress = true;
      } else if (event instanceof NavigationEnd) {
        this.navigationInProgress = false;
        this.lastCancelledUrl = null;
      } else if (event instanceof NavigationError) {
        // Suppress navigation errors - they are expected when guards redirect
        console.debug('Navigation error caught and suppressed:', {
          id: event.id,
          url: event.url,
          error: event.error?.message || event.error
        });
        this.navigationInProgress = false;
        this.handleNavigationError(event);
      } else if (event instanceof NavigationCancel) {
        // Navigation was cancelled - this is normal when guards redirect
        console.debug('Navigation cancelled (expected when guard redirects):', {
          id: event.id,
          url: event.url,
          reason: event.reason
        });
        this.navigationInProgress = false;
        this.lastCancelledUrl = event.url;
        this.handleNavigationCancel(event);
      }
    });
  }

  /**
   * Handle navigation cancellations (e.g., when guard returns false)
   */
  private handleNavigationCancel(event: NavigationCancel): void {
    // Check if this was cancelled due to auth guard, and navigate to login
    if (event.url.includes('/seat-selection') || 
        event.url.includes('/booking-review') ||
        event.url.includes('/payment') ||
        event.url.includes('/booking-confirmation') ||
        event.url.includes('/my-bookings')) {
      
      console.debug('Navigation was blocked by auth guard, redirecting to login');
      
      // Use setTimeout to avoid ExpressionChangedAfterCheckError
      setTimeout(() => {
        this.router.navigate(['/auth'], { 
          queryParams: { tab: 'login', returnUrl: event.url }
        }).catch(err => {
          console.error('Failed to navigate to login after guard rejection:', err);
        });
      }, 0);
    }
  }

  /**
   * Handle navigation errors
   */
  private handleNavigationError(event: NavigationError): void {
    // Check for specific error types
    if (event.error?.name === 'NoMatch') {
      console.debug('Route not found:', event.url);
      // Optionally redirect to home
      setTimeout(() => {
        this.router.navigate(['/'], { skipLocationChange: false })
          .catch(err => console.error('Failed to navigate to home:', err));
      }, 0);
    }
  }

  /**
   * Check if navigation is currently in progress
   */
  isNavigationInProgress(): boolean {
    return this.navigationInProgress;
  }
}

