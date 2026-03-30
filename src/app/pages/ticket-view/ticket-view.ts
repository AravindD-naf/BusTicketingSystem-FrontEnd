import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { BookingService } from '../../core/services/booking.service';
import { HttpErrorHandlerService } from '../../core/services/http-error-handler.service';

@Component({
  selector: 'app-ticket-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ticket-view.html',
  styleUrl: './ticket-view.css'
})
export class TicketView implements OnInit {
  private route          = inject(ActivatedRoute);
  private router         = inject(Router);
  private bookingService = inject(BookingService);
  private errHandler     = inject(HttpErrorHandlerService);

  loading = signal(true);
  error   = signal<string | null>(null);
  booking = signal<any>(null);

  readonly convenienceFee = 20;
  baseFare       = computed(() => this.booking()?.totalAmount ?? 0);
  discountAmount = computed(() => this.booking()?.discountAmount ?? 0);
  discountedFare = computed(() => Math.max(0, this.baseFare() - this.discountAmount()));
  taxAmount      = computed(() => Math.round(this.discountedFare() * 0.06));
  grandTotal     = computed(() => this.discountedFare() + this.taxAmount() + this.convenienceFee);
  promoPercent   = computed(() => {
    const b = this.baseFare(), d = this.discountAmount();
    return b && d ? Math.round((d / b) * 100) : 0;
  });

  ngOnInit() {
    const id = this.route.snapshot.params['bookingId'];
    if (!id || isNaN(+id)) { this.error.set('Invalid booking.'); this.loading.set(false); return; }
    this.bookingService.getBookingById(+id).subscribe({
      next: (r: any) => { this.booking.set(r?.data ?? r); this.loading.set(false); },
      error: (err) => { this.error.set(this.errHandler.getErrorMessage(err)); this.loading.set(false); }
    });
  }

  formatDate(d: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  print() { window.print(); }
  goBack() { this.router.navigate(['/my-bookings']); }
}
