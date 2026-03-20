import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { BusSearchService } from '../../../core/services/bus-search.service';
import { RouteService } from '../../../core/services/route.service';

@Component({
  selector: 'app-admin-schedules',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div>
      <div class="page-header">
        <h2 class="page-heading">Schedule Management</h2>
        <button class="btn-primary" (click)="openModal()">➕ Add Schedule</button>
      </div>

      <div *ngIf="loading()" class="info-box">Loading schedules...</div>
      <div *ngIf="error()" class="error-box">{{ error() }}</div>

      <div class="table-wrap" *ngIf="!loading()">
        <table class="data-table">
          <thead>
            <tr><th>#</th><th>Route</th><th>Bus</th><th>Travel Date</th><th>Departure</th><th>Arrival</th><th>Avail. Seats</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let s of schedules(); let i = index">
              <td>{{ i + 1 }}</td>
              <td>{{ s.source || s.routeId }} → {{ s.destination }}</td>
              <td>{{ s.busNumber }} – {{ s.operatorName }}</td>
              <td>{{ s.travelDate | date:'mediumDate' }}</td>
              <td>{{ s.departureTime }}</td>
              <td>{{ s.arrivalTime }}<span *ngIf="s.isOvernightArrival" class="overnight-badge">+1</span></td>
              <td><span class="avail-badge">{{ s.availableSeats }}</span></td>
              <td><span class="status-chip" [class.active]="s.isActive">{{ s.isActive ? 'Active' : 'Inactive' }}</span></td>
              <td>
                <button class="btn-edit" (click)="editSchedule(s)">✏️ Edit</button>
                <button class="btn-delete" (click)="deleteSchedule(s.scheduleId)">🗑️ Delete</button>
              </td>
            </tr>
            <tr *ngIf="schedules().length === 0">
              <td colspan="9" class="empty-row">No schedules found. Add a schedule to get started.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="modal-overlay" *ngIf="showModal()" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ editingId() ? 'Edit Schedule' : 'Add New Schedule' }}</h3>
            <button class="close-btn" (click)="closeModal()">✕</button>
          </div>
          <form [formGroup]="scheduleForm" (ngSubmit)="saveSchedule()" class="modal-form">
            <label class="form-label">Route *
              <select class="form-input" formControlName="routeId" (change)="onRouteChange($event)">
                <option value="">Select route</option>
                <option *ngFor="let r of routes()" [value]="r.routeId">{{ r.source }} → {{ r.destination }}</option>
              </select>
              <span class="field-error" *ngIf="scheduleForm.get('routeId')?.invalid && scheduleForm.get('routeId')?.touched">Required</span>
              <span class="duration-hint" *ngIf="routeDurationHint()">🕐 Route duration: <strong>{{ routeDurationHint() }}</strong></span>
            </label>
            <label class="form-label">Bus *
              <select class="form-input" formControlName="busId">
                <option value="">Select bus</option>
                <option *ngFor="let b of buses()" [value]="b.busId">{{ b.busNumber }} – {{ b.operatorName }}</option>
              </select>
              <span class="field-error" *ngIf="scheduleForm.get('busId')?.invalid && scheduleForm.get('busId')?.touched">Required</span>
            </label>
            <label class="form-label">Travel Date *
              <input class="form-input" type="date" formControlName="travelDate" />
              <span class="field-error" *ngIf="scheduleForm.get('travelDate')?.invalid && scheduleForm.get('travelDate')?.touched">Required</span>
            </label>
            <div class="form-row">
              <label class="form-label">Departure Time *
                <input class="form-input" type="time" formControlName="departureTime" (change)="onDepartureChange($event)" />
                <span class="field-error" *ngIf="scheduleForm.get('departureTime')?.invalid && scheduleForm.get('departureTime')?.touched">Required</span>
              </label>
              <label class="form-label">Arrival Time
                <input class="form-input" type="time" formControlName="arrivalTime" readonly style="background:#f8fafc;cursor:not-allowed;color:#64748b" />
                <span class="auto-hint">Auto-calculated from route duration</span>
              </label>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn-secondary" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn-primary" [disabled]="saving()">{{ saving() ? 'Saving...' : (editingId() ? 'Update' : 'Add Schedule') }}</button>
            </div>
            <div *ngIf="formError()" class="error-box" style="margin-top:8px">{{ formError() }}</div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}
    .page-heading{font-size:1.4rem;font-weight:700;color:#0A1F44;margin:0}
    .btn-primary{background:#1d4ed8;color:#fff;border:none;padding:9px 18px;border-radius:8px;cursor:pointer;font-size:.875rem;font-weight:500}
    .btn-primary:disabled{opacity:.6;cursor:not-allowed}
    .btn-secondary{background:#f1f5f9;color:#374151;border:none;padding:9px 18px;border-radius:8px;cursor:pointer;font-size:.875rem}
    .btn-edit{background:#eff6ff;color:#1d4ed8;border:none;padding:5px 10px;border-radius:6px;cursor:pointer;font-size:.8rem;margin-right:6px}
    .btn-delete{background:#fee2e2;color:#dc2626;border:none;padding:5px 10px;border-radius:6px;cursor:pointer;font-size:.8rem}
    .table-wrap{background:#fff;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,.06);overflow:auto}
    .data-table{width:100%;border-collapse:collapse;font-size:.875rem}
    .data-table th{background:#f8fafc;padding:12px 16px;text-align:left;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;white-space:nowrap}
    .data-table td{padding:12px 16px;border-bottom:1px solid #f1f5f9;color:#1e293b;white-space:nowrap}
    .data-table tr:last-child td{border-bottom:none}
    .avail-badge{background:#eff6ff;color:#1d4ed8;padding:3px 8px;border-radius:4px;font-size:.75rem}
    .status-chip{padding:3px 10px;border-radius:20px;font-size:.75rem;background:#fee2e2;color:#dc2626}
    .status-chip.active{background:#dcfce7;color:#16a34a}
    .empty-row{text-align:center;color:#94a3b8;padding:32px!important}
    .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:100}
    .modal{background:#fff;border-radius:14px;padding:24px;width:480px;max-width:95vw;max-height:90vh;overflow-y:auto}
    .modal-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}
    .modal-header h3{font-size:1.1rem;font-weight:600;margin:0;color:#0A1F44}
    .close-btn{background:none;border:none;cursor:pointer;font-size:1.1rem;color:#64748b}
    .modal-form{display:flex;flex-direction:column;gap:14px}
    .form-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    .form-label{display:flex;flex-direction:column;gap:5px;font-size:.85rem;font-weight:500;color:#374151}
    .form-input{border:1.5px solid #e2e8f0;border-radius:8px;padding:9px 12px;font-size:.875rem;outline:none}
    .form-input:focus{border-color:#3b82f6}
    .field-error{color:#dc2626;font-size:.75rem}
    .modal-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:4px}
    .info-box{padding:12px 16px;background:#eff6ff;border-radius:8px;color:#1d4ed8;font-size:.875rem;margin-bottom:16px}
    .error-box{padding:12px 16px;background:#fee2e2;border-radius:8px;color:#dc2626;font-size:.875rem;margin-bottom:16px}
    .overnight-badge{background:#fef3c7;color:#d97706;font-size:.7rem;font-weight:700;padding:1px 5px;border-radius:4px;margin-left:5px}
    .duration-row{display:flex;gap:10px}
    .duration-field{display:flex;align-items:center;gap:6px;flex:1}
    .duration-unit{font-size:.82rem;color:#64748b;white-space:nowrap}
    .toggle-row{padding:10px 14px;background:#f8fafc;border-radius:10px;border:1.5px solid #e2e8f0}
    .toggle-label{display:flex;align-items:center;gap:12px;cursor:pointer;user-select:none}
    .toggle-checkbox{display:none}
    .toggle-track{width:44px;height:24px;background:#cbd5e1;border-radius:12px;position:relative;transition:background .25s;flex-shrink:0}
    .toggle-checkbox:checked ~ .toggle-track{background:#22c55e}
    .toggle-thumb{position:absolute;top:3px;left:3px;width:18px;height:18px;background:#fff;border-radius:50%;transition:transform .25s;box-shadow:0 1px 3px rgba(0,0,0,.2)}
    .toggle-checkbox:checked ~ .toggle-track .toggle-thumb{transform:translateX(20px)}
    .toggle-text{font-size:.85rem;font-weight:500;color:#374151}
  `]
})
export class AdminSchedules implements OnInit {
  private busService = inject(BusSearchService);
  private routeService = inject(RouteService);
  private fb = inject(FormBuilder);

  schedules = signal<any[]>([]);
  buses = signal<any[]>([]);
  routes = signal<any[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  showModal = signal(false);
  saving = signal(false);
  formError = signal<string | null>(null);
  editingId = signal<number | null>(null);
  selectedRouteDuration = signal<number | null>(null); // in minutes
  routeDurationHint = signal<string>('');

  arrivalTotalMinutes = 0;

  scheduleForm = this.fb.group({
    routeId: [null, Validators.required],
    busId: [null, Validators.required],
    travelDate: ['', Validators.required],
    departureTime: ['', Validators.required],
    arrivalTime: ['', Validators.required]
  });

  ngOnInit() {
    this.loadSchedules();
    // this.busService.getAllBuses(1, 200).subscribe({ next: r => this.buses.set(Array.isArray(r.data) ? r.data : (r.data?.items ?? [])) });
    this.busService.getAllBuses(1, 200).subscribe({ next: r => { const all = Array.isArray(r.data) ? r.data : (r.data?.items ?? []); this.buses.set(all.filter((b: any) => b.isActive)); } });
    this.routeService.getAllRoutes(1, 200).subscribe({ next: r => this.routes.set(Array.isArray(r.data) ? r.data : (r.data?.items ?? [])) });
  }

  loadSchedules() {
    this.loading.set(true);
    this.busService.getAllSchedules(1, 200).subscribe({
      // next: r => { this.schedules.set(Array.isArray(r.data) ? r.data : []); this.loading.set(false); },
      next: r => { this.schedules.set(Array.isArray(r.data) ? r.data : (r.data?.items ?? [])); this.loading.set(false); },

      error: e => { this.error.set(e?.error?.message || 'Failed to load schedules'); this.loading.set(false); }
    });
  }

  openModal() {
  this.scheduleForm.reset();
  this.editingId.set(null);
  this.formError.set(null);
  this.selectedRouteDuration.set(null);
  this.routeDurationHint.set('');
  this.arrivalTotalMinutes = 0;
  this.showModal.set(true);
}

  editSchedule(s: any) {
    this.editingId.set(s.scheduleId);
    this.scheduleForm.patchValue({ routeId: s.routeId, busId: s.busId, travelDate: s.travelDate?.split('T')[0], departureTime: s.departureTime, arrivalTime: s.arrivalTime });
    // Set duration hint from the route
    const route = this.routes().find((r: any) => r.routeId === s.routeId);
    if (route) {
      const mins = route.estimatedTravelTimeMinutes;
      this.selectedRouteDuration.set(mins);
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      this.routeDurationHint.set(h > 0 ? `${h}h ${m}m` : `${m}m`);
    }
    this.formError.set(null);
    this.showModal.set(true);
  }

  closeModal() { this.showModal.set(false); this.editingId.set(null); this.arrivalTotalMinutes = 0; }

  saveSchedule() {
    if (this.scheduleForm.invalid) { this.scheduleForm.markAllAsTouched(); return; }
    this.saving.set(true); this.formError.set(null);
    const v = this.scheduleForm.value as any;

    // travelDate from <input type="date"> gives "yyyy-MM-dd" → convert to ISO DateTime
    // departureTime/arrivalTime from <input type="time"> gives "HH:mm" → append ":00" for TimeSpan
    const travelDateIso = v.travelDate
      ? new Date(v.travelDate + 'T00:00:00').toISOString()
      : '';
    const departure = v.departureTime
      ? (v.departureTime.length === 5 ? v.departureTime + ':00' : v.departureTime)
      : '';
    // For arrival, use total minutes (supports overnight: e.g. 36:15:00 = next day 12:15 AM)
    let arrival: string;
    if (this.arrivalTotalMinutes > 0) {
      const totalH = Math.floor(this.arrivalTotalMinutes / 60);
      const totalM = this.arrivalTotalMinutes % 60;
      arrival = `${totalH}:${String(totalM).padStart(2, '0')}:00`;
    } else {
      arrival = v.arrivalTime
        ? (v.arrivalTime.length === 5 ? v.arrivalTime + ':00' : v.arrivalTime)
        : '';
    }

    const payload = {
      routeId: Number(v.routeId),
      busId: Number(v.busId),
      travelDate: travelDateIso,
      departureTime: departure,
      arrivalTime: arrival
    };

    const id = this.editingId();
    const req$ = id
      ? this.busService.updateSchedule(id, payload)
      : this.busService.createSchedule(payload);

    req$.subscribe({
      next: () => { this.saving.set(false); this.closeModal(); this.loadSchedules(); },
      error: (e) => {
        this.saving.set(false);
        // Handle both ASP.NET ModelState errors and custom error messages
        const err = e?.error;
        const msg = err?.message
          || err?.title
          || (err?.errors ? Object.values(err.errors).flat().join(', ') : null)
          || 'Save failed';
        this.formError.set(msg);
      }
    });
  }

  deleteSchedule(id: number) {
    if (!confirm('Delete this schedule?')) return;
    this.busService.deleteSchedule(id).subscribe({ next: () => this.loadSchedules(), error: e => alert(e?.error?.message || 'Delete failed') });
  }

  onRouteChange(event: Event) {
    const routeId = Number((event.target as HTMLSelectElement).value);
    const route = this.routes().find((r: any) => r.routeId === routeId);
    if (route) {
      const mins = route.estimatedTravelTimeMinutes;
      this.selectedRouteDuration.set(mins);
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      this.routeDurationHint.set(h > 0 ? `${h}h ${m}m` : `${m}m`);
      // Recalculate arrival if departure already set
      const dep = this.scheduleForm.get('departureTime')?.value;
      if (dep) this.calculateArrival(dep as string, mins);
    } else {
      this.selectedRouteDuration.set(null);
      this.routeDurationHint.set('');
    }
  }

  onDepartureChange(event: Event) {
    const dep = (event.target as HTMLInputElement).value;
    const mins = this.selectedRouteDuration();
    if (dep && mins) this.calculateArrival(dep, mins);
  }

  calculateArrival(departureTime: string, durationMinutes: number) {
    const [hStr, mStr] = departureTime.split(':');
    const depMins = Number(hStr) * 60 + Number(mStr);
    const totalArrMins = depMins + durationMinutes;
    // Display: wrap at 24h for the time input (shows clock time)
    const displayH = Math.floor(totalArrMins / 60) % 24;
    const displayM = totalArrMins % 60;
    const displayStr = `${String(displayH).padStart(2, '0')}:${String(displayM).padStart(2, '0')}`;
    // Store total minutes for backend (so overnight journeys send e.g. "36:15:00")
    this.arrivalTotalMinutes = totalArrMins;
    this.scheduleForm.patchValue({ arrivalTime: displayStr });
  }
}
