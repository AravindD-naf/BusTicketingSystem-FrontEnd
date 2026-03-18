import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly API = environment.apiBase;
  currentBooking = signal<any>(null);

  constructor(private http: HttpClient) {}

  // POST /api/v1/booking
  createBooking(request: { scheduleId: number; seatNumbers: string[] }) {
    return this.http.post<ApiResponse<any>>(`${this.API}/booking`, request);
  }

  // POST /api/v1/booking/my-bookings
  getUserBookings(pageNumber = 1, pageSize = 50) {
    return this.http.post<ApiResponse<any>>(`${this.API}/booking/my-bookings`, { pageNumber, pageSize });
  }

  // POST /api/v1/booking/{id}  ← backend uses POST not GET
  getBookingById(bookingId: number) {
    return this.http.post<ApiResponse<any>>(`${this.API}/booking/${bookingId}`, {});
  }

  // PUT /api/v1/booking/cancel/{id}
  cancelBooking(bookingId: number) {
    return this.http.put<ApiResponse<any>>(`${this.API}/booking/cancel/${bookingId}`, {});
  }

  // POST /api/v1/booking/get-all  (admin only)
  getAllBookings(pageNumber = 1, pageSize = 100) {
    return this.http.post<ApiResponse<any>>(`${this.API}/booking/get-all`, { pageNumber, pageSize });
  }

  // POST /api/v1/booking/schedules/search
  searchSchedules(fromCity: string, toCity: string, travelDate: string) {
    return this.http.post<ApiResponse<any[]>>(`${this.API}/booking/schedules/search`, { fromCity, toCity, travelDate });
  }

  // POST /api/v1/booking/schedules/get-all
  getAllSchedules(pageNumber = 1, pageSize = 100) {
    return this.http.post<ApiResponse<any>>(`${this.API}/booking/schedules/get-all`, { pageNumber, pageSize });
  }
}
