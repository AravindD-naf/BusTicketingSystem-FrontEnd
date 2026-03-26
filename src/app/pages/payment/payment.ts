import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Navbar } from '../../components/navbar/navbar';
import { Footer } from '../../components/footer/footer';
import { BookingService } from '../../core/services/booking.service';
import { PaymentService } from '../../core/services/payment.service';
import { SeatService } from '../../core/services/seat.service';
import { WalletService } from '../../core/services/wallet.service';
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
  walletService          = inject(WalletService);
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

  // Wallet balance check
  walletSufficient = computed(() =>
    this.walletService.hasSufficientBalance(
      this.booking()?.totalAmount ?? this.grandTotal()
    )
  );

  paymentForm: FormGroup = this.fb.group({
    paymentMethod: ['UPI', Validators.required]
  });

  paymentMethods = computed(() => [
    { value: 'UPI',        label: 'UPI',                  icon: '📱', disabled: false },
    { value: 'CreditCard', label: 'Credit / Debit Card',  icon: '💳', disabled: false },
    { value: 'NetBanking', label: 'Net Banking',           icon: '🏦', disabled: false },
    {
      value: 'BusMateWallet',
      label: `BusMate Wallet  (₹${this.walletService.balance().toFixed(2)} available)`,
      icon: '👛',
      disabled: !this.walletSufficient()
    },
  ]);

  ngOnInit() {
    this.walletService.loadWallet();
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

    const amount = this.booking()?.totalAmount ?? this.grandTotal();
    const method = this.paymentForm.value.paymentMethod;

    // Wallet payment — deduct locally first, then confirm with backend
    if (method === 'BusMateWallet') {
      const deducted = this.walletService.debit(
        amount,
        `Payment for Booking #${this.bookingId()}`
      );
      if (!deducted) {
        this.processing.set(false);
        this.error.set('Insufficient wallet balance. Please add money or choose another payment method.');
        return;
      }
    }

    this.paymentService.initiatePayment({
      bookingId: this.bookingId(),
      amount,
      paymentMethod: method === 'BusMateWallet' ? 'Wallet' : method
    }).subscribe({
      next: (initiateResp: any) => {
        if (!initiateResp?.success) {
          // Refund wallet deduction if initiation failed
          if (method === 'BusMateWallet') {
            this.walletService.credit(amount, `Refund - Payment initiation failed`);
          }
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
              // Refund wallet deduction if confirmation failed
              if (method === 'BusMateWallet') {
                this.walletService.credit(amount, `Refund - Payment confirmation failed`);
              }
              this.error.set(confirmResp?.message || 'Payment confirmation failed.');
            }
          },
          error: (err) => {
            // Refund wallet deduction on error
            if (method === 'BusMateWallet') {
              this.walletService.credit(amount, `Refund - Payment error`);
            }
            this.processing.set(false);
            this.error.set(this.errHandler.getErrorMessage(err));
          }
        });
      },
      error: (err) => {
        if (method === 'BusMateWallet') {
          this.walletService.credit(amount, `Refund - Payment error`);
        }
        this.processing.set(false);
        this.error.set(this.errHandler.getErrorMessage(err));
      }
    });
  }

  goBack() {
    this.router.navigate(['/booking-review', this.bookingId()]);
  }
}