import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface WalletTransaction {
  transactionId: number;
  type: 'Credit' | 'Debit';
  amount: number;
  balanceAfter: number;
  description: string;
  referenceId?: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class WalletService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private readonly API = environment.apiBase;

  balance      = signal<number>(0);
  transactions = signal<WalletTransaction[]>([]);

  /** Load wallet from backend — call on app init and after any wallet operation */
  loadWallet() {
    if (!this.auth.isAuthenticated()) return;
    this.http.get<any>(`${this.API}/wallet`).pipe(
      catchError(() => of(null))
    ).subscribe(r => {
      if (r?.data) {
        this.balance.set(r.data.balance ?? 0);
        this.transactions.set(r.data.transactions ?? []);
      }
    });
  }

  /** Top up wallet — calls POST /api/v1/wallet/topup */
  topUp(amount: number, paymentMethod: string) {
    return this.http.post<any>(`${this.API}/wallet/topup`, { amount, paymentMethod }).pipe(
      tap(r => { if (r?.data) this.balance.set(r.data.balance); })
    );
  }

  /** Debit wallet — calls POST /api/v1/wallet/debit */
  debitFromApi(amount: number, description: string, referenceId?: string) {
    return this.http.post<any>(`${this.API}/wallet/debit`, { amount, description, referenceId }).pipe(
      tap(r => { if (r?.data) this.balance.set(r.data.balance); })
    );
  }

  /** Credit wallet — calls POST /api/v1/wallet/credit */
  creditToApi(amount: number, description: string, referenceId?: string) {
    return this.http.post<any>(`${this.API}/wallet/credit`, { amount, description, referenceId }).pipe(
      tap(r => { if (r?.data) this.balance.set(r.data.balance); })
    );
  }

  hasSufficientBalance(amount: number): boolean {
    return this.balance() >= amount;
  }

  // ── Synchronous helpers used by payment.ts / my-bookings.ts ──
  // These update the local signal immediately for instant UI feedback,
  // then the actual API call is made by the caller.

  /** Optimistically deduct from local balance — returns false if insufficient */
  debit(amount: number, description: string): boolean {
    if (this.balance() < amount) return false;
    this.balance.update(b => b - amount);
    return true;
  }

  /** Optimistically add to local balance */
  credit(amount: number, description: string) {
    this.balance.update(b => b + amount);
  }

  /** Called when a refund is credited after booking cancellation */
  creditRefund(refundAmount: number, bookingId: number) {
    this.creditToApi(
      refundAmount,
      `Refund for Booking #${bookingId}`,
      String(bookingId)
    ).subscribe();
  }
}
