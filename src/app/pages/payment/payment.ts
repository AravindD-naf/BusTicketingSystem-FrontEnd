import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Navbar } from '../../components/navbar/navbar';
import { Footer } from '../../components/footer/footer';
import { BookingService } from '../../core/services/booking.service';
import { PaymentService } from '../../core/services/payment.service';
import { SeatService } from '../../core/services/seat.service';
import { HttpErrorHandlerService } from '../../core/services/http-error-handler.service';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Navbar, Footer],
  templateUrl: './payment.html',
  styleUrl: './payment.css'
})
export class Payment implements OnInit {
  private router         = inject(Router);
  private route          = inject(ActivatedRoute);
  private fb             = inject(FormBuilder);
  private bookingService = inject(BookingService);
  private paymentService = inject(PaymentService);
  private errHandler     = inject(HttpErrorHandlerService);
  seatService            = inject(SeatService);

  bookingId    = signal<number>(0);
  loading      = signal(true);
  processing   = signal(false);
  booking      = signal<any>(null);
  error        = signal<string | null>(null);

  totalFare    = this.seatService.totalFare;
  taxAmount    = this.seatService.taxAmount;
  convFee      = this.seatService.convenienceFee;
  grandTotal   = this.seatService.totalAmount;
  selectedSeatCount = computed(() => this.seatService.selectedSeats().length);

  paymentForm: FormGroup = this.fb.group({
    paymentMethod: ['UPI', Validators.required]
  });

  paymentMethods = [
    { value: 'UPI',        label: 'UPI',                  icon: '📱' },
    { value: 'CreditCard', label: 'Credit / Debit Card',  icon: '💳' },
    { value: 'NetBanking', label: 'Net Banking',           icon: '🏦' },
    { value: 'Wallet',     label: 'Digital Wallet',        icon: '👛' }
  ];

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

  processPayment() {
    if (this.paymentForm.invalid) return;
    this.processing.set(true);
    this.error.set(null);

    // Use booking totalAmount or fall back to seatService computed total
    const amount = this.booking()?.totalAmount ?? this.grandTotal();

    this.paymentService.initiatePayment({
      bookingId: this.bookingId(),
      amount,
      paymentMethod: this.paymentForm.value.paymentMethod
    }).subscribe({
      next: (initiateResp: any) => {
        if (!initiateResp?.success) {
          this.processing.set(false);
          this.error.set(initiateResp?.message || 'Payment initiation failed.');
          return;
        }
        const paymentId = initiateResp.data?.paymentId;
        this.paymentService.confirmPayment({
          paymentId,
          transactionId: `TXN_${Date.now()}`,
          isSuccess: true,
          failureReason: ''
        }).subscribe({
          next: (confirmResp: any) => {
            this.processing.set(false);
            if (confirmResp?.success) {
              this.router.navigate(['/booking-confirmation', this.bookingId()]);
            } else {
              this.error.set(confirmResp?.message || 'Payment confirmation failed.');
            }
          },
          error: (err) => {
            this.processing.set(false);
            this.error.set(this.errHandler.getErrorMessage(err));
          }
        });
      },
      error: (err) => {
        this.processing.set(false);
        this.error.set(this.errHandler.getErrorMessage(err));
      }
    });
  }

  goBack() {
    this.router.navigate(['/booking-review', this.bookingId()]);
  }
}
