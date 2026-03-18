import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DestinationService {
  private readonly API = environment.apiBase;
  constructor(private http: HttpClient) {}

  getAllDestinations(pageNumber = 1, pageSize = 100) {
    return this.http.post<any>(`${this.API}/destinations/get-all`, { pageNumber, pageSize });
  }
  getDestinationById(id: number) {
    return this.http.post<any>(`${this.API}/destinations/${id}`, {});
  }
  createDestination(request: { destinationName: string; description: string }) {
    return this.http.post<any>(`${this.API}/destinations`, request);
  }
  updateDestination(id: number, request: { destinationName: string; description: string; isActive: boolean }) {
    return this.http.put<any>(`${this.API}/destinations/${id}`, request);
  }
  deleteDestination(id: number) {
    return this.http.delete<any>(`${this.API}/destinations/${id}`);
  }
}
