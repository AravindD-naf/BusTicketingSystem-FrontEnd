import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SourceService {
  private readonly API = environment.apiBase;
  constructor(private http: HttpClient) {}

  getAllSources(pageNumber = 1, pageSize = 100) {
    return this.http.post<any>(`${this.API}/sources/get-all`, { pageNumber, pageSize });
  }
  getSourceById(id: number) {
    return this.http.post<any>(`${this.API}/sources/${id}`, {});
  }
  createSource(request: { sourceName: string; description: string }) {
    return this.http.post<any>(`${this.API}/sources`, request);
  }
  updateSource(id: number, request: { sourceName: string; description: string; isActive: boolean }) {
    return this.http.put<any>(`${this.API}/sources/${id}`, request);
  }
  deleteSource(id: number) {
    return this.http.delete<any>(`${this.API}/sources/${id}`);
  }
}
