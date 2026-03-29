import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface InitiatePaymentRequest {
  bookingId: number;
  amount: number;
  paymentMethod: string;
  promoCode?: string;
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

  // ── Razorpay ──
  createRazorpayOrder(bookingId: number, amount: number) {
    return this.http.post<ApiResponse<any>>(`${this.API}/razorpay/create-order`, { bookingId, amount });
  }

  verifyAndConfirmRazorpay(bookingId: number, razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string, paymentMethod: string) {
    return this.http.post<ApiResponse<any>>(`${this.API}/razorpay/verify-and-confirm`, {
      bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentMethod
    });
  }

  // ── Payment ──
  initiatePayment(request: InitiatePaymentRequest) {
    return this.http.post<ApiResponse<any>>(`${this.API}/booking/payment/initiate`, request);
  }

  confirmPayment(request: ConfirmPaymentRequest) {
    return this.http.post<ApiResponse<any>>(`${this.API}/booking/payment/confirm`, request);
  }

  getPayment(paymentId: number) {
    return this.http.get<ApiResponse<any>>(`${this.API}/booking/payment/${paymentId}`);
  }

  // ── Promo ──
  validatePromoCode(code: string, bookingAmount: number) {
    return this.http.post<ApiResponse<any>>(`${this.API}/promo/validate`, { code, bookingAmount });
  }

  // ── Refund ──
  confirmRefund(request: ConfirmRefundRequest) {
    return this.http.post<ApiResponse<any>>(`${this.API}/booking/refund/confirm`, request);
  }

  getRefund(refundId: number) {
    return this.http.get<ApiResponse<any>>(`${this.API}/booking/refund/${refundId}`);
  }

  getRefundByBooking(bookingId: number) {
    return this.http.get<ApiResponse<any>>(`${this.API}/booking/${bookingId}/refund`);
  }
}
