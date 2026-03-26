import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BookingService } from '../../core/services/booking.service';
import { HttpErrorHandlerService } from '../../core/services/http-error-handler.service';
import { Navbar } from '../../components/navbar/navbar';
import { Footer } from '../../components/footer/footer';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PaymentService } from '../../core/services/payment.service';
import { WalletService } from '../../core/services/wallet.service';

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
  private http           = inject(HttpClient);
  private paymentService = inject(PaymentService);
  private walletService = inject(WalletService);

  bookings         = signal<any[]>([]);
  loading          = signal(false);
  error            = signal<string | null>(null);
  selectedBooking  = signal<any>(null);
  cancelling       = signal<number | null>(null); // bookingId being cancelled
  ratingBookingId  = signal<number | null>(null);
  selectedRating   = signal<number>(0);
  ratingSubmitting = signal(false);
  ratingSuccess    = signal(false);

  ngOnInit() { this.loadBookings(); }

  loadBookings() {
    this.loading.set(true);
    this.error.set(null);
    this.bookingService.getUserBookings().subscribe({
      next: (r: any) => {
        let items: any[] = [];
        if (Array.isArray(r?.data))        items = r.data;
        else if (Array.isArray(r?.data?.data)) items = r.data.data;
        else if (Array.isArray(r))         items = r;
        this.bookings.set(items);
        this.loading.set(false);       
      },
      error: (err) => {
        this.error.set(this.errHandler.getErrorMessage(err));
        this.loading.set(false);
      }
    });
  }

  // ── Continue Payment ──
  // Navigates to the payment page for a Pending booking.
  // The payment page already handles Pending bookings correctly.
  continuePayment(bookingId: number) {
    this.router.navigate(['/payment', bookingId]);
  }

  // ── Cancel Booking ──
  cancelBooking(bookingId: number) {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    this.cancelling.set(bookingId);
    const booking = this.bookings().find(b => b.bookingId === bookingId);
    this.bookingService.cancelBooking(bookingId).subscribe({
      next: () => {
        this.cancelling.set(null);
        // Credit refund to wallet if booking was Confirmed (had a payment)
        if (booking?.bookingStatus?.toLowerCase() === 'confirmed' && booking?.totalAmount > 0) {
          this.walletService.loadWallet();
          this.walletService.creditRefund(booking.totalAmount, bookingId);
          alert(`Your booking has been cancelled. ₹${booking.totalAmount} refund has been credited to your BusMate Wallet.`);
        }
        this.loadBookings();
      },
      error: (err) => {
        this.cancelling.set(null);
        alert(this.errHandler.getErrorMessage(err));
      }
    });
  }

  // ── Rating ──
  openRating(bookingId: number) {
    this.ratingBookingId.set(bookingId);
    this.selectedRating.set(0);
    this.ratingSuccess.set(false);
  }

  closeRating() { this.ratingBookingId.set(null); }

  submitRating() {
    if (this.selectedRating() === 0) { alert('Please select a star rating.'); return; }
    this.ratingSubmitting.set(true);
    this.http.post<any>(
      `${environment.apiBase}/booking/${this.ratingBookingId()}/rate`,
      { rating: this.selectedRating() }
    ).subscribe({
      next: () => {
        this.ratingSubmitting.set(false);
        this.ratingSuccess.set(true);
        setTimeout(() => this.closeRating(), 1500);
      },
      error: (err) => {
        this.ratingSubmitting.set(false);
        alert(this.errHandler.getErrorMessage(err));
      }
    });
  }

  // ── Modal ──
  viewDetails(booking: any) { this.selectedBooking.set(booking); }
  closeModal()              { this.selectedBooking.set(null); }
  goToSearch()              { this.router.navigate(['/']); }

  // ── Status helpers ──
  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'confirmed':         return 'badge-confirmed';
      case 'pending':           return 'badge-pending';
      case 'paymentprocessing': return 'badge-pending';
      case 'expired':           return 'badge-expired';
      case 'cancelled':         return 'badge-cancelled';
      case 'paymentfailed':     return 'badge-cancelled';
      default:                  return 'badge-default';
    }
  }

  getStatusLabel(status: string): string {
    switch (status?.toLowerCase()) {
      case 'paymentprocessing': return 'Payment Processing';
      case 'paymentfailed':     return 'Payment Failed';
      default:                  return status;
    }
  }

  isPending(status: string): boolean {
    return status?.toLowerCase() === 'pending';
  }

  isConfirmed(status: string): boolean {
    return status?.toLowerCase() === 'confirmed';
  }

  isCancelling(bookingId: number): boolean {
    return this.cancelling() === bookingId;
  }

  formatDate(d: string): string {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
      });
    } catch { return d; }
  }

  readonly convenienceFee = 20;

  getTax(amount: number): number {
    return Math.round(amount * 0.06);
  }

  getGrandTotal(amount: number): number {
    return amount + this.getTax(amount) + this.convenienceFee;
  }
}