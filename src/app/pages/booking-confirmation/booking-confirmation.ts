import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Navbar } from '../../components/navbar/navbar';
import { Footer } from '../../components/footer/footer';
import { BookingService } from '../../core/services/booking.service';
import { HttpErrorHandlerService } from '../../core/services/http-error-handler.service';

@Component({
  selector: 'app-booking-confirmation',
  standalone: true,
  imports: [CommonModule, Navbar, Footer],
  templateUrl: './booking-confirmation.html',
  styleUrl: './booking-confirmation.css'
})
export class BookingConfirmation implements OnInit {
  private router         = inject(Router);
  private route          = inject(ActivatedRoute);
  private bookingService = inject(BookingService);
  private errHandler     = inject(HttpErrorHandlerService);

  bookingId = signal<number>(0);
  loading   = signal(true);
  booking   = signal<any>(null);
  error     = signal<string | null>(null);


  // Fare breakdown computed from backend totalAmount (base fare)
  readonly convenienceFee = 20;
  baseFare    = computed(() => this.booking()?.totalAmount ?? 0);
  taxAmount   = computed(() => Math.round(this.baseFare() * 0.06));
  grandTotal  = computed(() => this.baseFare() + this.taxAmount() + this.convenienceFee);

  ngOnInit() {
    const id = this.route.snapshot.params['bookingId'];
    if (!id || isNaN(+id)) {
      this.error.set('Invalid booking ID.');
      this.loading.set(false);
      return;
    }
    this.bookingId.set(+id);
    // Clean up all seat-selection session state after a successful booking
    // so a fresh search/booking flow starts completely clean
    sessionStorage.removeItem('returning_from_review');
    sessionStorage.removeItem('was_returning');
    sessionStorage.removeItem('seat_context');
    this.loadConfirmation();
    }

  loadConfirmation() {
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

  goToMyBookings() { this.router.navigate(['/my-bookings']); }
  goHome() { this.router.navigate(['/']); }
  printTicket() { window.print(); }
}
