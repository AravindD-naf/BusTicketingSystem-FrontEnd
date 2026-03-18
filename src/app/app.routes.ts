import { Routes } from '@angular/router';
import { Landing } from './pages/landing/landing';
import { Auth } from './pages/auth/auth';
import { SearchResults } from './pages/search-results/search-results';
import { SeatSelection } from './pages/seat-selection/seat-selection';
import { BookingReview } from './pages/booking-review/booking-review';
import { Payment } from './pages/payment/payment';
import { BookingConfirmation } from './pages/booking-confirmation/booking-confirmation';
import { MyBookings } from './pages/my-bookings/my-bookings';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { AdminLayout } from './pages/admin-layout/admin-layout';
import { AdminDashboard } from './pages/admin/dashboard/admin-dashboard';
import { AdminBuses } from './pages/admin/buses/admin-buses';
import { AdminRoutes } from './pages/admin/routes/admin-routes';
import { AdminSchedules } from './pages/admin/schedules/admin-schedules';
import { AdminBookings } from './pages/admin/bookings/admin-bookings';
import { AdminSources } from './pages/admin/sources/admin-sources';
import { AdminDestinations } from './pages/admin/destinations/admin-destinations';
import { AdminAuditLogs } from './pages/admin/audit-logs/admin-audit-logs';

export const routes: Routes = [
  { path: '', component: Landing },
  { path: 'auth', component: Auth },
  { path: 'results', component: SearchResults },
  { path: 'seat-selection/:scheduleId', component: SeatSelection, canActivate: [authGuard] },
  { path: 'booking-review/:bookingId', component: BookingReview, canActivate: [authGuard] },
  { path: 'payment/:bookingId', component: Payment, canActivate: [authGuard] },
  { path: 'booking-confirmation/:bookingId', component: BookingConfirmation, canActivate: [authGuard] },
  { path: 'my-bookings', component: MyBookings, canActivate: [authGuard] },
  {
    path: 'admin',
    component: AdminLayout,
    canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboard },
      { path: 'buses', component: AdminBuses },
      { path: 'routes', component: AdminRoutes },
      { path: 'schedules', component: AdminSchedules },
      { path: 'bookings', component: AdminBookings },
      { path: 'sources', component: AdminSources },
      { path: 'destinations', component: AdminDestinations },
      { path: 'audit-logs', component: AdminAuditLogs }
    ]
  },
  { path: '**', redirectTo: '' }
];
