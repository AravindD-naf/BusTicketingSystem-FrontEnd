import { BoardingPoint, DropPoint } from './seat.model';
import { Schedule } from './route.model';
import { Bus } from './bus.model';

export interface Payment {
  id?: string;
  paymentMethod?: string;
  status?: string;
}

export interface BookingRequest {
  scheduleId: number;
  seatIds: string[];
  passengerDetails: PassengerDetail[];
  boardingPointId: number;
  dropPointId: number;
  contactEmail: string;
  contactPhone: string;
  totalFare: number;
  whatsappUpdates?: boolean;
}

export interface PassengerDetail {
  name: string;
  age: number;
  gender: 'M' | 'F';
}

export interface BookingResponse {
  success: boolean;
  data: Booking;
  message: string;
}

export interface Booking {
  bookingId: number;
  bookingReference: string;
  scheduleId: number;
  userId: number;
  passengerDetails: PassengerDetail[];
  boardingPoint: BoardingPoint;
  dropPoint: DropPoint;
  contactEmail: string;
  contactPhone: string;
  totalFare: number;
  bookingDate: string;
  status: string;
  schedule?: Schedule;
  bus?: Bus;
  seatIds?: string[];
  totalAmount?: number;
  boardingPointId?: number;
  dropPointId?: number;
  passengerName?: string;
  passengerEmail?: string;
  passengerPhone?: string;
  payment?: Payment;
}

export interface UserBookingsResponse {
  success: boolean;
  data: Booking[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

// Frontend Models
export interface BookingSummary {
  busName: string;
  route: string;
  travelDate: string;
  boardingPoint: string;
  dropPoint: string;
  seatNumbers: string[];
  passengerCount: number;
  fareBreakdown: FareBreakdown;
  totalAmount: number;
}

export interface FareBreakdown {
  baseFare: number;
  tax: number;
  convenienceFee: number;
}