import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

/** Shape returned by the backend seat layout API */
export interface BackendSeat {
  seatId: number;
  seatNumber: string;
  seatStatus: string;   // 'Available' | 'Locked' | 'Booked'
  lockedByUserId?: number;
  lockedAt?: string;
  lockedExpiresAt?: string;
}

export interface BackendSeatLayout {
  scheduleId: number;
  busId: number;
  busNumber: string;
  baseFare: number;
  totalSeats: number;
  availableSeats: number;
  lockedSeats: number;
  bookedSeats: number;
  seats: BackendSeat[];
}

export interface SeatApiResponse {
  success: boolean;
  message: string;
  data: BackendSeatLayout;
}

/** Shape used by the legacy seat-layout component (old frontend model) */
interface LegacySeat {
  seatId: string;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class SeatService {
  private http = inject(HttpClient);
  private readonly API = environment.apiBase;

  /** Raw API response */
  seatLayout = signal<SeatApiResponse | null>(null);

  /** Seats selected in the booking flow — stored by seatNumber */
  selectedSeats = signal<{ seatNumber: string; price: number }[]>([]);

  /* ── Computed pricing ── */
  totalFare   = computed(() => this.selectedSeats().reduce((s, x) => s + x.price, 0));
  taxAmount   = computed(() => Math.round(this.totalFare() * 0.06));
  convenienceFee = 20;
  totalAmount = computed(() => this.totalFare() + this.taxAmount() + this.convenienceFee);

  availableCount = computed(() => {
    const seats = this.seatLayout()?.data?.seats;
    if (!seats) return 0;
    return seats.filter(s => s.seatStatus === 'Available').length;
  });

  /* ── API calls ── */

  /** POST /api/v1/booking/seats/{scheduleId} */
  loadSeats(scheduleId: number) {
    return this.http
      .post<SeatApiResponse>(`${this.API}/booking/seats/${scheduleId}`, {})
      .pipe(tap(data => this.seatLayout.set(data)));
  }

  /** POST /api/v1/booking/seats/lock */
  lockSeats(scheduleId: number, seatNumbers: string[]) {
    return this.http.post<any>(`${this.API}/booking/seats/lock`, { scheduleId, seatNumbers });
  }

  /** POST /api/v1/booking/seats/release */
  releaseSeats(scheduleId: number, seatNumbers: string[]) {
    return this.http.post<any>(`${this.API}/booking/seats/release`, { scheduleId, seatNumbers });
  }

  /* ── Selection helpers (work with BackendSeat) ── */

  toggleBackendSeat(seat: BackendSeat, pricePerSeat = 0): void {
    if (seat.seatStatus !== 'Available') return;
    const idx = this.selectedSeats().findIndex(s => s.seatNumber === seat.seatNumber);
    if (idx >= 0) {
      this.selectedSeats.update(seats => seats.filter(s => s.seatNumber !== seat.seatNumber));
    } else {
      if (this.selectedSeats().length >= 6) return;
      this.selectedSeats.update(seats => [...seats, { seatNumber: seat.seatNumber, price: pricePerSeat }]);
    }
  }

  isSelectedByNumber(seatNumber: string): boolean {
    return this.selectedSeats().some(s => s.seatNumber === seatNumber);
  }

  getBackendSeatColor(seat: BackendSeat): string {
    if (seat.seatStatus === 'Booked')  return '#c9d5e8';
    if (seat.seatStatus === 'Locked')  return '#f59e0b';
    if (this.isSelectedByNumber(seat.seatNumber)) return '#0A1F44';
    return '#22a855';
  }

  /* ── Legacy helpers — keep for seat-layout.html which uses old Seat model ── */

  /**
   * isSelected — accepts either the old Seat model (seatId) or a seatNumber string.
   * Called by seat-layout.html via seatService.isSelected(seat.seatId).
   */
  isSelected(seatIdOrNumber: string): boolean {
    // Try matching against seatNumber first; fall back to legacy seatId field
    return this.selectedSeats().some(
      s => s.seatNumber === seatIdOrNumber || s.seatNumber === seatIdOrNumber
    );
  }

  /**
   * getSeatColor — accepts both the old Seat model shape and the new BackendSeat shape.
   * Called by seat-layout.html: seatService.getSeatColor(seat)
   */
  getSeatColor(seat: LegacySeat | BackendSeat | any): string {
    // Determine status — handle both field names
    const status: string = (seat as BackendSeat).seatStatus ?? (seat as LegacySeat).status ?? '';
    // Determine id — handle both field names
    const id: string =
      (seat as BackendSeat).seatNumber ??
      String((seat as LegacySeat).seatId ?? '');

    if (status === 'Booked' || status === 'booked') return '#c9d5e8';
    if (status === 'Locked')  return '#f59e0b';
    if (this.isSelected(id))  return '#0A1F44';
    if ((seat as any).gender === 'F') return '#ec4899';
    return '#22a855';
  }

  clearSelection(): void { this.selectedSeats.set([]); }
}
