import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface InitiatePaymentRequest {
  bookingId: number;
  amount: number;
  paymentMethod: string;
}

export interface ConfirmPaymentRequest {
  paymentId: number;
  transactionId: string;
  isSuccess: boolean;
  failureReason?: string;
}

export interface ConfirmRefundRequest {
  refundId: number;
  isApproved: boolean;
  reason?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly API = environment.apiBase;

  constructor(private http: HttpClient) {}

  // POST /api/v1/booking/payment/initiate
  initiatePayment(request: InitiatePaymentRequest) {
    return this.http.post<ApiResponse<any>>(`${this.API}/booking/payment/initiate`, request);
  }

  // POST /api/v1/booking/payment/confirm
  confirmPayment(request: ConfirmPaymentRequest) {
    return this.http.post<ApiResponse<any>>(`${this.API}/booking/payment/confirm`, request);
  }

  // GET /api/v1/booking/payment/{paymentId}
  getPayment(paymentId: number) {
    return this.http.get<ApiResponse<any>>(`${this.API}/booking/payment/${paymentId}`);
  }

  // POST /api/v1/booking/refund/confirm  (Admin only)
  confirmRefund(request: ConfirmRefundRequest) {
    return this.http.post<ApiResponse<any>>(`${this.API}/booking/refund/confirm`, request);
  }

  // GET /api/v1/booking/refund/{refundId}
  getRefund(refundId: number) {
    return this.http.get<ApiResponse<any>>(`${this.API}/booking/refund/${refundId}`);
  }

    // GET /api/v1/booking/{bookingId}/refund
  getRefundByBooking(bookingId: number) {
    return this.http.get<ApiResponse<any>>(`${this.API}/booking/${bookingId}/refund`);
  }
}
