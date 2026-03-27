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

  // Promo code state
  promoInput       = signal('');
  promoValidating  = signal(false);
  promoError       = signal<string | null>(null);
  promoApplied     = signal<{ code: string; discountAmount: number; discountType: string; discountValue: number; message: string } | null>(null);

  readonly convenienceFee = 20;

  // Base fare from SeatService (seat price only, no tax/fee)
  seatFare   = this.seatService.totalFare;

  // After promo discount is applied, recalculate everything
  discountAmount = computed(() => this.promoApplied()?.discountAmount ?? 0);
  discountedFare = computed(() => Math.max(0, this.seatFare() - this.discountAmount()));
  taxAmount      = computed(() => Math.round(this.discountedFare() * 0.06));
  grandTotal     = computed(() => this.discountedFare() + this.taxAmount() + this.convenienceFee);

  selectedSeatCount = computed(() => this.seatService.selectedSeats().length);

  walletSufficient = computed(() =>
    this.walletService.hasSufficientBalance(this.grandTotal())
  );

  paymentForm: FormGroup = this.fb.group({
    paymentMethod: ['UPI', Validators.required]
  });

  paymentMethods = computed(() => [
    { value: 'UPI',          label: 'UPI',                 icon: '📱', disabled: false },
    { value: 'CreditCard',   label: 'Credit / Debit Card', icon: '💳', disabled: false },
    { value: 'NetBanking',   label: 'Net Banking',          icon: '🏦', disabled: false },
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

  applyPromo() {
    const code = this.promoInput().trim();
    if (!code) { this.promoError.set('Please enter a promo code.'); return; }
    this.promoValidating.set(true);
    this.promoError.set(null);
    this.promoApplied.set(null);

    // Use seat fare (before tax/fee) as the booking amount for validation
    this.paymentService.validatePromoCode(code, this.seatFare()).subscribe({
      next: (r: any) => {
        this.promoValidating.set(false);
        const result = r?.data;
        if (result?.isValid) {
          this.promoApplied.set({
            code: result.code,
            discountAmount: result.discountAmount,
            discountType: result.discountType,
            discountValue: result.discountValue,
            message: result.message
          });
        } else {
          this.promoError.set(result?.message || 'Invalid promo code.');
        }
      },
      error: (err) => {
        this.promoValidating.set(false);
        this.promoError.set(this.errHandler.getErrorMessage(err));
      }
    });
  }

  removePromo() {
    this.promoApplied.set(null);
    this.promoInput.set('');
    this.promoError.set(null);
  }

  processPayment() {
    if (this.paymentForm.invalid) return;
    this.processing.set(true);
    this.error.set(null);

    const finalAmount = this.grandTotal();
    const method = this.paymentForm.value.paymentMethod;
    const promoCode = this.promoApplied()?.code;

    if (method === 'BusMateWallet') {
      const deducted = this.walletService.debit(finalAmount, `Payment for Booking #${this.bookingId()}`);
      if (!deducted) {
        this.processing.set(false);
        this.error.set('Insufficient wallet balance.');
        return;
      }
    }

    this.paymentService.initiatePayment({
      bookingId: this.bookingId(),
      amount: finalAmount,
      paymentMethod: method === 'BusMateWallet' ? 'Wallet' : method,
      promoCode
    }).subscribe({
      next: (initiateResp: any) => {
        if (!initiateResp?.success) {
          if (method === 'BusMateWallet') this.walletService.credit(finalAmount, 'Refund - Payment initiation failed');
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
              if (method === 'BusMateWallet') this.walletService.credit(finalAmount, 'Refund - Payment confirmation failed');
              this.error.set(confirmResp?.message || 'Payment confirmation failed.');
            }
          },
          error: (err) => {
            if (method === 'BusMateWallet') this.walletService.credit(finalAmount, 'Refund - Payment error');
            this.processing.set(false);
            this.error.set(this.errHandler.getErrorMessage(err));
          }
        });
      },
      error: (err) => {
        if (method === 'BusMateWallet') this.walletService.credit(finalAmount, 'Refund - Payment error');
        this.processing.set(false);
        this.error.set(this.errHandler.getErrorMessage(err));
      }
    });
  }

  goBack() {
    this.router.navigate(['/booking-review', this.bookingId()]);
  }
}
