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
      <div *ngIf="deleteError()" class="warn-box">
        ⚠️ {{ deleteError() }}
        <button (click)="deleteError.set(null)" style="margin-left:8px;background:none;border:none;cursor:pointer;font-weight:700">✕</button>
      </div>

      <div *ngIf="loading()" class="info-box">Loading routes...</div>
      <div *ngIf="error()" class="error-box">{{ error() }}</div>

      <div class="table-wrap" *ngIf="!loading()">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width:52px;text-align:center;">#</th>
              <th>Source</th>
              <th>Destination</th>
              <th>Distance (km)</th>
              <th>Duration</th>
              <th>Base Fare (₹)</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let route of filteredRoutes(); let i = index">
              <td style="width:52px;text-align:center;color:#94a3b8;font-size:.8rem;">{{ rangeStart() + i }}</td>
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

      <!-- Results summary — OUTSIDE table-wrap -->
      <div class="results-summary" *ngIf="!loading() && totalCount() > 0">
        Showing {{ rangeStart() }}–{{ rangeEnd() }} of <strong>{{ totalCount() }}</strong> routes
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
              <button type="submit" class="btn-primary" [disabled]="saving()">
                {{ saving() ? 'Saving...' : (editingId() ? 'Update' : 'Add Route') }}
              </button>
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
    .info-box{padding:12px 16px;background:#eff6ff;border-radius:8px;color:#1d4ed8;font-size:.875rem;margin-bottom:16px}
    .error-box{padding:12px 16px;background:#fee2e2;border-radius:8px;color:#dc2626;font-size:.875rem;margin-bottom:16px}
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
  `]
})
export class AdminRoutes implements OnInit {
  private routeService = inject(RouteService);
  private fb = inject(FormBuilder);

  routes         = signal<any[]>([]);
  filteredRoutes = signal<any[]>([]);
  loading        = signal(true);
  error          = signal<string | null>(null);
  showModal      = signal(false);
  saving         = signal(false);
  formError      = signal<string | null>(null);
  editingId      = signal<number | null>(null);
  deleteError = signal<string | null>(null);


  // Pagination
  pageSize    = signal(10);
  currentPage = signal(1);
  totalCount  = signal(0);
  totalPages  = signal(0);

  routeForm = this.fb.group({
    source:          ['', Validators.required],
    destination:     ['', Validators.required],
    distance:        [null, [Validators.required, Validators.min(0.1)]],
    durationHours:   [0, [Validators.required, Validators.min(0)]],
    durationMinutes: [0, [Validators.required, Validators.min(0), Validators.max(59)]],
    baseFare:        [null, [Validators.required, Validators.min(0)]]
  });

  ngOnInit() { this.loadRoutes(); }

  loadRoutes() {
    this.loading.set(true);
    this.routeService.getAllRoutes(this.currentPage(), this.pageSize()).subscribe({
      next: r => {
        const data = r.data?.items ?? (Array.isArray(r.data) ? r.data : []);
        this.routes.set(data);
        this.filteredRoutes.set(data);
        this.updatePagination(r.data?.totalCount ?? data.length);
        this.loading.set(false);
      },
      error: e => { this.error.set(e?.error?.message || 'Failed to load routes'); this.loading.set(false); }
    });
  }

  onSearch(event: Event) {
    const q = (event.target as HTMLInputElement).value.toLowerCase();
    if (!q) {
      this.currentPage.set(1);
      this.loadRoutes();
      return;
    }
    this.loading.set(true);
    this.routeService.getAllRoutes(1, 10000).subscribe({
      next: r => {
        const all = r.data?.items ?? (Array.isArray(r.data) ? r.data : []);
        const filtered = all.filter((r: any) =>
          r.source?.toLowerCase().includes(q) ||
          r.destination?.toLowerCase().includes(q)
        );
        this.filteredRoutes.set(filtered);
        this.updatePagination(filtered.length);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  openModal() {
    this.routeForm.reset({ source: '', destination: '', distance: null, durationHours: 0, durationMinutes: 0, baseFare: null });
    this.editingId.set(null);
    this.formError.set(null);
    this.showModal.set(true);
  }

  editRoute(r: any) {
    this.editingId.set(r.routeId);
    const totalMins = r.estimatedTravelTimeMinutes || 0;
    this.routeForm.patchValue({
      source: r.source, destination: r.destination, distance: r.distance,
      durationHours: Math.floor(totalMins / 60), durationMinutes: totalMins % 60,
      baseFare: r.baseFare
    });
    this.formError.set(null);
    this.showModal.set(true);
  }

  closeModal() { this.showModal.set(false); this.editingId.set(null); }

  saveRoute() {
    if (this.routeForm.invalid) { this.routeForm.markAllAsTouched(); return; }
    const v = this.routeForm.value as any;
    const totalMinutes = (Number(v.durationHours) * 60) + Number(v.durationMinutes);
    if (totalMinutes <= 0) { this.formError.set('Duration must be greater than 0'); return; }
    this.saving.set(true);
    this.formError.set(null);
    const payload = {
      source: v.source, destination: v.destination,
      distance: v.distance, estimatedTravelTimeMinutes: totalMinutes, baseFare: v.baseFare
    };
    const id = this.editingId();
    const req$ = id ? this.routeService.updateRoute(id, payload) : this.routeService.createRoute(payload);
    req$.subscribe({
      next: () => { this.saving.set(false); this.closeModal(); this.currentPage.set(1); this.loadRoutes(); },
      error: e => { this.saving.set(false); this.formError.set(e?.error?.message || 'Save failed'); }
    });
  }

  deleteRoute(id: number) {
    if (!confirm('Delete this route?')) return;
    this.deleteError.set(null);
    this.routeService.deleteRoute(id).subscribe({
      next: () => { this.currentPage.set(1); this.loadRoutes(); },
      error: e => this.deleteError.set(e?.error?.message || 'Delete failed')
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
    this.loadRoutes();
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

  formatDuration(minutes: number): string {
    if (!minutes) return '—';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  }
}