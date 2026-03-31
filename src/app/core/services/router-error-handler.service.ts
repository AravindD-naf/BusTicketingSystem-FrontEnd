import { Injectable, inject } from '@angular/core';
import { Router, NavigationError, NavigationCancel, NavigationStart, Event, NavigationEnd } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class RouterErrorHandlerService {
  private router = inject(Router);

  constructor() {
    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationError) {
        if (event.error?.name === 'NoMatch') {
          setTimeout(() => this.router.navigate(['/']).catch(() => {}), 0);
        }
      } else if (event instanceof NavigationCancel) {
        const guarded = ['/seat-selection', '/booking-review', '/payment', '/booking-confirmation', '/my-bookings'];
        if (guarded.some(p => event.url.includes(p))) {
          setTimeout(() => {
            this.router.navigate(['/auth'], {
              queryParams: { tab: 'login', returnUrl: event.url }
            }).catch(() => {});
          }, 0);
        }
      }
    });
  }
}
