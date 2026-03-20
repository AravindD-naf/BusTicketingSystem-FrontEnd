import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouteService } from '../../../core/services/route.service';

@Component({
  selector: 'app-admin-routes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div>
      <div class="page-header">
        <h2 class="page-heading">Route Management</h2>
        <button class="btn-primary" (click)="openModal()">➕ Add Route</button>
      </div>

      <div class="search-bar">
        <input class="search-input" placeholder="Search by source or destination..." (input)="onSearch($event)" />
      </div>

      <div *ngIf="loading()" class="info-box">Loading routes...</div>
      <div *ngIf="error()" class="error-box">{{ error() }}</div>

      <div class="table-wrap" *ngIf="!loading()">
        <table class="data-table">
          <thead>
            <!-- <tr><th>ID</th><th>Source</th><th>Destination</th><th>Distance (km)</th><th>Duration (min)</th><th>Base Fare (₹)</th><th>Status</th><th>Actions</th></tr> -->
            <tr><th>#</th><th>Source</th><th>Destination</th><th>Distance (km)</th><th>Duration</th><th>Base Fare (₹)</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let route of filteredRoutes(); let i = index">
              <td>{{ i + 1 }}</td>
              <td><strong>{{ route.source }}</strong></td>
              <td><strong>{{ route.destination }}</strong></td>
              <td>{{ route.distance }}</td>
              <td>{{ route.formattedDuration || formatDuration(route.estimatedTravelTimeMinutes) }}</td>
              <td>₹{{ route.baseFare }}</td>
              <td><span class="status-chip" [class.active]="route.isActive">{{ route.isActive ? 'Active' : 'Inactive' }}</span></td>
              <td>
                <button class="btn-edit" (click)="editRoute(route)">✏️ Edit</button>
                <button class="btn-delete" (click)="deleteRoute(route.routeId)">🗑️ Delete</button>
              </td>
            </tr>
            <tr *ngIf="filteredRoutes().length === 0">
              <td colspan="8" class="empty-row">No routes found.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="modal-overlay" *ngIf="showModal()" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ editingId() ? 'Edit Route' : 'Add New Route' }}</h3>
            <button class="close-btn" (click)="closeModal()">✕</button>
          </div>
          <form [formGroup]="routeForm" (ngSubmit)="saveRoute()" class="modal-form">
            <div class="form-row">
              <label class="form-label">Source City *
                <input class="form-input" formControlName="source" placeholder="e.g. Chennai" />
                <span class="field-error" *ngIf="routeForm.get('source')?.invalid && routeForm.get('source')?.touched">Required</span>
              </label>
              <label class="form-label">Destination City *
                <input class="form-input" formControlName="destination" placeholder="e.g. Bangalore" />
                <span class="field-error" *ngIf="routeForm.get('destination')?.invalid && routeForm.get('destination')?.touched">Required</span>
              </label>
            </div>
            <div class="form-row">
              <label class="form-label">Distance (km) *
                <input class="form-input" type="number" formControlName="distance" placeholder="350" />
              </label>
              <label class="form-label">Est. Duration *
            <div class="duration-row">
              <div class="duration-field">
                <input class="form-input" type="number" formControlName="durationHours" placeholder="0" min="0" />
                <span class="duration-unit">hrs</span>
              </div>
              <div class="duration-field">
                <input class="form-input" type="number" formControlName="durationMinutes" placeholder="0" min="0" max="59" />
                <span class="duration-unit">min</span>
              </div>
            </div>
            <span class="field-error" *ngIf="(routeForm.get('durationHours')?.value ?? 0) == 0 && (routeForm.get('durationMinutes')?.value ?? 0) == 0 && routeForm.touched">Duration must be greater than 0</span>
          </label>
            </div>
            <label class="form-label">Base Fare (₹) *
              <input class="form-input" type="number" formControlName="baseFare" placeholder="500" />
            </label>
            <div class="modal-actions">
              <button type="button" class="btn-secondary" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn-primary" [disabled]="saving()">{{ saving() ? 'Saving...' : (editingId() ? 'Update' : 'Add Route') }}</button>
            </div>
            <div *ngIf="formError()" class="error-box" style="margin-top:8px">{{ formError() }}</div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
    .page-heading{font-size:1.4rem;font-weight:700;color:#0A1F44;margin:0}
    .search-bar{margin-bottom:16px}
    .search-input{width:100%;max-width:360px;border:1.5px solid #e2e8f0;border-radius:8px;padding:9px 14px;font-size:.875rem;outline:none}
    .search-input:focus{border-color:#3b82f6}
    .btn-primary{background:#1d4ed8;color:#fff;border:none;padding:9px 18px;border-radius:8px;cursor:pointer;font-size:.875rem;font-weight:500}
    .btn-primary:disabled{opacity:.6;cursor:not-allowed}
    .btn-secondary{background:#f1f5f9;color:#374151;border:none;padding:9px 18px;border-radius:8px;cursor:pointer;font-size:.875rem}
    .btn-edit{background:#eff6ff;color:#1d4ed8;border:none;padding:5px 10px;border-radius:6px;cursor:pointer;font-size:.8rem;margin-right:6px}
    .btn-delete{background:#fee2e2;color:#dc2626;border:none;padding:5px 10px;border-radius:6px;cursor:pointer;font-size:.8rem}
    .table-wrap{background:#fff;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,.06);overflow:hidden}
    .data-table{width:100%;border-collapse:collapse;font-size:.875rem}
    .data-table th{background:#f8fafc;padding:12px 16px;text-align:left;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0}
    .data-table td{padding:12px 16px;border-bottom:1px solid #f1f5f9;color:#1e293b}
    .data-table tr:last-child td{border-bottom:none}
    .status-chip{padding:3px 10px;border-radius:20px;font-size:.75rem;background:#fee2e2;color:#dc2626}
    .status-chip.active{background:#dcfce7;color:#16a34a}
    .empty-row{text-align:center;color:#94a3b8;padding:32px!important}
    .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:100}
    .modal{background:#fff;border-radius:14px;padding:24px;width:480px;max-width:95vw}
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
export class AdminRoutes implements OnInit {
  private routeService = inject(RouteService);
  private fb = inject(FormBuilder);

  routes = signal<any[]>([]);
  filteredRoutes = signal<any[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  showModal = signal(false);
  saving = signal(false);
  formError = signal<string | null>(null);
  editingId = signal<number | null>(null);

  routeForm = this.fb.group({
    source: ['', Validators.required],
    destination: ['', Validators.required],
    distance: [null, [Validators.required, Validators.min(0.1)]],
    durationHours: [0, [Validators.required, Validators.min(0)]],
    durationMinutes: [0, [Validators.required, Validators.min(0), Validators.max(59)]],
    baseFare: [null, [Validators.required, Validators.min(0)]]
  });

  ngOnInit() { this.loadRoutes(); }

  loadRoutes() {
    this.loading.set(true);
    this.routeService.getAllRoutes(1, 200).subscribe({
      // next: r => { const d = Array.isArray(r.data) ? r.data : []; this.routes.set(d); this.filteredRoutes.set(d); this.loading.set(false); },
      next: r => { const d = Array.isArray(r.data) ? r.data : (r.data?.items ?? []); this.routes.set(d); this.filteredRoutes.set(d); this.loading.set(false); },
      error: e => { this.error.set(e?.error?.message || 'Failed to load routes'); this.loading.set(false); }
    });
  }

  onSearch(event: Event) {
    const q = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredRoutes.set(this.routes().filter(r => r.source?.toLowerCase().includes(q) || r.destination?.toLowerCase().includes(q)));
  }

  openModal() { this.routeForm.reset({ source:'', destination:'', distance: null, durationHours: 0, durationMinutes: 0, baseFare: null }); this.editingId.set(null); this.formError.set(null); this.showModal.set(true); }
  editRoute(r: any) {
    this.editingId.set(r.routeId);
    const totalMins = r.estimatedTravelTimeMinutes || 0;
    this.routeForm.patchValue({ source: r.source, destination: r.destination, distance: r.distance, durationHours: Math.floor(totalMins / 60), durationMinutes: totalMins % 60, baseFare: r.baseFare });
    this.formError.set(null); this.showModal.set(true);
  }

  closeModal() { this.showModal.set(false); this.editingId.set(null); }

  saveRoute() {
  if (this.routeForm.invalid) { this.routeForm.markAllAsTouched(); return; }
  const v = this.routeForm.value as any;
  const totalMinutes = (Number(v.durationHours) * 60) + Number(v.durationMinutes);
  if (totalMinutes <= 0) { this.formError.set('Duration must be greater than 0'); return; }
  this.saving.set(true); this.formError.set(null);
  const payload = { source: v.source, destination: v.destination, distance: v.distance, estimatedTravelTimeMinutes: totalMinutes, baseFare: v.baseFare };
  const id = this.editingId();
  const req$ = id ? this.routeService.updateRoute(id, payload) : this.routeService.createRoute(payload);
    req$.subscribe({
      next: () => { this.saving.set(false); this.closeModal(); this.loadRoutes(); },
      error: e => { this.saving.set(false); this.formError.set(e?.error?.message || 'Save failed'); }
    });
  }

  deleteRoute(id: number) {
    if (!confirm('Delete this route?')) return;
    this.routeService.deleteRoute(id).subscribe({ next: () => this.loadRoutes(), error: e => alert(e?.error?.message || 'Delete failed') });
  }

  formatDuration(minutes: number): string {
    if (!minutes) return '—';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  }
}
