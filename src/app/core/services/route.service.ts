import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface RouteCreateRequest {
  source: string;
  destination: string;
  distance: number;
  estimatedTravelTimeMinutes: number;
  baseFare: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

@Injectable({ providedIn: 'root' })
export class RouteService {
  private readonly API = environment.apiBase;

  constructor(private http: HttpClient) {}

  // POST /api/v1/routes/get-all
  getAllRoutes(pageNumber = 1, pageSize = 10) {
    return this.http.post<ApiResponse<any>>(`${this.API}/routes/get-all`, { pageNumber, pageSize });
  }

  // POST /api/v1/routes/{id}
  getRouteById(id: number) {
    return this.http.post<ApiResponse<any>>(`${this.API}/routes/${id}`, {});
  }

  // POST /api/v1/routes  (Admin)
  createRoute(request: RouteCreateRequest) {
    return this.http.post<ApiResponse<any>>(`${this.API}/routes`, request);
  }

  // PUT /api/v1/routes/{id}  (Admin)
  updateRoute(id: number, request: Partial<RouteCreateRequest>) {
    return this.http.put<ApiResponse<any>>(`${this.API}/routes/${id}`, request);
  }

  // DELETE /api/v1/routes/{id}  (Admin)
  deleteRoute(id: number) {
    return this.http.delete<ApiResponse<any>>(`${this.API}/routes/${id}`);
  }

  // POST /api/v1/routes/search-by-source
  searchBySource(source: string, pageNumber = 1, pageSize = 10) {
    return this.http.post<ApiResponse<any[]>>(`${this.API}/routes/search-by-source`, { source, pageNumber, pageSize });
  }

  // POST /api/v1/routes/search-by-destination
  searchByDestination(destination: string, pageNumber = 1, pageSize = 10) {
    return this.http.post<ApiResponse<any[]>>(`${this.API}/routes/search-by-destination`, { destination, pageNumber, pageSize });
  }

  // POST /api/v1/routes/search
  searchRoutes(source: string, destination: string, pageNumber = 1, pageSize = 10) {
    return this.http.post<ApiResponse<any[]>>(`${this.API}/routes/search`, { source, destination, pageNumber, pageSize });
  }
}
