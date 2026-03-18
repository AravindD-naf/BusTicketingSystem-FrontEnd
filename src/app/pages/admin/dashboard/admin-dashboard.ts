import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BusSearchService } from '../../../core/services/bus-search.service';
import { BookingService } from '../../../core/services/booking.service';
import { RouteService } from '../../../core/services/route.service';
import { SourceService } from '../../../core/services/source.service';
import { DestinationService } from '../../../core/services/destination.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div>
      <h2 class="page-heading">Dashboard Overview</h2>

      <div class="stats-grid">
        <div class="stat-card blue">
          <div class="stat-icon">🚌</div>
          <div>
            <p class="stat-num">{{ stats().buses }}</p>
            <p class="stat-lbl">Total Buses</p>
          </div>
          <a routerLink="/admin/buses" class="stat-link">View →</a>
        </div>
        <div class="stat-card green">
          <div class="stat-icon">🗺️</div>
          <div>
            <p class="stat-num">{{ stats().routes }}</p>
            <p class="stat-lbl">Routes</p>
          </div>
          <a routerLink="/admin/routes" class="stat-link">View →</a>
        </div>
        <div class="stat-card purple">
          <div class="stat-icon">🕐</div>
          <div>
            <p class="stat-num">{{ stats().schedules }}</p>
            <p class="stat-lbl">Schedules</p>
          </div>
          <a routerLink="/admin/schedules" class="stat-link">View →</a>
        </div>
        <div class="stat-card orange">
          <div class="stat-icon">🎫</div>
          <div>
            <p class="stat-num">{{ stats().bookings }}</p>
            <p class="stat-lbl">Bookings</p>
          </div>
          <a routerLink="/admin/bookings" class="stat-link">View →</a>
        </div>
        <div class="stat-card teal">
          <div class="stat-icon">📍</div>
          <div>
            <p class="stat-num">{{ stats().sources }}</p>
            <p class="stat-lbl">Sources</p>
          </div>
          <a routerLink="/admin/sources" class="stat-link">View →</a>
        </div>
        <div class="stat-card red">
          <div class="stat-icon">🏁</div>
          <div>
            <p class="stat-num">{{ stats().destinations }}</p>
            <p class="stat-lbl">Destinations</p>
          </div>
          <a routerLink="/admin/destinations" class="stat-link">View →</a>
        </div>
      </div>

      <h3 class="section-heading">Quick Actions</h3>
      <div class="actions-grid">
        <a routerLink="/admin/buses" class="action-btn">➕ Add New Bus</a>
        <a routerLink="/admin/routes" class="action-btn">➕ Add New Route</a>
        <a routerLink="/admin/schedules" class="action-btn">➕ Add Schedule</a>
        <a routerLink="/admin/sources" class="action-btn">➕ Add Source</a>
        <a routerLink="/admin/destinations" class="action-btn">➕ Add Destination</a>
        <a routerLink="/admin/audit-logs" class="action-btn">📋 View Audit Logs</a>
      </div>

      <div *ngIf="loading()" class="info-box">Loading statistics...</div>
      <div *ngIf="error()" class="error-box">{{ error() }}</div>
    </div>
  `,
  styles: [`
    .page-heading{font-size:1.4rem;font-weight:700;color:#0A1F44;margin:0 0 20px}
    .stats-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px;margin-bottom:32px}
    .stat-card{background:#fff;border-radius:12px;padding:20px;display:flex;align-items:center;gap:14px;box-shadow:0 1px 4px rgba(0,0,0,.06);position:relative;border-left:4px solid transparent}
    .stat-card.blue{border-color:#3b82f6} .stat-card.green{border-color:#22c55e}
    .stat-card.purple{border-color:#a855f7} .stat-card.orange{border-color:#f97316}
    .stat-card.teal{border-color:#14b8a6} .stat-card.red{border-color:#ef4444}
    .stat-icon{font-size:1.8rem}
    .stat-num{font-size:1.6rem;font-weight:700;color:#0A1F44;margin:0}
    .stat-lbl{font-size:.78rem;color:#64748b;margin:2px 0 0}
    .stat-link{position:absolute;bottom:10px;right:14px;font-size:.75rem;color:#3b82f6;text-decoration:none;font-weight:500}
    .section-heading{font-size:1rem;font-weight:600;color:#374151;margin:0 0 12px}
    .actions-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px;margin-bottom:24px}
    .action-btn{display:block;background:#fff;border:1.5px solid #e2e8f0;border-radius:10px;padding:14px 16px;text-align:center;text-decoration:none;color:#0A1F44;font-size:.875rem;font-weight:500;transition:all .2s}
    .action-btn:hover{border-color:#3b82f6;background:#eff6ff;color:#1d4ed8}
    .info-box{padding:12px 16px;background:#eff6ff;border-radius:8px;color:#1d4ed8;font-size:.875rem}
    .error-box{padding:12px 16px;background:#fee2e2;border-radius:8px;color:#dc2626;font-size:.875rem}
  `]
})
export class AdminDashboard implements OnInit {
  private busService = inject(BusSearchService);
  private bookingService = inject(BookingService);
  private routeService = inject(RouteService);
  private sourceService = inject(SourceService);
  private destinationService = inject(DestinationService);

  stats = signal({ buses: 0, routes: 0, schedules: 0, bookings: 0, sources: 0, destinations: 0 });
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit() {
    const count = (r: any) => Array.isArray(r.data) ? r.data.length : (r.data?.items?.length ?? r.data?.data?.length ?? 0);

    this.busService.getAllBuses(1, 200).subscribe({
      // next: r => this.stats.update(s => ({ ...s, buses: Array.isArray(r.data) ? r.data.length : 0 })),
      next: r => this.stats.update(s => ({ ...s, buses: Array.isArray(r.data) ? r.data.length : (r.data?.items?.length ?? 0) })),
      error: () => {}
    });
    this.busService.getAllSchedules(1, 200).subscribe({
      // next: r => { this.stats.update(s => ({ ...s, schedules: Array.isArray(r.data) ? r.data.length : 0 })); this.loading.set(false); },
      next: r => { this.stats.update(s => ({ ...s, schedules: Array.isArray(r.data) ? r.data.length : (r.data?.items?.length ?? 0) })); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
    this.bookingService.getAllBookings(1, 200).subscribe({
      // next: (r: any) => this.stats.update(s => ({ ...s, bookings: Array.isArray(r.data) ? r.data.length : 0 })),
      next: (r: any) => this.stats.update(s => ({ ...s, bookings: Array.isArray(r.data) ? r.data.length : (r.data?.items?.length ?? 0) })),
      error: () => {}
    });
    this.routeService.getAllRoutes(1, 200).subscribe({
      next: r => this.stats.update(s => ({ ...s, routes: count(r) })),
      error: () => {}
    });
    this.sourceService.getAllSources(1, 200).subscribe({
      next: r => this.stats.update(s => ({ ...s, sources: count(r) })),
      error: () => {}
    });
    this.destinationService.getAllDestinations(1, 200).subscribe({
      next: r => this.stats.update(s => ({ ...s, destinations: count(r) })),
      error: () => {}
    });
  }
}
