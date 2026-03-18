import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface AuditLogSearchRequest {
  pageNumber?: number;
  pageSize?: number;
  entityName?: string;
  userId?: number;
  fromDate?: string;
  toDate?: string;
}

@Injectable({ providedIn: 'root' })
export class AuditLogService {
  private readonly API = environment.apiBase;
  constructor(private http: HttpClient) {}

  // POST /api/v1/auditlogs/get-all  (Admin only)
  getAuditLogs(request: AuditLogSearchRequest = {}) {
    const body = {
      pageNumber: request.pageNumber ?? 1,
      pageSize: request.pageSize ?? 20,
      entityName: request.entityName,
      userId: request.userId,
      fromDate: request.fromDate ? request.fromDate + 'T00:00:00' : undefined,
      toDate: request.toDate ? request.toDate + 'T23:59:59' : undefined
    };
    return this.http.post<any>(`${this.API}/auditlogs/get-all`, body);
  }
}
