import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Navbar } from '../../components/navbar/navbar';
import { Footer } from '../../components/footer/footer';
import { BookingService } from '../../core/services/booking.service';
import { SeatService } from '../../core/services/seat.service';
import { HttpErrorHandlerService } from '../../core/services/http-error-handler.service';

@Component({
  selector: 'app-booking-review',
  standalone: true,
  imports: [CommonModule, Navbar, Footer],
  templateUrl: './booking-review.html',
  styleUrl: './booking-review.css'
})
export class BookingReview implements OnInit {
  private router         = inject(Router);
  private route          = inject(ActivatedRoute);
  private bookingService = inject(BookingService);
  private errHandler     = inject(HttpErrorHandlerService);
  seatService            = inject(SeatService);

  bookingId     = signal<number>(0);
  loading       = signal(true);
  booking       = signal<any>(null);
  error         = signal<string | null>(null);

  selectedSeats = this.seatService.selectedSeats;
  totalFare     = this.seatService.totalFare;
  taxAmount     = this.seatService.taxAmount;
  convFee       = this.seatService.convenienceFee;
  grandTotal    = this.seatService.totalAmount;

  ngOnInit() {
    const id = this.route.snapshot.params['bookingId'];
    if (!id || isNaN(+id)) {
      this.error.set('Invalid booking ID.');
      this.loading.set(false);
      return;
    }
    this.bookingId.set(+id);
    this.loadBooking();
  }

  loadBooking() {
    this.loading.set(true);
    this.error.set(null);
    this.bookingService.getBookingById(this.bookingId()).subscribe({
      next: (r: any) => {
        this.booking.set(r?.data ?? r);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(this.errHandler.getErrorMessage(err));
        this.loading.set(false);
      }
    });
  }

  proceedToPayment() {
    this.router.navigate(['/payment', this.bookingId()]);
  }

  goBack() {
    // Read the stored seat context
    const raw = sessionStorage.getItem('seat_context');

    if (raw) {
      const ctx = JSON.parse(raw);

      // Mark that we are returning — seat-selection will preserve locked seats
      sessionStorage.setItem('returning_from_review', String(ctx.scheduleId));

      this.router.navigate(['/seat-selection', ctx.scheduleId], {
        queryParams: {
          from:       ctx.from,
          to:         ctx.to,
          date:       ctx.date,
          passengers: ctx.passengers
        }
      });
    } else {
      // Fallback — try to get scheduleId from booking object
      const scheduleId = this.booking()?.scheduleId;
      if (scheduleId) {
        sessionStorage.setItem('returning_from_review', String(scheduleId));
        this.router.navigate(['/seat-selection', scheduleId]);
      } else {
        // Last resort — go to home
        this.router.navigate(['/']);
      }
    }
  }
}
