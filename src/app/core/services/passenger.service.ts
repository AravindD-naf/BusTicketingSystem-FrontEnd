import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface PassengerDetail {
  seatNumber: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  email?: string;
  idType?: string;
  idNumber?: string;
  age: number;
  specialRequirements?: string;
}

export interface AddPassengerRequest {
  bookingId: number;
  passengers: PassengerDetail[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

@Injectable({ providedIn: 'root' })
export class PassengerService {
  private readonly API = environment.apiBase;

  constructor(private http: HttpClient) {}

  // POST /api/v1/booking/passengers
  addPassengers(request: AddPassengerRequest) {
    return this.http.post<ApiResponse<any>>(`${this.API}/booking/passengers`, request);
  }

  // GET /api/v1/booking/{bookingId}/passengers
  getBookingPassengers(bookingId: number) {
    return this.http.get<ApiResponse<any[]>>(`${this.API}/booking/${bookingId}/passengers`);
  }
}
