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
        <span class="total-badge">Total: {{ bookings().length }}</span>
      </div>

      <div class="filter-row">
        <input class="search-input" placeholder="Search by booking ID, status..." (input)="onSearch($event)" />
        <select class="filter-select" (change)="onStatusFilter($event)">
          <option value="">All Status</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Pending">Pending</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      <div *ngIf="loading()" class="info-box">Loading bookings...</div>
      <div *ngIf="error()" class="error-box">{{ error() }}</div>

      <div class="table-wrap" *ngIf="!loading()">
        <table class="data-table">
          <thead>
            <tr><th>ID</th><th>Booking ID</th><th>Schedule</th><th>Seats</th><th>Total (₹)</th><th>Date</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let b of filteredBookings(); let i = index">
              <td>{{ i + 1 }}</td>
              <td><strong>#{{ b.bookingId }}</strong></td>
              <td>{{ b.scheduleId }}</td>
              <td>{{ b.numberOfSeats || '—' }}</td>
              <td>₹{{ b.totalAmount }}</td>
              <td>{{ b.bookingDate | date:'mediumDate' }}</td>
              <td><span class="status-chip" [class]="getStatusClass(b.bookingStatus)">{{ b.bookingStatus }}</span></td>
              <td>
                <button class="btn-view" (click)="viewBooking(b)">👁️ View</button>
                <button class="btn-cancel" *ngIf="b.bookingStatus === 'Confirmed'" (click)="cancelBooking(b.bookingId)">❌ Cancel</button>
                <button class="btn-refund" *ngIf="b.bookingStatus === 'Cancelled'" (click)="openRefundModal(b)">💰 Refund</button>
              </td>
            </tr>
            <tr *ngIf="filteredBookings().length === 0">
              <td colspan="8" class="empty-row">No bookings found.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- View Modal -->
      <div class="modal-overlay" *ngIf="selectedBooking()" (click)="selectedBooking.set(null)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Booking #{{ selectedBooking()?.bookingId }} Details</h3>
            <button class="close-btn" (click)="selectedBooking.set(null)">✕</button>
          </div>
          <div class="detail-grid">
            <div class="detail-row"><span class="detail-key">Booking ID</span><span>{{ selectedBooking()?.bookingId }}</span></div>
            <div class="detail-row"><span class="detail-key">Schedule ID</span><span>{{ selectedBooking()?.scheduleId }}</span></div>
            <div class="detail-row"><span class="detail-key">Seats</span><span>{{ selectedBooking()?.numberOfSeats }}</span></div>
            <div class="detail-row"><span class="detail-key">Total Amount</span><span>₹{{ selectedBooking()?.totalAmount }}</span></div>
            <div class="detail-row"><span class="detail-key">Status</span><span class="status-chip" [class]="getStatusClass(selectedBooking()?.bookingStatus)">{{ selectedBooking()?.bookingStatus }}</span></div>
            <div class="detail-row"><span class="detail-key">Source</span><span>{{ selectedBooking()?.source || '—' }}</span></div>
            <div class="detail-row"><span class="detail-key">Destination</span><span>{{ selectedBooking()?.destination || '—' }}</span></div>
            <div class="detail-row"><span class="detail-key">Travel Date</span><span>{{ selectedBooking()?.travelDate | date:'mediumDate' }}</span></div>
            <div class="detail-row"><span class="detail-key">Bus Number</span><span>{{ selectedBooking()?.busNumber || '—' }}</span></div>
            <div class="detail-row"><span class="detail-key">Operator</span><span>{{ selectedBooking()?.operatorName || '—' }}</span></div>
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
    .total-badge{background:#f1f5f9;color:#64748b;padding:4px 12px;border-radius:20px;font-size:.8rem}
    .filter-row{display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap}
    .search-input,.filter-select{border:1.5px solid #e2e8f0;border-radius:8px;padding:9px 14px;font-size:.875rem;outline:none}
    .search-input{flex:1;min-width:200px} .search-input:focus,.filter-select:focus{border-color:#3b82f6}
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
    .status-confirmed{background:#dcfce7;color:#16a34a} .status-pending{background:#fef9c3;color:#ca8a04}
    .status-cancelled{background:#fee2e2;color:#dc2626} .status-default{background:#f1f5f9;color:#64748b}
    .empty-row{text-align:center;color:#94a3b8;padding:32px!important}
    .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:100}
    .modal{background:#fff;border-radius:14px;padding:24px;width:480px;max-width:95vw;max-height:90vh;overflow-y:auto}
    .modal-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}
    .modal-header h3{font-size:1.1rem;font-weight:600;margin:0;color:#0A1F44}
    .close-btn{background:none;border:none;cursor:pointer;font-size:1.1rem;color:#64748b}
    .detail-grid{display:flex;flex-direction:column;gap:10px}
    .detail-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:.875rem}
    .detail-key{color:#64748b;font-weight:500}
    .modal-form{display:flex;flex-direction:column;gap:14px}
    .form-label{display:flex;flex-direction:column;gap:5px;font-size:.85rem;font-weight:500;color:#374151}
    .form-input{border:1.5px solid #e2e8f0;border-radius:8px;padding:9px 12px;font-size:.875rem;outline:none}
    .form-input:focus{border-color:#3b82f6}
    .modal-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:4px}
    .info-box{padding:12px 16px;background:#eff6ff;border-radius:8px;color:#1d4ed8;font-size:.875rem;margin-bottom:16px}
    .error-box{padding:12px 16px;background:#fee2e2;border-radius:8px;color:#dc2626;font-size:.875rem;margin-bottom:16px}
    .duration-row{display:flex;gap:10px}
    .duration-field{display:flex;align-items:center;gap:6px;flex:1}
    .duration-unit{font-size:.82rem;color:#64748b;white-space:nowrap}
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
export class AdminBookings implements OnInit {
  private bookingService = inject(BookingService);
  private paymentService = inject(PaymentService);
  private fb = inject(FormBuilder);

  bookings = signal<any[]>([]);
  filteredBookings = signal<any[]>([]);
  selectedBooking = signal<any>(null);
  showRefundModal = signal(false);
  loading = signal(true);
  error = signal<string | null>(null);
  saving = signal(false);
  formError = signal<string | null>(null);
  searchQuery = '';
  statusFilter = '';

  refundForm = this.fb.group({ refundId: [null], isApproved: [true], reason: [''] });

  ngOnInit() { this.loadBookings(); }

  loadBookings() {
    this.loading.set(true);
    this.bookingService.getAllBookings(1, 200).subscribe({
      next: (r: any) => { const d = Array.isArray(r.data) ? r.data : []; this.bookings.set(d); this.applyFilter(); this.loading.set(false); },
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

  viewBooking(b: any) { this.selectedBooking.set(b); }

  cancelBooking(id: number) {
    if (!confirm('Cancel this booking?')) return;
    this.bookingService.cancelBooking(id).subscribe({ next: () => this.loadBookings(), error: e => alert(e?.error?.message || 'Cancel failed') });
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

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'confirmed': return 'status-chip status-confirmed';
      case 'pending': return 'status-chip status-pending';
      case 'cancelled': return 'status-chip status-cancelled';
      default: return 'status-chip status-default';
    }
  }
}
