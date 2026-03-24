import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { BusFilter, SortOption } from '../models/filter.model';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class BusSearchService {
  private readonly API = environment.apiBase;

  constructor(private http: HttpClient) {}

  allSchedules = signal<any[]>([]);
  filter = signal<BusFilter>({
    busTypes: [],
    maxPrice: 3000,
    departureTimes: [],
    operators: [],
    minRating: 0
  });
  sortBy = signal<SortOption>('departure');
  pageNumber = signal(1);
  pageSize   = signal(20);
  totalCount = signal(0);

  

  updateFilter(partial: Partial<BusFilter>) {
    this.filter.update(f => ({ ...f, ...partial }));
    this.pageNumber.set(1);
  }

  updateSort(sort: SortOption) {
    this.sortBy.set(sort);
    this.pageNumber.set(1);
  }

  // POST /api/v1/booking/schedules/search
  search(fromCity: string, toCity: string, travelDate: string, passengers: number = 1) {
    const f = this.filter();
    const body = {
      fromCity,
      toCity,
      travelDate,
      busTypes:       f.busTypes.length       ? f.busTypes       : undefined,
      maxPrice:       f.maxPrice < 3000       ? f.maxPrice       : undefined,
      departureTimes: f.departureTimes.length ? f.departureTimes : undefined,
      operators:      f.operators.length      ? f.operators      : undefined,
      minRating:      f.minRating > 0         ? f.minRating      : undefined,
      sortBy:         this.sortBy(),
      pageNumber:     this.pageNumber(),
      pageSize:       this.pageSize()
    };
    return this.http.post<ApiResponse<any>>(`${this.API}/booking/schedules/search`, body).pipe(
      tap(response => {
        if (response.success) {
          const data = response.data;
          // Handle both paged { items, totalCount } and plain array responses
          const items = Array.isArray(data) ? data : (data?.items ?? []);
          this.allSchedules.set(items);
          this.totalCount.set(Array.isArray(data) ? items.length : (data?.totalCount ?? items.length));
        } else {
          this.allSchedules.set([]);
          this.totalCount.set(0);
        }
      })
    );
  }

  // ── Bus Management (Admin) ──

  // POST /api/v1/buses  (Admin create)
  createBus(request: { busNumber: string; busType: string; totalSeats: number; operatorName: string }) {
    return this.http.post<ApiResponse<any>>(`${this.API}/buses`, request);
  }

  // POST /api/v1/buses/get-all
  getAllBuses(pageNumber = 1, pageSize = 10) {
    return this.http.post<ApiResponse<any>>(`${this.API}/buses/get-all`, { pageNumber, pageSize });
  }

  // POST /api/v1/buses/{id}
  getBusById(busId: number) {
    return this.http.post<ApiResponse<any>>(`${this.API}/buses/${busId}`, {});
  }

  // PUT /api/v1/buses/{id}
  updateBus(busId: number, request: any) {
    return this.http.put<ApiResponse<any>>(`${this.API}/buses/${busId}`, request);
  }

  // DELETE /api/v1/buses/{id}
  deleteBus(busId: number) {
    return this.http.delete<ApiResponse<any>>(`${this.API}/buses/${busId}`);
  }

  // POST /api/v1/buses/search-by-operator
  searchBusesByOperator(operatorName: string, pageNumber = 1, pageSize = 10) {
    return this.http.post<ApiResponse<any>>(`${this.API}/buses/search-by-operator`, { operatorName, pageNumber, pageSize });
  }

  // ── Schedule Management (Admin) ──

  // POST /api/v1/schedule  (Admin create)
  createSchedule(dto: { routeId: number; busId: number; travelDate: string; departureTime: string; arrivalTime: string }) {
    return this.http.post<ApiResponse<any>>(`${this.API}/schedule`, dto);
  }

  // POST /api/v1/schedule/get-all
  getAllSchedules(pageNumber = 1, pageSize = 10) {
    return this.http.post<ApiResponse<any>>(`${this.API}/schedule/get-all`, { pageNumber, pageSize });
  }

  // POST /api/v1/schedule/search-admin  (keyword search with pagination)
  searchSchedules(keyword: string, pageNumber = 1, pageSize = 10) {
    return this.http.post<ApiResponse<any>>(`${this.API}/schedule/get-all`, { pageNumber, pageSize, keyword });
  }

  // POST /api/v1/schedule/{id}
  getScheduleById(scheduleId: number) {
    return this.http.post<ApiResponse<any>>(`${this.API}/schedule/${scheduleId}`, {});
  }

  // PUT /api/v1/schedule/{id}
  updateSchedule(scheduleId: number, dto: any) {
    return this.http.put<ApiResponse<any>>(`${this.API}/schedule/${scheduleId}`, dto);
  }

  // DELETE /api/v1/schedule/{id}
  deleteSchedule(scheduleId: number) {
    return this.http.delete<ApiResponse<any>>(`${this.API}/schedule/${scheduleId}`);
  }

  // POST /api/v1/schedule/search
  searchSchedulesByCity(fromCity: string, toCity: string, travelDate: string) {
    return this.http.post<ApiResponse<any[]>>(`${this.API}/schedule/search`, { fromCity, toCity, travelDate });
  }
}
