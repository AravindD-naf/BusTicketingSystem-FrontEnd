import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { BookingService } from '../../../core/services/booking.service';
import { PaymentService } from '../../../core/services/payment.service';

@Component({
  selector: 'app-admin-bookings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div>
      <div class="page-header">
        <h2 class="page-heading">Booking Management</h2>
      </div>

      <div class="filter-row">
        <input class="search-input" placeholder="Search by booking ID, status..." (input)="onSearch($event)" />
        <select class="filter-select" (change)="onStatusFilter($event)">
          <option value="">All Status</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Expired">Expired</option>
          <option value="Pending">Pending</option>
          <option value="Cancelled">Cancelled</option>
        </select>
        <select class="filter-select" (change)="onPageSizeChange($event)">
          <option value="10">10 per page</option>
          <option value="25">25 per page</option>
          <option value="50">50 per page</option>
        </select>
      </div>

      <div *ngIf="loading()" class="info-box">Loading bookings...</div>
      <div *ngIf="error()" class="error-box">{{ error() }}</div>

      <div class="table-wrap" *ngIf="!loading()">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width:52px;text-align:center;">#</th>
              <th>Booking ID</th>
              <th>Schedule</th>
              <th>Seats</th>
              <th>Fare (₹)</th>
              <th>Tax (₹)</th>
              <th>Total (₹)</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let b of filteredBookings(); let i = index">
              <td style="width:52px;text-align:center;color:#94a3b8;font-size:.8rem;">{{ rangeStart() + i }}</td>
              <td><strong>#{{ b.bookingId }}</strong></td>
              <td>{{ b.scheduleId }}</td>
              <td>{{ b.numberOfSeats || '—' }}</td>
              <td>₹{{ b.totalAmount }}</td>
              <td>₹{{ getTax(b.totalAmount) }} <span class="tax-note">+₹{{ CONVENIENCE_FEE }}</span></td>
              <td><strong>₹{{ getGrandTotal(b.totalAmount) }}</strong></td>
              <td>{{ b.bookingDate | date:'mediumDate' }}</td>
              <td><span [class]="getStatusClass(b.bookingStatus)">{{ getStatusLabel(b.bookingStatus) }}</span></td>
              <td>
                <button class="btn-view" (click)="viewBooking(b)">👁️ View</button>
                <button class="btn-cancel" *ngIf="b.bookingStatus === 'Confirmed'" (click)="cancelBooking(b.bookingId)">❌ Cancel</button>
                <button class="btn-refund" *ngIf="b.bookingStatus === 'Cancelled' && b.cancelledBy === 'Admin'" (click)="openRefundModal(b)">💰 Refund</button>
              </td>
            </tr>
            <tr *ngIf="filteredBookings().length === 0">
              <td colspan="10" class="empty-row">No bookings found.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Results summary — OUTSIDE table-wrap -->
      <div class="results-summary" *ngIf="!loading() && totalCount() > 0">
        Showing {{ rangeStart() }}–{{ rangeEnd() }} of <strong>{{ totalCount() }}</strong> bookings
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

      <!-- View Modal -->
      <div class="modal-overlay" *ngIf="selectedBooking()" (click)="selectedBooking.set(null)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Booking #{{ selectedBooking()?.bookingId }} Details</h3>
            <button class="close-btn" (click)="selectedBooking.set(null)">✕</button>
          </div>

          <div *ngIf="detailLoading()" style="text-align:center;padding:20px;color:#64748b;font-size:.875rem">
            Loading full details...
          </div>

          <div class="detail-grid">
            <div class="detail-section-title">Booking Info</div>
            <div class="detail-row">
              <span class="detail-key">Booking ID</span>
              <span>#{{ selectedBooking()?.bookingId }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-key">Status</span>
              <span [class]="getStatusClass(selectedBooking()?.bookingStatus)">
                {{ getStatusLabel(selectedBooking()?.bookingStatus) }}
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-key">Booked On</span>
              <span>{{ selectedBooking()?.bookingDate | date:'mediumDate' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-key">Seats</span>
              <span>{{ selectedBooking()?.numberOfSeats }}</span>
            </div>

            <div class="detail-section-title">Journey Info</div>
            <div class="detail-row">
              <span class="detail-key">Source</span>
              <span>{{ selectedBooking()?.source || '—' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-key">Destination</span>
              <span>{{ selectedBooking()?.destination || '—' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-key">Travel Date</span>
              <span>{{ selectedBooking()?.travelDate ? (selectedBooking()?.travelDate | date:'mediumDate') : '—' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-key">Departure</span>
              <span>{{ selectedBooking()?.departureTime || '—' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-key">Arrival</span>
              <span>{{ selectedBooking()?.arrivalTime || '—' }}</span>
            </div>

            <div class="detail-section-title">Bus Info</div>
            <div class="detail-row">
              <span class="detail-key">Bus Number</span>
              <span>{{ selectedBooking()?.busNumber || '—' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-key">Bus Type</span>
              <span>{{ selectedBooking()?.busType || '—' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-key">Operator</span>
              <span>{{ selectedBooking()?.operatorName || '—' }}</span>
            </div>

            <div class="detail-section-title">Fare Breakdown</div>
            <div class="detail-row">
              <span class="detail-key">Seat Fare</span>
              <span>₹{{ selectedBooking()?.totalAmount }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-key">GST & Taxes (6%)</span>
              <span>₹{{ getTax(selectedBooking()?.totalAmount ?? 0) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-key">Convenience Fee</span>
              <span>₹{{ CONVENIENCE_FEE }}</span>
            </div>
            <div class="detail-row" style="font-weight:700;font-size:.95rem">
              <span class="detail-key">Total Paid</span>
              <span style="color:#0A1F44">₹{{ getGrandTotal(selectedBooking()?.totalAmount ?? 0) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Refund Modal -->
      <div class="modal-overlay" *ngIf="showRefundModal()" (click)="showRefundModal.set(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Confirm Refund</h3>
            <button class="close-btn" (click)="showRefundModal.set(false)">✕</button>
          </div>
          <form [formGroup]="refundForm" (ngSubmit)="confirmRefund()" class="modal-form">
            <label class="form-label">Refund ID *
              <input class="form-input" type="number" formControlName="refundId" placeholder="Enter refund ID" />
            </label>
            <label class="form-label">Decision *
              <select class="form-input" formControlName="isApproved">
                <option [ngValue]="true">Approve Refund</option>
                <option [ngValue]="false">Reject Refund</option>
              </select>
            </label>
            <label class="form-label">Reason
              <input class="form-input" formControlName="reason" placeholder="Reason for decision" />
            </label>
            <div class="modal-actions">
              <button type="button" class="btn-secondary" (click)="showRefundModal.set(false)">Cancel</button>
              <button type="submit" class="btn-primary" [disabled]="saving()">{{ saving() ? 'Processing...' : 'Submit' }}</button>
            </div>
            <div *ngIf="formError()" class="error-box" style="margin-top:8px">{{ formError() }}</div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-header{display:flex;align-items:center;gap:16px;margin-bottom:16px}
    .page-heading{font-size:1.4rem;font-weight:700;color:#0A1F44;margin:0}
    .filter-row{display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap}
    .search-input,.filter-select{border:1.5px solid #e2e8f0;border-radius:8px;padding:9px 14px;font-size:.875rem;outline:none}
    .search-input{flex:1;min-width:200px}
    .search-input:focus,.filter-select:focus{border-color:#3b82f6}
    .btn-primary{background:#1d4ed8;color:#fff;border:none;padding:9px 18px;border-radius:8px;cursor:pointer;font-size:.875rem}
    .btn-primary:disabled{opacity:.6;cursor:not-allowed}
    .btn-secondary{background:#f1f5f9;color:#374151;border:none;padding:9px 18px;border-radius:8px;cursor:pointer;font-size:.875rem}
    .btn-view{background:#f0fdf4;color:#16a34a;border:none;padding:5px 10px;border-radius:6px;cursor:pointer;font-size:.8rem;margin-right:4px}
    .btn-cancel{background:#fee2e2;color:#dc2626;border:none;padding:5px 10px;border-radius:6px;cursor:pointer;font-size:.8rem;margin-right:4px}
    .btn-refund{background:#fff7ed;color:#ea580c;border:none;padding:5px 10px;border-radius:6px;cursor:pointer;font-size:.8rem}
    .table-wrap{background:#fff;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,.06);overflow:auto}
    .data-table{width:100%;border-collapse:collapse;font-size:.875rem}
    .data-table th{background:#f8fafc;padding:12px 16px;text-align:left;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;white-space:nowrap}
    .data-table td{padding:12px 16px;border-bottom:1px solid #f1f5f9;color:#1e293b}
    .data-table tr:last-child td{border-bottom:none}
    .status-chip{padding:3px 10px;border-radius:20px;font-size:.75rem;font-weight:500}
    .status-confirmed{background:#dcfce7;color:#16a34a}
    .status-pending{background:#fef9c3;color:#ca8a04}
    .status-cancelled{background:#fee2e2;color:#dc2626}
    .status-expired{background:#fff3e0;color:#e65100}
    .status-failed{background:#fce7f3;color:#9d174d}
    .status-default{background:#f1f5f9;color:#64748b}
    .tax-note{font-size:.7rem;color:#64748b;margin-left:2px;}
    .empty-row{text-align:center;color:#94a3b8;padding:32px!important}
    .info-box{padding:12px 16px;background:#eff6ff;border-radius:8px;color:#1d4ed8;font-size:.875rem;margin-bottom:16px}
    .error-box{padding:12px 16px;background:#fee2e2;border-radius:8px;color:#dc2626;font-size:.875rem;margin-bottom:16px}
    .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:100}
    .modal{background:#fff;border-radius:14px;padding:24px;width:480px;max-width:95vw;max-height:90vh;overflow-y:auto}
    .modal-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}
    .modal-header h3{font-size:1.1rem;font-weight:600;margin:0;color:#0A1F44}
    .close-btn{background:none;border:none;cursor:pointer;font-size:1.1rem;color:#64748b}
    .detail-section-title{font-size:.72rem;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;padding:10px 0 4px;border-bottom:1px solid #f1f5f9;margin-bottom:2px;}
    .detail-grid{display:flex;flex-direction:column;gap:10px}
    .detail-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:.875rem}
    .detail-key{color:#64748b;font-weight:500}
    .modal-form{display:flex;flex-direction:column;gap:14px}
    .form-label{display:flex;flex-direction:column;gap:5px;font-size:.85rem;font-weight:500;color:#374151}
    .form-input{border:1.5px solid #e2e8f0;border-radius:8px;padding:9px 12px;font-size:.875rem;outline:none}
    .form-input:focus{border-color:#3b82f6}
    .modal-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:4px}
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
export class AdminBookings implements OnInit {
  private bookingService = inject(BookingService);
  private paymentService = inject(PaymentService);
  private fb = inject(FormBuilder);

  bookings        = signal<any[]>([]);
  filteredBookings = signal<any[]>([]);
  selectedBooking = signal<any>(null);
  showRefundModal = signal(false);
  loading         = signal(true);
  error           = signal<string | null>(null);
  saving          = signal(false);
  formError       = signal<string | null>(null);
  detailLoading   = signal(false);
  detailError     = signal<string | null>(null);
  searchQuery     = '';
  statusFilter    = '';

  // Pagination
  pageSize    = signal(10);
  currentPage = signal(1);
  totalCount  = signal(0);
  totalPages  = signal(0);

  readonly CONVENIENCE_FEE = 20;

  refundForm = this.fb.group({ refundId: [null], isApproved: [true], reason: [''] });

  ngOnInit() { this.loadBookings(); }

  loadBookings() {
    this.loading.set(true);
    this.bookingService.getAllBookings(this.currentPage(), this.pageSize()).subscribe({
      next: (r: any) => {
        const data = r.data?.items ?? (Array.isArray(r.data) ? r.data : []);
        this.bookings.set(data);
        this.updatePagination(r.data?.totalCount ?? data.length);
        this.applyFilter();
        this.loading.set(false);
      },
      error: e => { this.error.set(e?.error?.message || 'Failed to load bookings'); this.loading.set(false); }
    });
  }

  applyFilter() {
    let list = this.bookings();
    if (this.searchQuery) list = list.filter(b => String(b.bookingId).includes(this.searchQuery) || b.bookingStatus?.toLowerCase().includes(this.searchQuery));
    if (this.statusFilter) list = list.filter(b => b.bookingStatus === this.statusFilter);
    this.filteredBookings.set(list);
  }

  onSearch(e: Event) { this.searchQuery = (e.target as HTMLInputElement).value.toLowerCase(); this.applyFilter(); }
  onStatusFilter(e: Event) { this.statusFilter = (e.target as HTMLSelectElement).value; this.applyFilter(); }

  onPageSizeChange(e: Event) {
    this.pageSize.set(Number((e.target as HTMLSelectElement).value));
    this.currentPage.set(1);
    this.loadBookings();
  }

  viewBooking(b: any) {
    this.selectedBooking.set(b);
    this.detailLoading.set(true);
    this.detailError.set(null);
    this.bookingService.getBookingById(b.bookingId).subscribe({
      next: (r: any) => {
        this.selectedBooking.set({ ...b, ...(r?.data ?? r) });
        this.detailLoading.set(false);
      },
      error: () => {
        this.detailLoading.set(false);
        this.detailError.set('Could not load full booking details.');
      }
    });
  }

  cancelBooking(id: number) {
    if (!confirm('Cancel this booking?')) return;
    this.bookingService.cancelBooking(id).subscribe({
      next: () => { this.currentPage.set(1); this.loadBookings(); },
      error: e => alert(e?.error?.message || 'Cancel failed')
    });
  }

  openRefundModal(b: any) { this.refundForm.reset({ isApproved: true }); this.formError.set(null); this.showRefundModal.set(true); }

  confirmRefund() {
    this.saving.set(true); this.formError.set(null);
    const v = this.refundForm.value as any;
    this.paymentService.confirmRefund({ refundId: v.refundId, isApproved: v.isApproved, reason: v.reason }).subscribe({
      next: () => { this.saving.set(false); this.showRefundModal.set(false); this.loadBookings(); },
      error: e => { this.saving.set(false); this.formError.set(e?.error?.message || 'Refund failed'); }
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
    this.loadBookings();
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

  getTax(amount: number): number { return Math.round(amount * 0.06); }
  getGrandTotal(amount: number): number { return amount + this.getTax(amount) + this.CONVENIENCE_FEE; }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'confirmed':          return 'status-chip status-confirmed';
      case 'pending':            return 'status-chip status-pending';
      case 'paymentprocessing':  return 'status-chip status-pending';
      case 'expired':            return 'status-chip status-expired';
      case 'cancelled':          return 'status-chip status-cancelled';
      case 'paymentfailed':      return 'status-chip status-failed';
      default:                   return 'status-chip status-default';
    }
  }

  getStatusLabel(status: string): string {
    switch (status?.toLowerCase()) {
      case 'paymentprocessing': return 'Payment Processing';
      case 'paymentfailed':     return 'Payment Failed';
      default:                  return status;
    }
  }
}