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

  filteredSchedules = computed(() => {
    const f = this.filter();
    let result = this.allSchedules().filter((schedule: any) => {

      // Bus type filter
      if (f.busTypes.length && !f.busTypes.includes(schedule.busType)) return false;

      // Operator filter
      if (f.operators.length && !f.operators.includes(schedule.operatorName)) return false;

      // Price filter
      if (f.maxPrice && (schedule.baseFare || 0) > f.maxPrice) return false;

      // Rating filter — treat missing/zero rating as 4.5 (unrated buses still show)
      if (f.minRating > 0) {
        const busRating = (schedule.rating && schedule.rating > 0) ? schedule.rating : 4.5;
        if (busRating < f.minRating) return false;
      }

      // Departure time filter
      if (f.departureTimes.length) {
        const dep = schedule.departureTime || '';
        const h = parseInt(dep.split(':')[0], 10);
        const matches = f.departureTimes.some((t: string) => {
          if (t === 'morning')   return h >= 6  && h < 12;
          if (t === 'afternoon') return h >= 12 && h < 18;
          if (t === 'evening')   return h >= 18 && h < 22;
          if (t === 'night')     return h >= 22 || h < 6;
          return false;
        });
        if (!matches) return false;
      }

      return true;
    });

    const sort = this.sortBy();

    // Helper: parse "HH:MM:SS" or "H:MM:SS" to total minutes
    const toMins = (t: string): number => {
        if (!t) return 0;
        const p = t.split(':');
        return parseInt(p[0], 10) * 60 + parseInt(p[1] || '0', 10);
    };

    // Use durationMinutes from backend (already computed correctly for overnight journeys)
    // Fall back to computing from dep/arr if field not present
    const getDuration = (s: any): number =>
      s.durationMinutes > 0
        ? s.durationMinutes
        : (() => {
            const dep = toMins(s.departureTime);
            const arr = toMins(s.arrivalTime);
            const diff = arr - dep;
            return diff < 0 ? diff + 24 * 60 : diff;
          })();

    return [...result].sort((a: any, b: any) => {
      if (sort === 'price_asc')  return (a.baseFare || 0) - (b.baseFare || 0);
      if (sort === 'price_desc') return (b.baseFare || 0) - (a.baseFare || 0);
      if (sort === 'departure')  return toMins(a.departureTime) - toMins(b.departureTime);
      if (sort === 'arrival')    return toMins(a.arrivalTime)   - toMins(b.arrivalTime);
      if (sort === 'duration')   return getDuration(a) - getDuration(b);
      return 0;
    });
  });

  updateFilter(partial: Partial<BusFilter>) {
    this.filter.update(f => ({ ...f, ...partial }));
  }

  updateSort(sort: SortOption) {
    this.sortBy.set(sort);
  }

  // POST /api/v1/booking/schedules/search
  search(fromCity: string, toCity: string, travelDate: string, passengers: number = 1) {
    return this.http.post<ApiResponse<any[]>>(`${this.API}/booking/schedules/search`, {
      fromCity,
      toCity,
      travelDate
    }).pipe(
      tap(response => {
        if (response.success && Array.isArray(response.data)) {
          this.allSchedules.set(response.data);
        } else {
          this.allSchedules.set([]);
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
