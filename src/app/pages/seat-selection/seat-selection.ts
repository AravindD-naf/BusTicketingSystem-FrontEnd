import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SeatService } from '../../core/services/seat.service';
import { BookingService } from '../../core/services/booking.service';
import { HttpErrorHandlerService } from '../../core/services/http-error-handler.service';
import { Navbar } from '../../components/navbar/navbar';
import { Footer } from '../../components/footer/footer';

@Component({
  selector: 'app-seat-selection',
  standalone: true,
  imports: [CommonModule, Navbar, Footer],
  templateUrl: './seat-selection.html',
  styleUrl: './seat-selection.css'
})
export class SeatSelection implements OnInit {
  private route          = inject(ActivatedRoute);
  private router         = inject(Router);
  private errHandler     = inject(HttpErrorHandlerService);
  seatService            = inject(SeatService);
  private bookingService = inject(BookingService);

  scheduleId    = signal<number>(0);
  loading       = signal(true);
  error         = signal<string | null>(null);
  booking       = signal(false);
  from          = signal<string>('');
  to            = signal<string>('');
  date          = signal<string>('');

  seats         = computed(() => this.seatService.seatLayout()?.data?.seats ?? []);
  busInfo       = computed(() => this.seatService.seatLayout()?.data);
  selectedSeats = this.seatService.selectedSeats;
  totalFare     = this.seatService.totalFare;
  taxAmount     = this.seatService.taxAmount;
  totalAmount   = this.seatService.totalAmount;

  ngOnInit() {
    const id = this.route.snapshot.params['scheduleId'];
    if (!id || isNaN(+id)) {
      this.error.set('Invalid schedule ID.');
      this.loading.set(false);
      return;
    }
    this.scheduleId.set(+id);
    const qp = this.route.snapshot.queryParams;
    this.from.set(qp['from'] || '');
    this.to.set(qp['to'] || '');
    this.date.set(qp['date'] || '');
    this.seatService.clearSelection();
    this.fetchSeats();
  }

  fetchSeats() {
    this.loading.set(true);
    this.error.set(null);
    this.seatService.loadSeats(this.scheduleId()).subscribe({
      next: () => this.loading.set(false),
      error: (err) => {
        this.error.set(this.errHandler.getErrorMessage(err));
        this.loading.set(false);
      }
    });
  }

  toggleSeat(seat: any) {
  const price = this.busInfo()?.baseFare || 0;
  this.seatService.toggleBackendSeat(seat, price);
}

  isSelected(seatNumber: string): boolean {
    return this.seatService.isSelectedByNumber(seatNumber);
  }

  getSeatColor(seat: any): string {
    return this.seatService.getBackendSeatColor(seat);
  }

  getBusInitials(): string {
    const num = this.busInfo()?.busNumber || '';
    const words = num.trim().split(/[\s\-_]+/).filter(Boolean);
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
    return (num.substring(0, 2) || 'BU').toUpperCase();
  }

  onProceed() {
    if (this.seatService.selectedSeats().length === 0) {
      alert('Please select at least one seat.');
      return;
    }
    this.booking.set(true);
    const seatNumbers = this.seatService.selectedSeats().map(s => s.seatNumber);

    this.seatService.lockSeats(this.scheduleId(), seatNumbers).subscribe({
      next: () => {
        this.bookingService.createBooking({
          scheduleId: this.scheduleId(),
          seatNumbers
        }).subscribe({
          next: (resp: any) => {
            this.booking.set(false);
            if (resp?.success && resp?.data?.bookingId) {
              this.router.navigate(['/booking-review', resp.data.bookingId]);
            } else {
              alert(resp?.message || 'Booking failed. Please try again.');
            }
          },
          error: (err) => {
            this.booking.set(false);
            alert(this.errHandler.getErrorMessage(err));
          }
        });
      },
      error: (err) => {
        this.booking.set(false);
        alert(this.errHandler.getErrorMessage(err));
      }
    });
  }
}
