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