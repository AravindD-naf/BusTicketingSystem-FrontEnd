import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { BookingService } from '../../core/services/booking.service';
import { Navbar } from '../../components/navbar/navbar';
import { Footer } from '../../components/footer/footer';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, Navbar, Footer],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {
  auth               = inject(AuthService);
  private bookingSvc = inject(BookingService);
  private router     = inject(Router);

  bookings = signal<any[]>([]);
  loading  = signal(true);

  totalBookings  = computed(() => this.bookings().length);

  upcomingCount = computed(() =>
    this.bookings().filter(b => {
      const status = (b.bookingStatus || '').toLowerCase();
      if (status === 'cancelled' || status === 'expired') return false;
      if (!b.travelDate) return false;
      return new Date(b.travelDate) >= new Date(new Date().toDateString());
    }).length
  );

  completedCount = computed(() =>
    this.bookings().filter(b => {
      const status = (b.bookingStatus || '').toLowerCase();
      if (status === 'cancelled' || status === 'expired') return false;
      if (!b.travelDate) return false;
      return new Date(b.travelDate) < new Date(new Date().toDateString());
    }).length
  );

  recentBookings = computed(() => this.bookings().slice(0, 5));

  joinYear = computed(() => {
    const oldest = this.bookings()
      .map(b => b.bookingDate ? new Date(b.bookingDate) : null)
      .filter(Boolean)
      .sort((a: any, b: any) => a - b)[0];
    return oldest ? (oldest as Date).getFullYear() : new Date().getFullYear();
  });

  ngOnInit() {
    this.bookingSvc.getUserBookings(1, 100).subscribe({
      next: (r: any) => {
        let items: any[] = [];
        if (Array.isArray(r?.data))            items = r.data;
        else if (Array.isArray(r?.data?.data)) items = r.data.data;
        else if (Array.isArray(r))             items = r;
        this.bookings.set(items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  getInitials(): string {
    const user = this.auth.user();
    if (!user) return '?';
    const name = user.name || user.email || '';
    const parts = name.split(/[\s@.]+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return (parts[0]?.[0] || '?').toUpperCase();
  }

  formatDate(d: string): string {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return d; }
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'confirmed': return 'status-confirmed';
      case 'pending':   return 'status-pending';
      case 'cancelled': return 'status-cancelled';
      case 'expired':   return 'status-expired';
      default:          return 'status-confirmed';
    }
  }

  logout() { this.auth.logout(true); }
}
