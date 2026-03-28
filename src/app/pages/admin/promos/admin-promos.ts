import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { PromoService, PromoCode } from '../../../core/services/promo.service';

@Component({
  selector: 'app-admin-promos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-promos.html',
  styleUrl: './admin-promos.css'
})
export class AdminPromos implements OnInit {
  private promoService = inject(PromoService);
  private fb = inject(FormBuilder);

  promos    = signal<PromoCode[]>([]);
  loading   = signal(true);
  showForm  = signal(false);
  editId    = signal<number | null>(null);
  saving    = signal(false);
  error     = signal<string | null>(null);
  success   = signal<string | null>(null);

  form = this.fb.group({
    code:             ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    discountType:     ['Percentage', Validators.required],
    discountValue:    [null as number | null, [Validators.required, Validators.min(0.01)]],
    maxDiscountAmount:[0],
    minBookingAmount: [0],
    validFrom:        ['', Validators.required],
    validUntil:       ['', Validators.required],
    maxUsageCount:    [0],
    isActive:         [true]
  });

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.promoService.getAll().subscribe({
      next: r => { this.promos.set(r?.data ?? []); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openCreate() {
    this.editId.set(null);
    this.form.reset({ discountType: 'Percentage', maxDiscountAmount: 0, minBookingAmount: 0, maxUsageCount: 0, isActive: true });
    this.showForm.set(true);
    this.error.set(null);
  }

  openEdit(p: PromoCode) {
    this.editId.set(p.promoCodeId);
    this.form.patchValue({
      code: p.code,
      discountType: p.discountType,
      discountValue: p.discountValue,
      maxDiscountAmount: p.maxDiscountAmount,
      minBookingAmount: p.minBookingAmount,
      validFrom: p.validFrom.substring(0, 10),
      validUntil: p.validUntil.substring(0, 10),
      maxUsageCount: p.maxUsageCount,
      isActive: p.isActive
    });
    this.showForm.set(true);
    this.error.set(null);
  }

  closeForm() { this.showForm.set(false); this.editId.set(null); }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.error.set(null);
    const body = { ...this.form.value };
    const id = this.editId();
    const req = id ? this.promoService.update(id, body) : this.promoService.create(body);
    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.success.set(id ? 'Promo code updated.' : 'Promo code created.');
        this.closeForm();
        this.load();
        setTimeout(() => this.success.set(null), 3000);
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err?.error?.message || 'Failed to save promo code.');
      }
    });
  }

  toggle(p: PromoCode) {
    this.promoService.toggle(p.promoCodeId).subscribe({ next: () => this.load() });
  }

  delete(p: PromoCode) {
    if (!confirm(`Delete promo code "${p.code}"?`)) return;
    this.promoService.delete(p.promoCodeId).subscribe({
      next: () => { this.success.set('Deleted.'); this.load(); setTimeout(() => this.success.set(null), 2000); }
    });
  }

  formatDate(d: string) {
    return d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  }

  isExpired(p: PromoCode) { return new Date(p.validUntil) < new Date(); }
}
