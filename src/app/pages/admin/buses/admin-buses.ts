import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { BusSearchService } from '../../../core/services/bus-search.service';

@Component({
  selector: 'app-admin-buses',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div>
      <div class="page-header">
        <h2 class="page-heading">Bus Management</h2>
        <button class="btn-primary" (click)="openModal()">➕ Add Bus</button>
      </div>

      <div class="search-bar">
        <input class="search-input" placeholder="Search by bus number, operator or type..." (input)="onSearch($event)" />
      </div>

      <div *ngIf="loading()" class="info-box">Loading buses...</div>
      <div *ngIf="error()" class="error-box">{{ error() }}</div>

      <div class="table-wrap" *ngIf="!loading()">
        <table class="data-table">
          <thead>
            <tr>
              <th class="col-sno">#</th>
              <th>Bus Number</th>
              <th>Type</th>
              <th>Operator</th>
              <th>Total Seats</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let bus of filteredBuses(); let i = index">
              <td class="col-sno">{{ rangeStart() + i }}</td>
              <td><strong>{{ bus.busNumber }}</strong></td>
              <td><span class="badge">{{ bus.busType }}</span></td>
              <td>{{ bus.operatorName }}</td>
              <td>{{ bus.totalSeats }}</td>
              <td>
                <span class="status-chip" [class.active]="bus.isActive">
                  {{ bus.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td>
                <button class="btn-edit" (click)="editBus(bus)">✏️ Edit</button>
                <button class="btn-delete" (click)="deleteBus(bus.busId)">🗑️ Delete</button>
              </td>
            </tr>
            <tr *ngIf="buses().length === 0">
              <td colspan="7" class="empty-row">No buses found. Click "Add Bus" to get started.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Results summary — OUTSIDE table-wrap -->
      <div class="results-summary" *ngIf="!loading() && totalCount() > 0">
        Showing {{ rangeStart() }}–{{ rangeEnd() }} of <strong>{{ totalCount() }}</strong> buses
      </div>

      <!-- Pagination — OUTSIDE table-wrap -->
      <div class="pagination-bar" *ngIf="!loading() && totalPages() > 1">
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
            <h3>{{ editingId() ? 'Edit Bus' : 'Add New Bus' }}</h3>
            <button class="close-btn" (click)="closeModal()">✕</button>
          </div>
          <form [formGroup]="busForm" (ngSubmit)="saveBus()" class="modal-form">
            <label class="form-label">Bus Number *
              <input class="form-input" formControlName="busNumber" placeholder="e.g. TN01AB1234" />
              <span class="field-error" *ngIf="busForm.get('busNumber')?.invalid && busForm.get('busNumber')?.touched">Required</span>
            </label>
            <label class="form-label">Bus Type *
              <select class="form-input" formControlName="busType">
                <option value="">Select type</option>
                <option value="AC Sleeper">AC Sleeper</option>
                <option value="Non-AC Sleeper">Non-AC Sleeper</option>
                <option value="AC Seater">AC Seater</option>
                <option value="Non-AC Seater">Non-AC Seater</option>
                <option value="Volvo AC Sleeper">Volvo AC Sleeper</option>
                <option value="AC Semi-Sleeper">AC Semi-Sleeper</option>
              </select>
              <span class="field-error" *ngIf="busForm.get('busType')?.invalid && busForm.get('busType')?.touched">Required</span>
            </label>
            <label class="form-label">Total Seats *
              <input class="form-input" type="number" formControlName="totalSeats" placeholder="e.g. 40" />
              <span class="field-error" *ngIf="busForm.get('totalSeats')?.invalid && busForm.get('totalSeats')?.touched">Min 1 seat</span>
            </label>
            <label class="form-label">Operator Name *
              <input class="form-input" formControlName="operatorName" placeholder="e.g. TNSTC" />
              <span class="field-error" *ngIf="busForm.get('operatorName')?.invalid && busForm.get('operatorName')?.touched">Required</span>
            </label>
            <div class="toggle-row" *ngIf="editingId()">
              <label class="toggle-label">
                <input type="checkbox" formControlName="isActive" class="toggle-checkbox" />
                <span class="toggle-track">
                  <span class="toggle-thumb"></span>
                </span>
                <span class="toggle-text">
                  {{ busForm.get('isActive')?.value ? 'Active — Bus can be scheduled' : 'Inactive — Bus cannot be scheduled' }}
                </span>
              </label>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn-secondary" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn-primary" [disabled]="saving()">
                {{ saving() ? 'Saving...' : (editingId() ? 'Update Bus' : 'Add Bus') }}
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
    .btn-primary:hover{background:#1e40af}
    .btn-primary:disabled{opacity:.6;cursor:not-allowed}
    .btn-secondary{background:#f1f5f9;color:#374151;border:none;padding:9px 18px;border-radius:8px;cursor:pointer;font-size:.875rem}
    .btn-edit{background:#eff6ff;color:#1d4ed8;border:none;padding:5px 10px;border-radius:6px;cursor:pointer;font-size:.8rem;margin-right:6px}
    .btn-delete{background:#fee2e2;color:#dc2626;border:none;padding:5px 10px;border-radius:6px;cursor:pointer;font-size:.8rem}
    .table-wrap{background:#fff;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,.06);overflow:hidden}
    .data-table{width:100%;border-collapse:collapse;font-size:.875rem}
    .data-table th{background:#f8fafc;padding:12px 16px;text-align:left;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0}
    .data-table td{padding:12px 16px;border-bottom:1px solid #f1f5f9;color:#1e293b}
    .data-table tr:last-child td{border-bottom:none}
    .col-sno{width:52px;text-align:center;color:#94a3b8;font-size:.8rem}
    .badge{background:#eff6ff;color:#1d4ed8;padding:3px 8px;border-radius:4px;font-size:.75rem}
    .status-chip{padding:3px 10px;border-radius:20px;font-size:.75rem;background:#fee2e2;color:#dc2626}
    .status-chip.active{background:#dcfce7;color:#16a34a}
    .empty-row{text-align:center;color:#94a3b8;padding:32px!important}
    .info-box{padding:12px 16px;background:#eff6ff;border-radius:8px;color:#1d4ed8;font-size:.875rem;margin-bottom:16px}
    .error-box{padding:12px 16px;background:#fee2e2;border-radius:8px;color:#dc2626;font-size:.875rem;margin-bottom:16px}
    .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:100}
    .modal{background:#fff;border-radius:14px;padding:24px;width:440px;max-width:95vw;max-height:90vh;overflow-y:auto}
    .modal-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}
    .modal-header h3{font-size:1.1rem;font-weight:600;margin:0;color:#0A1F44}
    .close-btn{background:none;border:none;cursor:pointer;font-size:1.1rem;color:#64748b}
    .modal-form{display:flex;flex-direction:column;gap:14px}
    .form-label{display:flex;flex-direction:column;gap:5px;font-size:.85rem;font-weight:500;color:#374151}
    .form-input{border:1.5px solid #e2e8f0;border-radius:8px;padding:9px 12px;font-size:.875rem;outline:none;transition:border .2s}
    .form-input:focus{border-color:#3b82f6}
    .field-error{color:#dc2626;font-size:.75rem}
    .modal-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:4px}
    .toggle-row{padding:10px 14px;background:#f8fafc;border-radius:10px;border:1.5px solid #e2e8f0}
    .toggle-label{display:flex;align-items:center;gap:12px;cursor:pointer;user-select:none}
    .toggle-checkbox{display:none}
    .toggle-track{width:44px;height:24px;background:#cbd5e1;border-radius:12px;position:relative;transition:background .25s;flex-shrink:0}
    .toggle-checkbox:checked ~ .toggle-track{background:#22c55e}
    .toggle-thumb{position:absolute;top:3px;left:3px;width:18px;height:18px;background:#fff;border-radius:50%;transition:transform .25s;box-shadow:0 1px 3px rgba(0,0,0,.2)}
    .toggle-checkbox:checked ~ .toggle-track .toggle-thumb{transform:translateX(20px)}
    .toggle-text{font-size:.85rem;font-weight:500;color:#374151}
    .results-summary{font-size:.82rem;color:#64748b;margin:12px 0 6px;text-align:center}
    .results-summary strong{color:#0A1F44}
    .pagination-bar{display:flex;flex-direction:row;align-items:center;justify-content:center;flex-wrap:nowrap;gap:6px;margin-top:10px;padding:10px 0}
    .page-btn{flex-shrink:0;background:#fff;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 12px;font-size:.8rem;font-weight:600;color:#0A1F44;cursor:pointer;transition:all .18s;white-space:nowrap;line-height:1}
    .page-btn:hover:not(:disabled){border-color:#3b82f6;color:#1d4ed8}
    .page-btn:disabled{opacity:.4;cursor:not-allowed}
    .page-numbers{flex-shrink:0;display:flex;flex-direction:row;align-items:center;gap:4px}
    .page-num{flex-shrink:0;min-width:34px;height:34px;border:1.5px solid #e2e8f0;border-radius:8px;background:#fff;font-size:.82rem;font-weight:600;color:#374151;cursor:pointer;transition:all .18s;display:flex;align-items:center;justify-content:center;line-height:1}
    .page-num:hover:not(:disabled):not(.ellipsis){border-color:#3b82f6;color:#1d4ed8}
    .page-num.active{background:#1d4ed8;border-color:#1d4ed8;color:#fff}
    .page-num.ellipsis{border:none;background:none;cursor:default;color:#94a3b8}
    .page-info{flex-shrink:0;font-size:.8rem;color:#64748b;white-space:nowrap}
    .search-bar{margin-bottom:16px;}
    .search-input{width:100%;max-width:400px;border:1.5px solid #e2e8f0;border-radius:8px;padding:9px 14px;font-size:.875rem;outline:none;}
    .search-input:focus{border-color:#3b82f6;}
  `]
})
export class AdminBuses implements OnInit {
  private busService = inject(BusSearchService);
  private fb = inject(FormBuilder);

  buses     = signal<any[]>([]);
  filteredBuses = signal<any[]>([]);
  searchQuery   = '';
  loading   = signal(true);
  error     = signal<string | null>(null);
  showModal = signal(false);
  saving    = signal(false);
  formError = signal<string | null>(null);
  editingId = signal<number | null>(null);

  // Pagination
  pageSize    = signal(10);
  currentPage = signal(1);
  totalCount  = signal(0);
  totalPages  = signal(0);

  busForm = this.fb.group({
    busNumber:    ['', Validators.required],
    busType:      ['', Validators.required],
    totalSeats:   [40, [Validators.required, Validators.min(1)]],
    operatorName: ['', Validators.required],
    isActive:     [false]
  });

  ngOnInit() { this.loadBuses(); }

  loadBuses() {
    this.loading.set(true);
    this.busService.getAllBuses(this.currentPage(), this.pageSize()).subscribe({
      next: r => {
        const data = r.data?.items ?? (Array.isArray(r.data) ? r.data : []);
        this.buses.set(data);
        this.filteredBuses.set(data);
        this.updatePagination(r.data?.totalCount ?? data.length);
        this.loading.set(false);
      },
      error: e => {
        this.error.set(e?.error?.message || 'Failed to load buses');
        this.loading.set(false);
      }
    });
  }

  onSearch(event: Event) {
    const q = (event.target as HTMLInputElement).value.toLowerCase();
    this.searchQuery = q;
    this.filteredBuses.set(
      this.buses().filter(b =>
        b.busNumber?.toLowerCase().includes(q) ||
        b.operatorName?.toLowerCase().includes(q) ||
        b.busType?.toLowerCase().includes(q)
      )
    );
  }

  updatePagination(total: number) {
    this.totalCount.set(total);
    this.totalPages.set(Math.ceil(total / this.pageSize()));
  }

  rangeStart() { return (this.currentPage() - 1) * this.pageSize() + 1; }
  rangeEnd()   { return Math.min(this.currentPage() * this.pageSize(), this.totalCount()); }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadBuses();
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

  openModal() {
    this.busForm.reset({ busNumber: '', busType: '', totalSeats: 40, operatorName: '', isActive: false });
    this.editingId.set(null);
    this.formError.set(null);
    this.showModal.set(true);
  }

  editBus(bus: any) {
    this.editingId.set(bus.busId);
    this.busForm.patchValue({
      busNumber: bus.busNumber, busType: bus.busType,
      totalSeats: bus.totalSeats, operatorName: bus.operatorName, isActive: bus.isActive
    });
    this.formError.set(null);
    this.showModal.set(true);
  }

  closeModal() { this.showModal.set(false); this.editingId.set(null); }

  saveBus() {
    if (this.busForm.invalid) { this.busForm.markAllAsTouched(); return; }
    this.saving.set(true);
    this.formError.set(null);
    const v = this.busForm.value;
    const id = this.editingId();
    const req$ = id
      ? this.busService.updateBus(id, { busType: v.busType, totalSeats: v.totalSeats, operatorName: v.operatorName, isActive: v.isActive })
      : this.busService.createBus({ busNumber: v.busNumber!, busType: v.busType!, totalSeats: v.totalSeats!, operatorName: v.operatorName! });
    req$.subscribe({
      next: () => { this.saving.set(false); this.closeModal(); this.currentPage.set(1); this.loadBuses(); },
      error: e => { this.saving.set(false); this.formError.set(e?.error?.message || 'Save failed'); }
    });
  }

  deleteBus(id: number) {
    if (!confirm('Delete this bus?')) return;
    this.busService.deleteBus(id).subscribe({
      next: () => { this.currentPage.set(1); this.loadBuses(); },
      error: e => alert(e?.error?.message || 'Delete failed')
    });
  }
}