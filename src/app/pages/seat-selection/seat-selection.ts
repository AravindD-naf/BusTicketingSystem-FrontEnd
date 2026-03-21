import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormArray, Validators, FormGroup } from '@angular/forms';
import { SeatService } from '../../core/services/seat.service';
import { BookingService } from '../../core/services/booking.service';
import { AuthService } from '../../core/services/auth.service';
import { HttpErrorHandlerService } from '../../core/services/http-error-handler.service';
import { SourceService } from '../../core/services/source.service';
import { DestinationService } from '../../core/services/destination.service';
import { Navbar } from '../../components/navbar/navbar';
import { Footer } from '../../components/footer/footer';

@Component({
  selector: 'app-seat-selection',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Navbar, Footer],
  templateUrl: './seat-selection.html',
  styleUrl: './seat-selection.css'
})
export class SeatSelection implements OnInit {
  private route          = inject(ActivatedRoute);
  private router         = inject(Router);
  private fb             = inject(FormBuilder);
  private errHandler     = inject(HttpErrorHandlerService);
  private authService    = inject(AuthService);
  seatService            = inject(SeatService);
  private bookingService = inject(BookingService);
  private sourceService  = inject(SourceService);
  private destService    = inject(DestinationService);

  scheduleId    = signal<number>(0);
  loading       = signal(true);
  error         = signal<string | null>(null);
  booking       = signal(false);
  from          = signal<string>('');
  to            = signal<string>('');
  date          = signal<string>('');
  requiredSeats = signal<number>(1);

  // Boarding & drop signals
  sources          = signal<any[]>([]);
  destinations     = signal<any[]>([]);
  boardingLoaded   = signal(false);
  dropLoaded       = signal(false);
  selectedBoarding = signal<any>(null);
  selectedDrop     = signal<any>(null);

  seats         = computed(() => this.seatService.seatLayout()?.data?.seats ?? []);
  busInfo       = computed(() => this.seatService.seatLayout()?.data);
  selectedSeats = this.seatService.selectedSeats;
  totalFare     = this.seatService.totalFare;
  taxAmount     = this.seatService.taxAmount;
  totalAmount   = this.seatService.totalAmount;

  // Lock expiry countdown
  lockExpiresAt = signal<Date | null>(null);
  lockCountdown = signal<string>('');
  lockExpired   = signal(false);

  private refreshInterval: any = null;
  private countdownInterval: any = null;

  // 4 seats per row with aisle gap: [s, s, null, s, s]
  seatRows = computed(() => {
    const all = this.seats();
    const rows: any[][] = [];
    for (let i = 0; i < all.length; i += 4) {
      rows.push([
        all[i]   ?? null,
        all[i+1] ?? null,
        null,
        all[i+2] ?? null,
        all[i+3] ?? null,
      ]);
    }
    return rows;
  });

  passengerForm = this.fb.group({
    passengers:   this.fb.array([]),
    contactPhone: ['', [Validators.required]],
    contactEmail: ['', [Validators.required, Validators.email]],
  });

  get passengersArray(): FormArray {
    return this.passengerForm.get('passengers') as FormArray;
  }

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
    this.requiredSeats.set(Math.max(1, +qp['passengers'] || 1));

    const user = this.authService.user();
    if (user?.email) {
      this.passengerForm.patchValue({ contactEmail: user.email });
    }

    this.loadBoardingPoints();
    this.loadDropPoints();
    this.seatService.clearSelection();
    this.fetchSeats();

