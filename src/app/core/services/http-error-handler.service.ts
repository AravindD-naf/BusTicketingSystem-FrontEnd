import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { throwError, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class HttpErrorHandlerService {

  /**
   * Extract a user-friendly message from any error shape.
   * Handles HttpErrorResponse, backend ApiResponse errors, and plain strings.
   */
  getErrorMessage(error: any): string {
    if (!error) return 'An unexpected error occurred.';

    // Backend returns { success:false, message:"..." }
    if (error?.error?.message) return error.error.message;
    if (error?.message) return error.message;
    if (typeof error === 'string') return error;

    // Status-based fallbacks
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) return 'Cannot connect to server. Please ensure the backend is running.';
      if (error.status === 401) return 'Your session has expired. Please log in again.';
      if (error.status === 403) return 'You do not have permission to perform this action.';
      if (error.status === 404) return 'The requested resource was not found.';
      if (error.status === 409) return 'A conflict occurred. The resource may already exist.';
      if (error.status >= 500) return 'A server error occurred. Please try again later.';
    }

    return 'An unexpected error occurred. Please try again.';
  }

  handleError(error: any, context: string = ''): Observable<never> {
    const msg = this.getErrorMessage(error);
    if (error?.status !== 0) {
      console.error(`[${context}]`, msg, error);
    }
    return throwError(() => error);
  }
}
