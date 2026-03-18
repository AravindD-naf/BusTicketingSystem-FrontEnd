import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BookingService } from '../../core/services/booking.service';
import { HttpErrorHandlerService } from '../../core/services/http-error-handler.service';
import { Navbar } from '../../components/navbar/navbar';
import { Footer } from '../../components/footer/footer';

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [CommonModule, Navbar, Footer],
  templateUrl: './my-bookings.html',
  styleUrls: ['./my-bookings.css']
})
export class MyBookings implements OnInit {
  private bookingService = inject(BookingService);
  private router         = inject(Router);
  private errHandler     = inject(HttpErrorHandlerService);

  bookings        = signal<any[]>([]);
  loading         = signal(false);
  error           = signal<string | null>(null);
  selectedBooking = signal<any>(null);

  ngOnInit() { this.loadBookings(); }

  loadBookings() {
    this.loading.set(true);
    this.error.set(null);
    this.bookingService.getUserBookings().subscribe({
      next: (r: any) => {
        // Handle various API response shapes
        let items: any[] = [];
        if (Array.isArray(r?.data)) {
          items = r.data;
        } else if (Array.isArray(r?.data?.data)) {
          items = r.data.data;
        } else if (Array.isArray(r)) {
          items = r;
        }
        this.bookings.set(items);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(this.errHandler.getErrorMessage(err));
        this.loading.set(false);
      }
    });
  }

  cancelBooking(bookingId: number) {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    this.bookingService.cancelBooking(bookingId).subscribe({
      next: () => {
        this.loadBookings();
      },
      error: (err) => {
        alert(this.errHandler.getErrorMessage(err));
      }
    });
  }

  viewDetails(booking: any) { this.selectedBooking.set(booking); }
  closeModal() { this.selectedBooking.set(null); }
  goToSearch() { this.router.navigate(['/']); }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'confirmed': return 'badge-confirmed';
      case 'cancelled': return 'badge-cancelled';
      case 'pending':   return 'badge-pending';
      default:          return 'badge-default';
    }
  }

  formatDate(d: string): string {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return d;
    }
  }
}