    // Auto-refresh seat layout every 30 seconds to pick up lock expirations
    this.refreshInterval = setInterval(() => {
      this.silentRefreshSeats();
    }, 30000);
  }

  // Calls GET /api/v1/sources/by-city/{fromCity}
  // Backend filters server-side: only returns sources whose name STARTS WITH fromCity
  // e.g. from="Erode" → ["Erode Bus Terminus", "Erode Highway", "Erode Salem Toll"]
  // If none found → sources stays [] → HTML shows "No Boarding Point exists for Erode"
  loadBoardingPoints() {
    const fromCity = this.from().trim();
    if (!fromCity) {
      this.boardingLoaded.set(true);
      return;
    }
    this.sourceService.getByCity(fromCity).subscribe({
      next: (r: any) => {
        const data: any[] = Array.isArray(r.data) ? r.data : [];
        this.sources.set(data);
        if (data.length > 0) this.selectedBoarding.set(data[0]);
        this.boardingLoaded.set(true);
      },
      error: () => {
        this.sources.set([]);
        this.boardingLoaded.set(true);
      }
    });
  }

  // Calls GET /api/v1/destinations/by-city/{toCity}
  // Backend filters server-side: only returns destinations whose name STARTS WITH toCity
  // e.g. to="Hydrabad" → ["Hydrabad MGBS", "Hydrabad Jubilee Bus Stand"]
  // If none found → destinations stays [] → HTML shows "No Drop Point exists for Hydrabad"
  loadDropPoints() {
    const toCity = this.to().trim();
    if (!toCity) {
      this.dropLoaded.set(true);
      return;
    }
    this.destService.getByCity(toCity).subscribe({
      next: (r: any) => {
        const data: any[] = Array.isArray(r.data) ? r.data : [];
        this.destinations.set(data);
        if (data.length > 0) this.selectedDrop.set(data[0]);
        this.dropLoaded.set(true);
      },
      error: () => {
        this.destinations.set([]);
        this.dropLoaded.set(true);
      }
    });
  }

  ngOnDestroy() {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
    if (this.countdownInterval) clearInterval(this.countdownInterval);
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

  onBoardingChange(event: Event) {
    const id = Number((event.target as HTMLSelectElement).value);
    const found = this.sources().find((s: any) => s.sourceId === id);
    if (found) this.selectedBoarding.set(found);
  }

  onDropChange(event: Event) {
    const id = Number((event.target as HTMLSelectElement).value);
    const found = this.destinations().find((d: any) => d.destinationId === id);
    if (found) this.selectedDrop.set(found);
  }

  readonly MAX_SEATS = 6;

  // Silent refresh — no loading spinner, just updates the seat data
  silentRefreshSeats() {
    this.seatService.loadSeats(this.scheduleId()).subscribe({
      next: () => {
        // If lock has expired on the backend, clear selections that are no longer locked
        if (this.lockExpired()) {
          this.seatService.clearSelection();
          this.passengersArray.clear();
          this.stopCountdown();
        }
      },
      error: () => {} // silently ignore refresh errors
    });
  }

  toggleSeat(seat: any) {
    if (!seat || seat.seatStatus !== 'Available') return;

    const wasSelected = this.seatService.isSelectedByNumber(seat.seatNumber);
    const price = this.busInfo()?.baseFare || 0;

    // If trying to add but already at required count — show warning
    if (!wasSelected && this.selectedSeats().length >= this.requiredSeats()) {
      alert(`You selected ${this.requiredSeats()} passenger(s). Please deselect a seat before choosing another.`);
      return;
    }

    this.seatService.toggleBackendSeat(seat, price);

    if (wasSelected) {
      const idx = this.passengersArray.controls.findIndex(
        c => c.get('seatNumber')?.value === seat.seatNumber
      );
      if (idx >= 0) this.passengersArray.removeAt(idx);
    } else {
      const user = this.authService.user();
      const isFirst = this.passengersArray.length === 0;
      this.passengersArray.push(this.fb.group({
        seatNumber: [seat.seatNumber],
        name:   [isFirst ? (user?.name || '') : '', Validators.required],
        age:    ['', [Validators.required, Validators.min(1), Validators.max(120)]],
        gender: ['', Validators.required],
      }));
    }
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

  // Start the 5-minute countdown after seats are locked
  private startLockCountdown(expiresAt: Date) {
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    this.lockExpiresAt.set(expiresAt);
    this.lockExpired.set(false);

    this.countdownInterval = setInterval(() => {
      const now = new Date();
      const diff = expiresAt.getTime() - now.getTime();

      if (diff <= 0) {
        this.lockCountdown.set('00:00');
        this.lockExpired.set(true);
        clearInterval(this.countdownInterval);
        this.countdownInterval = null;
        // Clear selections since lock has expired
        this.seatService.clearSelection();
        this.passengersArray.clear();
        this.lockExpiresAt.set(null);
        // Refresh seat layout to show updated statuses
        this.silentRefreshSeats();
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        this.lockCountdown.set(
          `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
        );
      }
    }, 1000);
  }

  private stopCountdown() {
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    this.countdownInterval = null;
    this.lockExpiresAt.set(null);
    this.lockCountdown.set('');
    this.lockExpired.set(false);
  }

  onProceed() {
    const required = this.requiredSeats();
    const selected = this.selectedSeats().length;

    if (selected === 0) {
      alert(`Please select ${required} seat(s) for your ${required} passenger(s).`);
      return;
    }

    if (selected < required) {
      alert(`You have selected ${required} passenger(s) but only ${selected} seat(s). Please select ${required - selected} more seat(s).`);
      return;
    }
    
    if (this.passengerForm.invalid) {
      this.passengerForm.markAllAsTouched();
      alert('Please fill in all passenger details and contact information.');
      return;
    }
    this.booking.set(true);
    const seatNumbers = this.selectedSeats().map(s => s.seatNumber);

    this.seatService.lockSeats(this.scheduleId(), seatNumbers).subscribe({
      next: (lockResp: any) => {
        // Start 5-minute countdown from the lock expiry time
        const expiresAt = lockResp?.data?.lockExpiresAt
          ? new Date(lockResp.data.lockExpiresAt)
          : new Date(Date.now() + 5 * 60 * 1000);
        this.startLockCountdown(expiresAt);

        this.bookingService.createBooking({
          scheduleId: this.scheduleId(),
          seatNumbers
        }).subscribe({
          next: (resp: any) => {
            this.booking.set(false);
            if (resp?.success && resp?.data?.bookingId) {
              this.stopCountdown(); // booking created — no need for countdown
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