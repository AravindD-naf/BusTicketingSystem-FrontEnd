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

  // Base fare — prefer booking data from backend; fall back to SeatService signal
  // (SeatService is only populated when coming directly from seat selection)
  seatFare = computed(() => {
    const fromBooking = this.booking()?.totalAmount;
    if (fromBooking && fromBooking > 0) return fromBooking;
    return this.seatService.totalFare();
  });

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
    const method      = this.paymentForm.value.paymentMethod;
    const promoCode   = this.promoApplied()?.code;

    // BusMate Wallet — direct debit, no Razorpay
    if (method === 'BusMateWallet') {
      this.walletService.debitFromApi(
        finalAmount,
        `Payment for Booking #${this.bookingId()}`,
        String(this.bookingId())
      ).subscribe({
        next: () => this.proceedWithPayment(finalAmount, 'Wallet', promoCode),
        error: (err) => {
          this.processing.set(false);
          this.error.set(this.errHandler.getErrorMessage(err));
        }
      });
      return;
    }

    // All other methods — open Razorpay checkout
    this.openRazorpay(finalAmount, method, promoCode);
  }

  // Lazy-load Razorpay script only when needed — avoids 200+ network requests on every page
  private loadRazorpayScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) { resolve(); return; }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Razorpay'));
      document.body.appendChild(script);
    });
  }

  private openRazorpay(finalAmount: number, method: string, promoCode?: string) {
    // Load Razorpay script on demand, then create order
    this.loadRazorpayScript().then(() => {
      this.paymentService.createRazorpayOrder(this.bookingId(), finalAmount).subscribe({
      next: (resp: any) => {
        if (!resp?.success) {
          this.processing.set(false);
          const msg = resp?.message || 'Could not create payment order.';
          // Detect unconfigured keys
          if (msg.includes('not configured') || msg.includes('Authentication failed')) {
            this.error.set('Payment gateway not configured. Please add Razorpay test keys to appsettings.json.');
          } else {
            this.error.set(msg);
          }
          return;
        }

        const { orderId, keyId, amount, currency } = resp.data;
        const user = this.booking();

        const options: RazorpayOptions = {
          key:         keyId,
          amount:      amount,
          currency:    currency,
          name:        'BusMate',
          description: `Booking #${this.bookingId()}`,
          order_id:    orderId,
          prefill: {
            name:  user?.passengerName ?? '',
            email: user?.contactEmail  ?? ''
          },
          theme: { color: '#0A1F44' },
          handler: (response: RazorpaySuccessResponse) => {
            // Single call: verify signature + record + confirm booking
            this.paymentService.verifyAndConfirmRazorpay(
              this.bookingId(),
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature,
              method,
              promoCode
            ).subscribe({
              next: (confirmResp: any) => {
                this.processing.set(false);
                if (confirmResp?.success) {
                  this.walletService.loadWallet();
                  this.router.navigate(['/booking-confirmation', this.bookingId()]);
                } else {
                  this.error.set(confirmResp?.message || 'Payment confirmation failed.');
                }
              },
              error: () => {
                this.processing.set(false);
                this.error.set('Payment confirmation error. Please contact support.');
              }
            });
          },
          modal: {
            ondismiss: () => {
              this.processing.set(false);
              this.error.set('Payment cancelled. You can try again.');
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      },
      error: (err: unknown) => {
        this.processing.set(false);
        this.error.set(this.errHandler.getErrorMessage(err));
      }
    });
    }).catch(() => {
      this.processing.set(false);
      this.error.set('Could not load payment gateway. Please try again.');
    });
  }

  goBack() {
    this.router.navigate(['/booking-review', this.bookingId()]);
  }

  private proceedWithPayment(finalAmount: number, method: string, promoCode?: string, transactionId?: string) {
    this.paymentService.initiatePayment({
      bookingId: this.bookingId(),
      amount: finalAmount,
      paymentMethod: method === 'BusMateWallet' ? 'Wallet' : method,
      promoCode
    }).subscribe({
      next: (initiateResp: any) => {
        if (!initiateResp?.success) {
          if (method === 'BusMateWallet') this.walletService.creditToApi(finalAmount, 'Refund - Payment initiation failed', String(this.bookingId())).subscribe();
          this.processing.set(false);
          this.error.set(initiateResp?.message || 'Payment initiation failed.');
          return;
        }
        const paymentId = initiateResp.data?.paymentId;
        this.paymentService.confirmPayment({
          paymentId,
          transactionId: transactionId ?? `TXN_${Date.now()}`,
          isSuccess: true,
          failureReason: ''
        }).subscribe({
          next: (confirmResp: any) => {
            this.processing.set(false);
            if (confirmResp?.success) {
              this.walletService.loadWallet();
              this.router.navigate(['/booking-confirmation', this.bookingId()]);
            } else {
              if (method === 'BusMateWallet') this.walletService.creditToApi(finalAmount, 'Refund - Payment failed', String(this.bookingId())).subscribe();
              this.error.set(confirmResp?.message || 'Payment confirmation failed.');
            }
          },
          error: (err) => {
            if (method === 'BusMateWallet') this.walletService.creditToApi(finalAmount, 'Refund - Payment error', String(this.bookingId())).subscribe();
            this.processing.set(false);
            this.error.set(this.errHandler.getErrorMessage(err));
          }
        });
      },
      error: (err) => {
        if (method === 'BusMateWallet') this.walletService.creditToApi(finalAmount, 'Refund - Payment error', String(this.bookingId())).subscribe();
        this.processing.set(false);
        this.error.set(this.errHandler.getErrorMessage(err));
      }
    });
  }
}
