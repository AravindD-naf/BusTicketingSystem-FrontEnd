import { Injectable, signal, computed, inject } from '@angular/core';
import { AuthService } from './auth.service';

export interface WalletTransaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  date: string;
}

@Injectable({ providedIn: 'root' })
export class WalletService {
  private auth = inject(AuthService);

  private get storageKey(): string {
    const userId = this.auth.user()?.id || 'guest';
    return `busmate_wallet_${userId}`;
  }

  private get txKey(): string {
    const userId = this.auth.user()?.id || 'guest';
    return `busmate_wallet_tx_${userId}`;
  }

  // Reactive balance signal
  balance = signal<number>(0);

  // Reactive transactions signal
  transactions = signal<WalletTransaction[]>([]);

  // Load from localStorage
  loadWallet() {
    const raw = localStorage.getItem(this.storageKey);
    this.balance.set(raw ? parseFloat(raw) : 0);

    const txRaw = localStorage.getItem(this.txKey);
    this.transactions.set(txRaw ? JSON.parse(txRaw) : []);
  }

  private saveBalance(amount: number) {
    localStorage.setItem(this.storageKey, amount.toFixed(2));
    this.balance.set(amount);
  }

  private saveTransaction(tx: WalletTransaction) {
    const existing = this.transactions();
    const updated = [tx, ...existing].slice(0, 50); // keep last 50
    localStorage.setItem(this.txKey, JSON.stringify(updated));
    this.transactions.set(updated);
  }

  // Add money (top-up or refund credit)
  credit(amount: number, description: string) {
    const newBalance = this.balance() + amount;
    this.saveBalance(newBalance);
    this.saveTransaction({
      id: `tx_${Date.now()}`,
      type: 'credit',
      amount,
      description,
      date: new Date().toISOString()
    });
    return newBalance;
  }

  // Deduct money (payment)
  debit(amount: number, description: string): boolean {
    if (this.balance() < amount) return false;
    const newBalance = this.balance() - amount;
    this.saveBalance(newBalance);
    this.saveTransaction({
      id: `tx_${Date.now()}`,
      type: 'debit',
      amount,
      description,
      date: new Date().toISOString()
    });
    return true;
  }

  hasSufficientBalance(amount: number): boolean {
    return this.balance() >= amount;
  }

  // Called when refund is approved in my-bookings
  creditRefund(refundAmount: number, bookingId: number) {
    this.credit(refundAmount, `Refund for Booking #${bookingId}`);
  }
}