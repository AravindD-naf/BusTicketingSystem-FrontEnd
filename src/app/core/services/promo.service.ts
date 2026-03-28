import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface PromoCode {
  promoCodeId: number;
  code: string;
  discountType: string;
  discountValue: number;
  maxDiscountAmount: number;
  minBookingAmount: number;
  validFrom: string;
  validUntil: string;
  maxUsageCount: number;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class PromoService {
  private readonly API = environment.apiBase;
  constructor(private http: HttpClient) {}

  getActive()           { return this.http.get<any>(`${this.API}/promo/active`); }
  getAll()              { return this.http.get<any>(`${this.API}/promo`); }
  create(body: any)     { return this.http.post<any>(`${this.API}/promo`, body); }
  update(id: number, body: any) { return this.http.put<any>(`${this.API}/promo/${id}`, body); }
  delete(id: number)    { return this.http.delete<any>(`${this.API}/promo/${id}`); }
  toggle(id: number)    { return this.http.patch<any>(`${this.API}/promo/${id}/toggle`, {}); }
}
