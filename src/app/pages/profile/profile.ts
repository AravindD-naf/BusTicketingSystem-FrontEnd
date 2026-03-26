import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { BookingService } from '../../core/services/booking.service';
import { WalletService } from '../../core/services/wallet.service';
import { Navbar } from '../../components/navbar/navbar';
import { Footer } from '../../components/footer/footer';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, Navbar, Footer],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {
  auth               = inject(AuthService);
  walletService      = inject(WalletService);
  private bookingSvc = inject(BookingService);
  private router     = inject(Router);
  private fb         = inject(FormBuilder);

  bookings    = signal<any[]>([]);
  totalCount  = signal<number>(0);
  loading     = signal(true);

  // Wallet UI state
  showAddMoney     = signal(false);
  addMoneyLoading  = signal(false);
  addMoneySuccess  = signal(false);
  addMoneyError    = signal<string | null>(null);
  showTransactions = signal(false);

  addMoneyForm = this.fb.group({
    amount:        [null as number | null, [Validators.required, Validators.min(1), Validators.max(50000)]],
    paymentMethod: ['UPI', Validators.required]
  });

  topupMethods = [
    { value: 'UPI',       label: 'UPI',         icon: 'upi' },
    { value: 'RuPay',     label: 'RuPay',       icon: 'rupay' },
    { value: 'VISA',      label: 'VISA',        icon: 'visa' },
    { value: 'Mastercard',label: 'Mastercard',  icon: 'mastercard' },
    { value: 'Diners',    label: 'Diners Club', icon: 'diners' },
  ];

  totalBookings  = computed(() => this.totalCount() || this.bookings().length);

  upcomingCount = computed(() =>
    this.bookings().filter(b => {
      const status = (b.bookingStatus || '').toLowerCase();
      if (status === 'cancelled' || status === 'expired' || status === 'paymentfailed') return false;
      if (!b.travelDate) return false;
      return new Date(b.travelDate) >= new Date(new Date().toDateString());
    }).length
  );

  completedCount = computed(() =>
    this.bookings().filter(b => {
      const status = (b.bookingStatus || '').toLowerCase();
      if (status === 'cancelled' || status === 'expired' || status === 'paymentfailed') return false;
      if (!b.travelDate) return false;
      return new Date(b.travelDate) < new Date(new Date().toDateString());
    }).length
  );

  recentBookings = computed(() => this.bookings().slice(0, 5));

  joinYear = computed(() => {
    const oldest = this.bookings()
      .map(b => b.bookingDate ? new Date(b.bookingDate) : null)
      .filter(Boolean)
      .sort((a: any, b: any) => a - b)[0];
    return oldest ? (oldest as Date).getFullYear() : new Date().getFullYear();
  });

  ngOnInit() {
    this.walletService.loadWallet();
    this.bookingSvc.getUserBookings(1, 200).subscribe({
      next: (r: any) => {
        let items: any[] = [];
        if (Array.isArray(r?.data))            items = r.data;
        else if (Array.isArray(r?.data?.data)) items = r.data.data;
        else if (Array.isArray(r))             items = r;
        this.bookings.set(items);
        // Use totalCount from response if available (includes all bookings regardless of IsDeleted)
        if (r?.totalCount != null) this.totalCount.set(r.totalCount);
        else this.totalCount.set(items.length);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  openAddMoney() {
    this.showAddMoney.set(true);
    this.addMoneySuccess.set(false);
    this.addMoneyError.set(null);
    this.addMoneyForm.reset({ amount: null, paymentMethod: 'UPI' });
  }

  closeAddMoney() {
    this.showAddMoney.set(false);
  }

  submitAddMoney() {
    if (this.addMoneyForm.invalid) {
      this.addMoneyForm.markAllAsTouched();
      return;
    }
    const amount = Number(this.addMoneyForm.value.amount);
    this.addMoneyLoading.set(true);
    this.addMoneyError.set(null);

    // Simulate payment gateway delay
    setTimeout(() => {
      this.walletService.credit(amount, `Added via ${this.addMoneyForm.value.paymentMethod}`);
      this.addMoneyLoading.set(false);
      this.addMoneySuccess.set(true);
      setTimeout(() => this.closeAddMoney(), 1800);
    }, 1200);
  }

  toggleTransactions() {
    this.showTransactions.update(v => !v);
  }

  getInitials(): string {
    const user = this.auth.user();
    if (!user) return '?';
    const name = user.name || user.email || '';
    const parts = name.split(/[\s@.]+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return (parts[0]?.[0] || '?').toUpperCase();
  }

  formatDate(d: string): string {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return d; }
  }

  formatTxDate(d: string): string {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return d; }
  }

  readonly convenienceFee = 20;

  getTax(amount: number): number {
    return Math.round(amount * 0.06);
  }

  getGrandTotal(amount: number): number {
    return amount + this.getTax(amount) + this.convenienceFee;
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'confirmed': return 'status-confirmed';
      case 'pending':   return 'status-pending';
      case 'cancelled': return 'status-cancelled';
      case 'expired':   return 'status-expired';
      default:          return 'status-confirmed';
    }
  }

  logout() { this.auth.logout(true); }
}