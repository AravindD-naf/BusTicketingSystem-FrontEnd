import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { AuditLogService } from '../../../core/services/audit-log.service';

@Component({
  selector: 'app-admin-audit-logs',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div>
      <div class="page-header">
        <h2 class="page-heading">Audit Logs</h2>
        <!-- <span class="total-badge">{{ totalCount() }} total records</span> -->
      </div>

      <!-- Filters -->
      <form [formGroup]="filterForm" (ngSubmit)="applyFilters()" class="filter-card">
        <div class="filter-grid">
          <label class="form-label">Entity Name
            <input class="form-input" formControlName="entityName" placeholder="e.g. Bus, Route, Booking" />
          </label>
          <label class="form-label">From Date
            <input class="form-input" type="date" formControlName="fromDate" />
          </label>
          <label class="form-label">To Date
            <input class="form-input" type="date" formControlName="toDate" />
          </label>
          <label class="form-label">Page Size
            <select class="form-input" formControlName="pageSize" (change)="onPageSizeChange()">
              <option value="20">20 per page</option>
              <option value="50">50 per page</option>
              <option value="100">100 per page</option>
            </select>
          </label>
        </div>
        <div class="filter-actions">
          <button type="submit" class="btn-primary" [disabled]="loading()">
            {{ loading() ? 'Loading...' : 'Apply Filters' }}
          </button>
          <button type="button" class="btn-secondary" (click)="resetFilters()">Reset</button>
        </div>
      </form>

      <!-- Results summary -->
      <div class="results-summary" *ngIf="!loading() && totalCount() > 0">
        Showing {{ rangeStart() }}–{{ rangeEnd() }} of <strong>{{ totalCount() }}</strong> logs
      </div>

      <div *ngIf="loading()" class="info-box">Loading audit logs...</div>
      <div *ngIf="error()" class="error-box">{{ error() }}</div>

      <div class="table-wrap" *ngIf="!loading()">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th><th>Entity</th><th>Action</th>
              <th>Changed By</th><th>IP Address</th>
              <th>Date & Time</th><th>Details</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let log of logs(); let i = index">
              <td>{{ rangeStart() + i }}</td>
              <td><span class="entity-badge">{{ log.entityName }}</span></td>
              <td><span class="action-badge" [class]="getActionClass(log.action)">{{ log.action }}</span></td>
              <td>{{ log.userEmail || '—' }}</td>
              <td>{{ log.ipAddress || '—' }}</td>
              <td>{{ log.timestamp | date:'medium' }}</td>
              <td><button class="btn-view" (click)="viewLog(log)">👁️ Details</button></td>
            </tr>
            <tr *ngIf="logs().length === 0">
              <td colspan="7" class="empty-row">No audit logs found for the selected filters.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Controls -->
      <div class="pagination-bar" *ngIf="totalPages() > 1">
        <button class="page-btn" (click)="goToPage(1)" [disabled]="currentPage() === 1">
          «
        </button>
        <button class="page-btn" (click)="prevPage()" [disabled]="currentPage() === 1">
          ← Prev
        </button>

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

        <button class="page-btn" (click)="nextPage()" [disabled]="currentPage() === totalPages()">
          Next →
        </button>
        <button class="page-btn" (click)="goToPage(totalPages())" [disabled]="currentPage() === totalPages()">
          »
        </button>

        <span class="page-info">Page {{ currentPage() }} of {{ totalPages() }}</span>
      </div>

      <!-- Detail Modal -->
      <div class="modal-overlay" *ngIf="selectedLog()" (click)="selectedLog.set(null)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Audit Log Detail</h3>
            <button class="close-btn" (click)="selectedLog.set(null)">✕</button>
          </div>
          <div class="detail-grid">
            <div class="detail-row"><span class="dk">Entity</span><span>{{ selectedLog()?.entityName }}</span></div>
            <div class="detail-row"><span class="dk">Entity ID</span><span>{{ selectedLog()?.entityId }}</span></div>
            <div class="detail-row"><span class="dk">Action</span>
              <span class="action-badge" [class]="getActionClass(selectedLog()?.action)">{{ selectedLog()?.action }}</span>
            </div>
            <div class="detail-row"><span class="dk">Changed By</span><span>{{ selectedLog()?.userEmail || '—' }}</span></div>
            <div class="detail-row"><span class="dk">IP Address</span><span>{{ selectedLog()?.ipAddress || '—' }}</span></div>
            <div class="detail-row"><span class="dk">Timestamp</span><span>{{ selectedLog()?.timestamp | date:'medium' }}</span></div>
          </div>
          <div class="json-section" *ngIf="selectedLog()?.oldValues">
            <p class="json-label">Old Values</p>
            <pre class="json-pre">{{ selectedLog()?.oldValues }}</pre>
          </div>
          <div class="json-section" *ngIf="selectedLog()?.newValues">
            <p class="json-label">New Values</p>
            <pre class="json-pre">{{ selectedLog()?.newValues }}</pre>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-header{display:flex;align-items:center;gap:16px;margin-bottom:16px}
    .page-heading{font-size:1.4rem;font-weight:700;color:#0A1F44;margin:0}
    .total-badge{background:#f1f5f9;color:#64748b;padding:4px 12px;border-radius:20px;font-size:.8rem;font-weight:500}
    .filter-card{background:#fff;border-radius:12px;padding:16px 20px;margin-bottom:16px;box-shadow:0 1px 4px rgba(0,0,0,.06)}
    .filter-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;margin-bottom:12px}
    .form-label{display:flex;flex-direction:column;gap:4px;font-size:.82rem;font-weight:500;color:#374151}
    .form-input{border:1.5px solid #e2e8f0;border-radius:8px;padding:8px 12px;font-size:.875rem;outline:none}
    .form-input:focus{border-color:#3b82f6}
    .filter-actions{display:flex;gap:10px}
    .btn-primary{background:#1d4ed8;color:#fff;border:none;padding:9px 18px;border-radius:8px;cursor:pointer;font-size:.875rem;font-weight:500}
    .btn-primary:disabled{opacity:.6;cursor:not-allowed}
    .btn-secondary{background:#f1f5f9;color:#374151;border:none;padding:9px 18px;border-radius:8px;cursor:pointer;font-size:.875rem}
    .btn-view{background:#f0fdf4;color:#16a34a;border:none;padding:5px 10px;border-radius:6px;cursor:pointer;font-size:.8rem}
    .results-summary{font-size:.82rem;color:#64748b;margin-bottom:10px;padding:0 2px}
    .results-summary strong{color:#0A1F44}
    .table-wrap{background:#fff;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,.06);overflow:auto;margin-bottom:16px}
    .data-table{width:100%;border-collapse:collapse;font-size:.875rem}
    .data-table th{background:#f8fafc;padding:12px 16px;text-align:left;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;white-space:nowrap}
    .data-table td{padding:12px 16px;border-bottom:1px solid #f1f5f9;color:#1e293b}
    .data-table tr:last-child td{border-bottom:none}
    .entity-badge{background:#eff6ff;color:#1d4ed8;padding:3px 8px;border-radius:4px;font-size:.75rem;font-weight:600}
    .action-badge{padding:3px 8px;border-radius:4px;font-size:.75rem;font-weight:600}
    .action-create{background:#dcfce7;color:#16a34a}
    .action-update{background:#fef9c3;color:#ca8a04}
    .action-delete{background:#fee2e2;color:#dc2626}
    .action-default{background:#f1f5f9;color:#64748b}
    .empty-row{text-align:center;color:#94a3b8;padding:32px!important}

    /* Pagination */
    .pagination-bar{display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;margin-top:4px}
    .page-btn{background:#fff;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 14px;font-size:.8rem;font-weight:600;color:#0A1F44;cursor:pointer;transition:all .18s}
    .page-btn:hover:not(:disabled){border-color:#3b82f6;color:#1d4ed8}
    .page-btn:disabled{opacity:.4;cursor:not-allowed}
    .page-numbers{display:flex;align-items:center;gap:4px}
    .page-num{min-width:34px;height:34px;border:1.5px solid #e2e8f0;border-radius:8px;background:#fff;font-size:.82rem;font-weight:600;color:#374151;cursor:pointer;transition:all .18s;display:flex;align-items:center;justify-content:center}
    .page-num:hover:not(:disabled):not(.ellipsis){border-color:#3b82f6;color:#1d4ed8}
    .page-num.active{background:#1d4ed8;border-color:#1d4ed8;color:#fff}
    .page-num.ellipsis{border:none;background:none;cursor:default;color:#94a3b8}
    .page-info{font-size:.8rem;color:#64748b;margin-left:8px;white-space:nowrap}

    /* Modal */
    .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:100}
    .modal{background:#fff;border-radius:14px;padding:24px;width:520px;max-width:95vw;max-height:90vh;overflow-y:auto}
    .modal-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
    .modal-header h3{font-size:1.1rem;font-weight:600;margin:0;color:#0A1F44}
    .close-btn{background:none;border:none;cursor:pointer;font-size:1.1rem;color:#64748b}
    .detail-grid{display:flex;flex-direction:column;gap:8px;margin-bottom:16px}
    .detail-row{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #f1f5f9;font-size:.875rem}
    .dk{color:#64748b;font-weight:500}
    .json-section{margin-top:12px}
    .json-label{font-size:.8rem;font-weight:600;color:#64748b;margin:0 0 6px}
    .json-pre{background:#f8fafc;border-radius:8px;padding:12px;font-size:.78rem;overflow:auto;max-height:200px;color:#374151;margin:0}
    .info-box{padding:12px 16px;background:#eff6ff;border-radius:8px;color:#1d4ed8;font-size:.875rem;margin-bottom:16px}
    .error-box{padding:12px 16px;background:#fee2e2;border-radius:8px;color:#dc2626;font-size:.875rem;margin-bottom:16px}
  `]
})
export class AdminAuditLogs implements OnInit {
  private auditService = inject(AuditLogService);
  private fb = inject(FormBuilder);

  logs        = signal<any[]>([]);
  selectedLog = signal<any>(null);
  loading     = signal(true);
  error       = signal<string | null>(null);

  // Pagination state
  currentPage = signal(1);
  totalCount  = signal(0);

  filterForm = this.fb.group({
    entityName: [''],
    fromDate:   [''],
    toDate:     [''],
    pageSize:   [20]
  });

  // ── Computed pagination values ──
  get pageSize(): number {
    return Number(this.filterForm.get('pageSize')?.value ?? 20);
  }

  totalPages = signal(0);

  rangeStart = () => (this.currentPage() - 1) * this.pageSize + 1;
  rangeEnd   = () => Math.min(this.currentPage() * this.pageSize, this.totalCount());

  // Shows max 7 page numbers with ellipsis:
  // e.g. [1] ... [4][5][6] ... [20]
  visiblePages(): number[] {
    const total   = this.totalPages();
    const current = this.currentPage();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const pages: number[] = [1];

    if (current > 4) pages.push(-1); // left ellipsis

    const start = Math.max(2, current - 1);
    const end   = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) pages.push(i);

    if (current < total - 3) pages.push(-1); // right ellipsis

    pages.push(total);
    return pages;
  }

  ngOnInit() { this.loadLogs(); }

  loadLogs() {
    this.loading.set(true);
    this.error.set(null);
    const v = this.filterForm.value;
    const entityName = v.entityName
      ? v.entityName.trim().charAt(0).toUpperCase() + v.entityName.trim().slice(1)
      : undefined;

    this.auditService.getAuditLogs({
      pageNumber: this.currentPage(),
      pageSize:   this.pageSize,
      entityName,
      fromDate: v.fromDate || undefined,
      toDate:   v.toDate   || undefined
    }).subscribe({
      next: r => {
        this.logs.set(r.data?.data ?? r.data?.items ?? (Array.isArray(r.data) ? r.data : []));
        // Read totalCount from API response
        const count = r.data?.totalCount ?? r.data?.count ?? 0;
        this.totalCount.set(count);
        this.totalPages.set(Math.ceil(count / this.pageSize));
        this.loading.set(false);
      },
      error: e => {
        this.error.set(e?.error?.message || 'Failed to load audit logs');
        this.loading.set(false);
      }
    });
  }

  applyFilters() {
    this.currentPage.set(1); // reset to page 1 on new filter
    this.loadLogs();
  }

  resetFilters() {
    this.filterForm.reset({ entityName: '', fromDate: '', toDate: '', pageSize: 20 });
    this.currentPage.set(1);
    this.loadLogs();
  }

  onPageSizeChange() {
    this.currentPage.set(1); // reset to page 1 when page size changes
    this.loadLogs();
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadLogs();
  }

  nextPage() { this.goToPage(this.currentPage() + 1); }
  prevPage() { this.goToPage(this.currentPage() - 1); }

  viewLog(log: any) { this.selectedLog.set(log); }

  getActionClass(action: string): string {
    const a = action?.toLowerCase();
    if (a?.includes('create') || a?.includes('add'))      return 'action-badge action-create';
    if (a?.includes('update') || a?.includes('edit'))     return 'action-badge action-update';
    if (a?.includes('delete') || a?.includes('cancel'))   return 'action-badge action-delete';
    return 'action-badge action-default';
  }
}