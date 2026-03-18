import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Refund, RefundListResponse, RefundResponse } from '../models/payment.model';

export interface RefundRequest {
  bookingId: number;
  refundAmount: number;
  refundReason: string;
  refundMethod: string;
  transactionId?: string;
  remarks?: string;
}

@Injectable({ providedIn: 'root' })
export class RefundService {
  private readonly API = environment.apiBase;

  constructor(private http: HttpClient) {}

  createRefund(request: RefundRequest) {
    return this.http.post<RefundResponse>(`${this.API}/refunds/create`, request);
  }

  getAllRefunds(pageNumber = 1, pageSize = 10) {
    const params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());
    return this.http.post<RefundListResponse>(`${this.API}/refunds/get-all`, {}, { params });
  }

  getRefundById(refundId: number) {
    return this.http.post<RefundResponse>(`${this.API}/refunds/${refundId}`, {});
  }

  getBookingRefunds(bookingId: number, pageNumber = 1, pageSize = 10) {
    const params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());
    return this.http.post<RefundListResponse>(`${this.API}/refunds/booking-refunds/${bookingId}`, {}, { params });
  }
}