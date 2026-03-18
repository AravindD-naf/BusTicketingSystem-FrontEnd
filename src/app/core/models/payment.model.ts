// Payment Models
export interface Payment {
  paymentId: number;
  bookingId: number;
  amount: number;
  paymentMethod: string;
  transactionId: string;
  paymentStatus: string;
  paymentDate: string;
  remarks?: string;
}

export interface PaymentListResponse {
  success: boolean;
  message: string;
  data: Payment[];
  totalCount: number;
}

export interface PaymentResponse {
  success: boolean;
  message: string;
  data?: Payment;
}

// Refund Models
export interface Refund {
  refundId: number;
  bookingId: number;
  refundAmount: number;
  refundReason: string;
  refundMethod: string;
  transactionId: string;
  refundStatus: string;
  refundDate: string;
  remarks?: string;
}

export interface RefundListResponse {
  success: boolean;
  message: string;
  data: Refund[];
  totalCount: number;
}

export interface RefundResponse {
  success: boolean;
  message: string;
  data?: Refund;
}