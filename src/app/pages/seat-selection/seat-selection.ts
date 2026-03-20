import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormArray, Validators } from '@angular/forms';
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

    const user = this.authService.user();
    if (user?.email) {
      this.passengerForm.patchValue({ contactEmail: user.email });
    }

    this.loadBoardingPoints();
    this.loadDropPoints();
    this.seatService.clearSelection();
    this.fetchSeats();
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

  toggleSeat(seat: any) {
    if (!seat || seat.seatStatus !== 'Available') return;

    const alreadySelected = this.seatService.isSelectedByNumber(seat.seatNumber);

    if (alreadySelected) {
      // DESELECT — remove from seat service and remove passenger form
      this.seatService.toggleBackendSeat(seat, 0);
      const idx = this.passengersArray.controls.findIndex(
        c => c.get('seatNumber')?.value === seat.seatNumber
      );
      if (idx >= 0) this.passengersArray.removeAt(idx);
      return;
    }

    // SELECTING — check limit BEFORE adding anything
    if (this.selectedSeats().length >= this.MAX_SEATS) {
      alert(`Cannot book more than ${this.MAX_SEATS} seats in a single booking.`);
      return;
    }

    // Guard against duplicate passenger form for same seat
    const alreadyHasForm = this.passengersArray.controls.some(
      c => c.get('seatNumber')?.value === seat.seatNumber
    );
    if (alreadyHasForm) return;

    // Add to seat service
    const price = this.busInfo()?.baseFare || 0;
    this.seatService.toggleBackendSeat(seat, price);

    // Add passenger form
    const user = this.authService.user();
    const isFirst = this.passengersArray.length === 0;
    this.passengersArray.push(this.fb.group({
      seatNumber: [seat.seatNumber],
      name:   [isFirst ? (user?.name || '') : '', Validators.required],
      age:    ['', [Validators.required, Validators.min(1), Validators.max(120)]],
      gender: ['', Validators.required],
    }));
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

  onProceed() {
    if (this.selectedSeats().length === 0) {
      alert('Please select at least one seat.');
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
      next: () => {
        this.bookingService.createBooking({
          scheduleId: this.scheduleId(),
          seatNumbers
        }).subscribe({
          next: (resp: any) => {
            this.booking.set(false);
            if (resp?.success && resp?.data?.bookingId) {
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