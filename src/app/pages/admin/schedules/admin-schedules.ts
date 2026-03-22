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

      <div class="search-bar">
        <input class="search-input" placeholder="Search by route, bus number or operator..." (input)="onSearch($event)" />
      </div>

      <div *ngIf="loading()" class="info-box">Loading schedules...</div>
      <div *ngIf="error()" class="error-box">{{ error() }}</div>

      <div class="table-wrap" *ngIf="!loading()">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width:52px;text-align:center;">#</th>
              <th>Route</th>
              <th>Bus</th>
              <th>Travel Date</th>
              <th>Departure</th>
              <th>Arrival</th>
              <th>Avail. Seats</th>
              <th>Fare (₹)</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let s of schedules(); let i = index">
              <td style="width:52px;text-align:center;color:#94a3b8;font-size:.8rem;">{{ rangeStart() + i }}</td>
              <td>{{ s.source || s.routeId }} → {{ s.destination }}</td>
              <td>{{ s.busNumber }} – {{ s.operatorName }}</td>
              <td>{{ s.travelDate | date:'mediumDate' }}</td>
              <td>{{ s.departureTime }}</td>
              <td>{{ s.arrivalTime }}<span *ngIf="s.isOvernightArrival" class="overnight-badge">+1</span></td>
              <td><span class="avail-badge">{{ s.availableSeats }}</span></td>
              <td>₹{{ s.baseFare }}</td>
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

      <!-- Results summary — OUTSIDE table-wrap -->
      <div class="results-summary" *ngIf="!loading() && totalCount() > 0">
        Showing {{ rangeStart() }}–{{ rangeEnd() }} of <strong>{{ totalCount() }}</strong> schedules
      </div>

      <!-- Pagination — OUTSIDE table-wrap -->
      <div class="pagination-bar" *ngIf="totalPages() > 1">
        <button class="page-btn" (click)="goToPage(1)" [disabled]="currentPage() === 1">«</button>
        <button class="page-btn" (click)="prevPage()" [disabled]="currentPage() === 1">← Prev</button>
        <div class="page-numbers">
          <button
            *ngFor="let p of visiblePages()"
            class="page-num"
            [class.active]="p === currentPage()"
            [class.ellipsis]="p === -1"
            [disabled]="p === -1"
            (click)="p !== -1 && goToPage(p)">
            {{ p === -1 ? '...' : p }}
          </button>
        </div>
        <button class="page-btn" (click)="nextPage()" [disabled]="currentPage() === totalPages()">Next →</button>
        <button class="page-btn" (click)="goToPage(totalPages())" [disabled]="currentPage() === totalPages()">»</button>
        <span class="page-info">Page {{ currentPage() }} of {{ totalPages() }}</span>
      </div>

      <!-- Modal -->
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
              <label class="form-label">Arrival Time *
                <input class="form-input" type="time" formControlName="arrivalTime" />
                <span class="auto-hint">
                  Auto-filled from route duration — you can override this for express/slow services
                </span>
                <span class="field-error" *ngIf="scheduleForm.get('arrivalTime')?.invalid && scheduleForm.get('arrivalTime')?.touched">Required</span>
              </label>
            </div>
            <div class="duration-preview" *ngIf="scheduleForm.get('departureTime')?.value && scheduleForm.get('arrivalTime')?.value">
              🕐 Duration: <strong>{{ getFormDuration() }}</strong>
              <span *ngIf="routeDurationHint()" class="duration-hint-note">
                (Route default: {{ routeDurationHint() }})
              </span>
            </div>
            <label class="form-label">Fare per Seat (₹) *
              <input class="form-input" type="number" formControlName="fare" placeholder="e.g. 500" min="0" />
              <span class="auto-hint">Set 0 to use the route's default base fare</span>
              <span class="field-error" *ngIf="scheduleForm.get('fare')?.invalid && scheduleForm.get('fare')?.touched">Must be 0 or more</span>
            </label>
            <div class="modal-actions">
              <button type="button" class="btn-secondary" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn-primary" [disabled]="saving()">
                {{ saving() ? 'Saving...' : (editingId() ? 'Update' : 'Add Schedule') }}
              </button>
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
    .overnight-badge{background:#fef3c7;color:#d97706;font-size:.7rem;font-weight:700;padding:1px 5px;border-radius:4px;margin-left:5px}
    .info-box{padding:12px 16px;background:#eff6ff;border-radius:8px;color:#1d4ed8;font-size:.875rem;margin-bottom:16px}
    .error-box{padding:12px 16px;background:#fee2e2;border-radius:8px;color:#dc2626;font-size:.875rem;margin-bottom:16px}
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
    .auto-hint{font-size:.72rem;color:#94a3b8;font-style:italic}
    .duration-hint{font-size:.78rem;color:#0A1F44;margin-top:2px}
    .modal-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:4px}
    .duration-row{display:flex;gap:10px}
    .duration-field{display:flex;align-items:center;gap:6px;flex:1}
    .duration-unit{font-size:.82rem;color:#64748b;white-space:nowrap}
    .results-summary{font-size:.82rem;color:#64748b;margin:12px 0 8px;text-align:center;}
    .results-summary strong{color:#0A1F44;}
    .pagination-bar{display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:nowrap;margin-top:8px;padding:12px 0;}
    .page-btn{background:#fff;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 14px;font-size:.8rem;font-weight:600;color:#0A1F44;cursor:pointer;transition:all .18s;white-space:nowrap;}
    .page-btn:hover:not(:disabled){border-color:#3b82f6;color:#1d4ed8;}
    .page-btn:disabled{opacity:.4;cursor:not-allowed;}
    .page-numbers{display:flex;align-items:center;gap:4px;flex-shrink:0;}
    .page-num{min-width:34px;height:34px;border:1.5px solid #e2e8f0;border-radius:8px;background:#fff;font-size:.82rem;font-weight:600;color:#374151;cursor:pointer;transition:all .18s;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .page-num:hover:not(:disabled):not(.ellipsis){border-color:#3b82f6;color:#1d4ed8;}
    .page-num.active{background:#1d4ed8;border-color:#1d4ed8;color:#fff;}
    .page-num.ellipsis{border:none;background:none;cursor:default;color:#94a3b8;}
    .page-info{font-size:.8rem;color:#64748b;white-space:nowrap;flex-shrink:0;}
    .search-bar{margin-bottom:16px;}
    .search-input{width:100%;max-width:400px;border:1.5px solid #e2e8f0;border-radius:8px;padding:9px 14px;font-size:.875rem;outline:none;}
    .search-input:focus{border-color:#3b82f6;}
    .duration-preview{font-size:.8rem;color:#0A1F44;background:#f0f9ff;border:1px solid #bae6fd;border-radius:6px;padding:7px 12px;margin-top:-4px;}
    .duration-hint-note{color:#64748b;margin-left:6px;}
  `]
})
export class AdminSchedules implements OnInit {
  private busService   = inject(BusSearchService);
  private routeService = inject(RouteService);
  private fb           = inject(FormBuilder);

  schedules = signal<any[]>([]);
  searchQuery       = '';
  buses     = signal<any[]>([]);
  routes    = signal<any[]>([]);
  loading   = signal(true);
  error     = signal<string | null>(null);
  showModal = signal(false);
  saving    = signal(false);
  formError = signal<string | null>(null);
  editingId = signal<number | null>(null);
  selectedRouteDuration = signal<number | null>(null);
  routeDurationHint     = signal<string>('');

  // Pagination
  pageSize    = signal(10);
  currentPage = signal(1);
  totalCount  = signal(0);
  totalPages  = signal(0);

  arrivalTotalMinutes = 0;

  scheduleForm = this.fb.group({
    routeId:       [null, Validators.required],
    busId:         [null, Validators.required],
    travelDate:    ['', Validators.required],
    departureTime: ['', Validators.required],
    arrivalTime:   ['', Validators.required],
    fare:          [0, [Validators.required, Validators.min(0)]]
  });

  ngOnInit() {
    this.loadSchedules();
    this.busService.getAllBuses(1, 200).subscribe({
      next: r => {
        const all = Array.isArray(r.data) ? r.data : (r.data?.items ?? []);
        this.buses.set(all.filter((b: any) => b.isActive));
      }
    });
    this.routeService.getAllRoutes(1, 200).subscribe({
      next: r => this.routes.set(Array.isArray(r.data) ? r.data : (r.data?.items ?? []))
    });
  }

  loadSchedules() {
    this.loading.set(true);
    const obs$ = this.searchQuery
      ? this.busService.searchSchedules(this.searchQuery, this.currentPage(), this.pageSize())
      : this.busService.getAllSchedules(this.currentPage(), this.pageSize());

    obs$.subscribe({
      next: r => {
        const data = r.data?.items ?? (Array.isArray(r.data) ? r.data : []);
        this.schedules.set(data);
        // this.updatePagination(r.data?.totalCount ?? data.length);
        const total = typeof r.data?.totalCount === 'number' ? r.data.totalCount : data.length;
        this.updatePagination(total);
        this.loading.set(false);
      },
      error: e => { this.error.set(e?.error?.message || 'Failed to load schedules'); this.loading.set(false); }
    });
  }

  openModal() {
    this.scheduleForm.reset({ routeId: null, busId: null, travelDate: '', departureTime: '', arrivalTime: '', fare: 0 });
    this.editingId.set(null);
    this.formError.set(null);
    this.selectedRouteDuration.set(null);
    this.routeDurationHint.set('');
    this.arrivalTotalMinutes = 0;
    this.showModal.set(true);
  }

  // onSearch(event: Event) {
  //   const q = (event.target as HTMLInputElement).value.trim();
  //   this.searchQuery = q;
  //   this.currentPage.set(1);

  //   if (!q) {
  //     // Empty search — reload normal page
  //     this.loadSchedules();
  //     return;
  //   }

  //   // Search across all pages via backend
  //   this.loading.set(true);
  //   this.busService.getAllSchedules(1, 200).subscribe({
  //     next: r => {
  //       const all = r.data?.items ?? (Array.isArray(r.data) ? r.data : []);
  //       const lower = q.toLowerCase();
  //       const filtered = all.filter((s: any) =>
  //         s.source?.toLowerCase().includes(lower) ||
  //         s.destination?.toLowerCase().includes(lower) ||
  //         s.busNumber?.toLowerCase().includes(lower) ||
  //         s.operatorName?.toLowerCase().includes(lower)
  //       );
  //       this.schedules.set(filtered);
  //       this.filteredSchedules.set(filtered);
  //       this.updatePagination(filtered.length);
  //       this.loading.set(false);
  //     },
  //     error: () => this.loading.set(false)
  //   });
  // }
  onSearch(event: Event) {
    const q = (event.target as HTMLInputElement).value.trim();
    this.searchQuery = q;
    this.currentPage.set(1);
    this.loadSchedules();
  }

  editSchedule(s: any) {
    this.editingId.set(s.scheduleId);
    this.scheduleForm.patchValue({
      routeId: s.routeId, busId: s.busId,
      travelDate: s.travelDate?.split('T')[0],
      departureTime: s.departureTime?.substring(0, 5), // HH:MM only
      arrivalTime: s.arrivalTime?.substring(0, 5),
      fare: s.baseFare || 0 
    });
    const route = this.routes().find((r: any) => r.routeId === s.routeId);
    if (route) {
      const mins = route.estimatedTravelTimeMinutes;
      this.selectedRouteDuration.set(mins);
      const h = Math.floor(mins / 60), m = mins % 60;
      this.routeDurationHint.set(h > 0 ? `${h}h ${m}m` : `${m}m`);
    }
    // This ensures overnight flag is preserved correctly on save
    const depStr = s.departureTime?.substring(0, 5); // "HH:MM"
    const routeDuration = this.routes()
      .find((r: any) => r.routeId === s.routeId)?.estimatedTravelTimeMinutes;

    if (depStr && routeDuration) {
      this.calculateArrival(depStr, routeDuration);
    } else {
      // Fallback: if overnight, manually set arrivalTotalMinutes
      if (s.isOvernightArrival && s.arrivalTime) {
        const [ah, am] = s.arrivalTime.split(':').map(Number);
        const [dh, dm] = (s.departureTime || '0:0').split(':').map(Number);
        const depMins = dh * 60 + dm;
        const arrMins = ah * 60 + am;
        this.arrivalTotalMinutes = arrMins < depMins
          ? 1440 - depMins + arrMins
          : 1440 + arrMins;
      } else {
        this.arrivalTotalMinutes = 0;
      }
    }
    this.formError.set(null);
    this.showModal.set(true);
  }

  getFormDuration(): string {
    const dep = this.scheduleForm.get('departureTime')?.value as string;
    const arr = this.scheduleForm.get('arrivalTime')?.value as string;
    if (!dep || !arr) return '';
    const [dh, dm] = dep.split(':').map(Number);
    const [ah, am] = arr.split(':').map(Number);
    const depMins = dh * 60 + dm;
    let arrMins = ah * 60 + am;
    let diff = arrMins - depMins;
    if (diff <= 0) diff += 1440; // overnight
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return h > 0 ? `${h}h ${m > 0 ? m + 'm' : ''}`.trim() : `${m}m`;
  }

  closeModal() { this.showModal.set(false); this.editingId.set(null); this.arrivalTotalMinutes = 0; }

  saveSchedule() {
    if (this.scheduleForm.invalid) { this.scheduleForm.markAllAsTouched(); return; }
    this.saving.set(true);
    this.formError.set(null);
    const v = this.scheduleForm.value as any;

    const travelDateIso = v.travelDate
      ? v.travelDate + 'T00:00:00' : '';
    const departure = v.departureTime
      ? (v.departureTime.length === 5 ? v.departureTime + ':00' : v.departureTime) : '';
    const arrival = v.arrivalTime
    ? (v.arrivalTime.length === 5 ? v.arrivalTime + ':00' : v.arrivalTime) : '';

    const payload = {
        routeId: Number(v.routeId), busId: Number(v.busId),
        travelDate: travelDateIso, departureTime: departure, arrivalTime: arrival,
        fare: Number(v.fare) || 0
    };

    const id = this.editingId();
    const req$ = id
      ? this.busService.updateSchedule(id, payload)
      : this.busService.createSchedule(payload);

    req$.subscribe({
      next: () => { this.saving.set(false); this.closeModal(); this.loadSchedules(); },
      error: e => {
        this.saving.set(false);
        const err = e?.error;
        const msg = err?.message || err?.title
          || (err?.errors ? Object.values(err.errors).flat().join(', ') : null)
          || 'Save failed';
        this.formError.set(msg);
      }
    });
  }

 
  // deleteSchedule(id: number) {
  //   if (!confirm('Delete this schedule? This cannot be undone.')) return;
  //   this.busService.deleteSchedule(id).subscribe({
  //     next: () => {
  //       // If the deleted item was the only one on this page, step back one page
  //       if (this.schedules().length === 1 && this.currentPage() > 1) {
  //         this.currentPage.update(p => p - 1);
  //       }
  //       this.loadSchedules();
  //     },
  //     error: e => alert(e?.error?.message || 'Delete failed')
  //   });
  // }
  deleteSchedule(id: number) {
    if (!confirm('Delete this schedule? This cannot be undone.')) return;

    this.busService.deleteSchedule(id).subscribe({
      next: () => {
        // ✅ Decrease total count locally
        this.totalCount.update(c => Math.max(0, c - 1));

        // ✅ Fix page when last item of page is deleted
        if (this.schedules().length === 1 && this.currentPage() > 1) {
          this.currentPage.update(p => p - 1);
        }

        this.loadSchedules();
      },
      error: e => alert(e?.error?.message || 'Delete failed')
    });
  }

  // Pagination methods
  updatePagination(total: number) {
    this.totalCount.set(total);
    this.totalPages.set(Math.ceil(total / this.pageSize()));
  }
  rangeStart() { return (this.currentPage() - 1) * this.pageSize() + 1; }
  rangeEnd()   { return Math.min(this.currentPage() * this.pageSize(), this.totalCount()); }
  goToPage(page: number) {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadSchedules();
  }
  nextPage() { this.goToPage(this.currentPage() + 1); }
  prevPage() { this.goToPage(this.currentPage() - 1); }
  visiblePages(): number[] {
    const total = this.totalPages(), current = this.currentPage();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: number[] = [1];
    if (current > 4) pages.push(-1);
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
    if (current < total - 3) pages.push(-1);
    pages.push(total);
    return pages;
  }

  onRouteChange(event: Event) {
    const routeId = Number((event.target as HTMLSelectElement).value);
    const route = this.routes().find((r: any) => r.routeId === routeId);
    if (route) {
      const mins = route.estimatedTravelTimeMinutes;
      this.selectedRouteDuration.set(mins);
      const h = Math.floor(mins / 60), m = mins % 60;
      this.routeDurationHint.set(h > 0 ? `${h}h ${m}m` : `${m}m`);
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
    const displayH = Math.floor(totalArrMins / 60) % 24;
    const displayM = totalArrMins % 60;
    const displayStr = `${String(displayH).padStart(2, '0')}:${String(displayM).padStart(2, '0')}`;
    this.arrivalTotalMinutes = totalArrMins;
    this.scheduleForm.patchValue({ arrivalTime: displayStr });
  }
}