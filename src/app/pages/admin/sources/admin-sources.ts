import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { SourceService } from '../../../core/services/source.service';

@Component({
  selector: 'app-admin-sources',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div>
      <div class="page-header">
        <h2 class="page-heading">Source Management</h2>
        <button class="btn-primary" (click)="openModal()">➕ Add Source</button>
      </div>

      <div *ngIf="loading()" class="info-box">Loading sources...</div>
      <div *ngIf="error()" class="error-box">{{ error() }}</div>

      <div class="table-wrap" *ngIf="!loading()">
        <table class="data-table">
          <thead>
            <tr><th>ID</th><th>Source Name</th><th>Description</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let s of sources(); let i = index">
              <td>{{ i + 1 }}</td>
              <td><strong>{{ s.sourceName }}</strong></td>
              <td>{{ s.description || '—' }}</td>
              <td><span class="status-chip" [class.active]="s.isActive !== false">{{ s.isActive !== false ? 'Active' : 'Inactive' }}</span></td>
              <td>
                <button class="btn-edit" (click)="editSource(s)">✏️ Edit</button>
                <button class="btn-delete" (click)="deleteSource(s.sourceId)">🗑️ Delete</button>
              </td>
            </tr>
            <tr *ngIf="sources().length === 0">
              <td colspan="5" class="empty-row">No sources found. Add a source to get started.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="modal-overlay" *ngIf="showModal()" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ editingId() ? 'Edit Source' : 'Add New Source' }}</h3>
            <button class="close-btn" (click)="closeModal()">✕</button>
          </div>
          <form [formGroup]="sourceForm" (ngSubmit)="saveSource()" class="modal-form">
            <label class="form-label">Source Name *
              <input class="form-input" formControlName="sourceName" placeholder="e.g. Chennai Central" />
              <span class="field-error" *ngIf="sourceForm.get('sourceName')?.invalid && sourceForm.get('sourceName')?.touched">Required</span>
            </label>
            <label class="form-label">Description
              <textarea class="form-input" formControlName="description" rows="3" placeholder="Optional description"></textarea>
            </label>
            <label class="form-label toggle-row" *ngIf="editingId()">
              <span>Active</span>
              <input type="checkbox" formControlName="isActive" />
            </label>
            <div class="modal-actions">
              <button type="button" class="btn-secondary" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn-primary" [disabled]="saving()">{{ saving() ? 'Saving...' : (editingId() ? 'Update' : 'Add Source') }}</button>
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
    .table-wrap{background:#fff;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,.06);overflow:hidden}
    .data-table{width:100%;border-collapse:collapse;font-size:.875rem}
    .data-table th{background:#f8fafc;padding:12px 16px;text-align:left;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0}
    .data-table td{padding:12px 16px;border-bottom:1px solid #f1f5f9;color:#1e293b}
    .data-table tr:last-child td{border-bottom:none}
    .status-chip{padding:3px 10px;border-radius:20px;font-size:.75rem;background:#fee2e2;color:#dc2626}
    .status-chip.active{background:#dcfce7;color:#16a34a}
    .empty-row{text-align:center;color:#94a3b8;padding:32px!important}
    .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:100}
    .modal{background:#fff;border-radius:14px;padding:24px;width:440px;max-width:95vw}
    .modal-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}
    .modal-header h3{font-size:1.1rem;font-weight:600;margin:0;color:#0A1F44}
    .close-btn{background:none;border:none;cursor:pointer;font-size:1.1rem;color:#64748b}
    .modal-form{display:flex;flex-direction:column;gap:14px}
    .form-label{display:flex;flex-direction:column;gap:5px;font-size:.85rem;font-weight:500;color:#374151}
    .toggle-row{flex-direction:row!important;align-items:center;justify-content:space-between}
    .form-input{border:1.5px solid #e2e8f0;border-radius:8px;padding:9px 12px;font-size:.875rem;outline:none;font-family:inherit;resize:vertical}
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
export class AdminSources implements OnInit {
  private sourceService = inject(SourceService);
  private fb = inject(FormBuilder);

  sources = signal<any[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  showModal = signal(false);
  saving = signal(false);
  formError = signal<string | null>(null);
  editingId = signal<number | null>(null);

  sourceForm = this.fb.group({ sourceName: ['', Validators.required], description: [''], isActive: [true] });

  ngOnInit() { this.loadSources(); }

  loadSources() {
    this.loading.set(true);
    this.sourceService.getAllSources(1, 200).subscribe({
      next: r => { this.sources.set(Array.isArray(r.data) ? r.data : []); this.loading.set(false); },
      error: e => { this.error.set(e?.error?.message || 'Failed to load sources'); this.loading.set(false); }
    });
  }

  openModal() { this.sourceForm.reset({ sourceName:'', description:'', isActive:true }); this.editingId.set(null); this.formError.set(null); this.showModal.set(true); }

  editSource(s: any) {
    this.editingId.set(s.sourceId);
    this.sourceForm.patchValue({ sourceName: s.sourceName, description: s.description, isActive: s.isActive !== false });
    this.formError.set(null); this.showModal.set(true);
  }

  closeModal() { this.showModal.set(false); this.editingId.set(null); }

  saveSource() {
    if (this.sourceForm.invalid) { this.sourceForm.markAllAsTouched(); return; }
    this.saving.set(true); this.formError.set(null);
    const v = this.sourceForm.value as any;
    const id = this.editingId();
    const req$ = id ? this.sourceService.updateSource(id, v) : this.sourceService.createSource(v);
    req$.subscribe({
      next: () => { this.saving.set(false); this.closeModal(); this.loadSources(); },
      error: e => { this.saving.set(false); this.formError.set(e?.error?.message || 'Save failed'); }
    });
  }

  deleteSource(id: number) {
    if (!confirm('Delete this source?')) return;
    this.sourceService.deleteSource(id).subscribe({ next: () => this.loadSources(), error: e => alert(e?.error?.message || 'Delete failed') });
  }
}
