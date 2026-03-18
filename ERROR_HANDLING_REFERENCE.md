# Error Handling Architecture - Reference Guide

## 🎯 Overview

The BusMate frontend implements a comprehensive 5-layer error handling architecture that prevents crashes and provides clear error messages to users.

---

## 🏗️ Layer 1: Router Event Interception (Topmost Layer)

**File:** [src/app/core/services/router-error-handler.service.ts](src/app/core/services/router-error-handler.service.ts)

**Purpose:** Catch all router navigation events before they become unhandled rejections

**How it works:**
```typescript
@Injectable({ providedIn: 'root' })
export class RouterErrorHandlerService {
  constructor(private router: Router) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) { /* Log */ }
      if (event instanceof NavigationEnd) { /* Success */ }
      if (event instanceof NavigationError) { /* Suppress error */ }
      if (event instanceof NavigationCancel) { /* Auto-redirect */ }
    });
  }
}
```

**Key features:**
- Subscribes to ALL router events
- Fully suppresses NavigationError events (prevents them from becoming unhandled rejections)  
- Auto-redirects protected route blocks to login (`/auth?tab=login`)
- Uses setTimeout to avoid ExpressionChangedAfterCheckError

**Catches:**
- ✅ "NoMatch" routing errors
- ✅ Navigation denials from guards
- ✅ All router-level errors

---

## 🏗️ Layer 2: HTTP Error Handling (Second Layer)

**File:** [src/app/core/services/http-error-handler.service.ts](src/app/core/services/http-error-handler.service.ts)

**Purpose:** Provide centralized, consistent HTTP error handling across the app

**How it works:**
```typescript
@Injectable({ providedIn: 'root' })
export class HttpErrorHandlerService {
  handleError(error: HttpErrorResponse, context: string): Observable<never> {
    if (error.status === 0) return throwError(() => CONNECTION_ERROR);
    if (error.status === 401) return throwError(() => UNAUTHORIZED);
    if (error.status === 403) return throwError(() => FORBIDDEN);
    if (error.status === 404) return throwError(() => NOT_FOUND);
    // ... more status codes
  }
}
```

**Status codes handled:**
- `0` - Connection refused (ERR_CONNECTION_REFUSED)
- `401` - Unauthorized (token expired/invalid)
- `403` - Forbidden (no permission)
- `404` - Not found
- `500`, `502`, `503` - Server errors

**Returns:** Typed error object with:
```typescript
{
  type: string,      // Error category: 'CONNECTION_ERROR', 'UNAUTHORIZED', etc
  message: string,   // User-friendly message
  details: {         // Technical details for debugging
    status, statusText, url, message, timestamp
  }
}
```

**Catches:**
- ✅ Network connection failures
- ✅ HTTP response errors
- ✅ Server errors

---

## 🏗️ Layer 3: HTTP Interceptor (Third Layer)

**File:** [src/app/core/interceptors/auth.interceptor.ts](src/app/core/interceptors/auth.interceptor.ts)

**Purpose:** Intercept all HTTP requests and responses, attach Bearer tokens, handle errors

**How it works:**
```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).token;
  const errorHandler = inject(HttpErrorHandlerService);
  
  // Add Bearer token to request
  const cloned = req.clone({ 
    setHeaders: { Authorization: `Bearer ${token}` } 
  });

  // Handle response and errors
  return next(cloned).pipe(
    catchError((error: HttpErrorResponse) => {
      return errorHandler.handleError(error, `${req.method} ${req.url}`);
    })
  );
};
```

**Responsibilities:**
- ✅ Add Bearer authentication to every request
- ✅ Skip auth headers for auth endpoints
- ✅ Catch HTTP errors immediately
- ✅ Delegate to HttpErrorHandlerService

---

## 🏗️ Layer 4: Global Error Handler (Fourth Layer)

**File:** [src/app/app.config.ts](src/app/app.config.ts)

**Purpose:** Provide app-wide error handling and ensure proper initialization

**How it works:**
```typescript
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: Error | HttpErrorResponse): void {
    // Ignore routing/navigation errors - they are handled by RouterErrorHandlerService
    if (this.isRoutingError(error)) {
      console.debug('Routing error handled by RouterErrorHandlerService');
      return;
    }
    
    // Log actual application errors
    console.error('Application error:', error);
  }
}

export const appConfig = {
  providers: [
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    RouterErrorHandlerService,
    { provide: APP_INITIALIZER, useFactory: initializeRouterErrorHandler }
  ]
};
```

**Features:**
- ✅ Filters and suppresses routing errors (handled by layer 1)
- ✅ Logs actual application errors  
- ✅ APP_INITIALIZER ensures RouterErrorHandlerService runs before any navigation
- ✅ Prevents ErrorHandler from interfering with routing

---

## 🏗️ Layer 5: Window Unhandled Rejection Listener (Fallback Layer)

**File:** [src/main.ts](src/main.ts)

**Purpose:** Final safety net for any unhandled promise rejections that escape all other layers

**How it works:**
```typescript
// In main.ts, before bootstrapApplication()
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.type === 'NavigationSkipped' || 
      event.reason?.message?.includes('Navigation')) {
    event.preventDefault();
    return;
  }
  
  console.error('Unhandled rejection:', event.reason);
});
```

**Purpose:**
- ✅ Catches navigation-related unhandled rejections
- ✅ Suppresses them to prevent debugger pause
- ✅ Logs other unhandled rejections for debugging

---

## 📊 Error Handling Flow Diagram

```
User Action (e.g., Click Login Button)
    ↓
Component calls router.navigate() or auth API
    ├─ Router Navigation?
    │   ├─ Routes to protected page while not authenticated?
    │   │   └─ Auth Guard returns false
    │   │       └─ Router emits NavigationCancel event
    │   │           └─ (Layer 1) RouterErrorHandlerService catches it
    │   │               └─ Auto-redirects to /auth
    │   └─ Other routing error?
    │       └─ Router emits NavigationError event
    │           └─ (Layer 1) RouterErrorHandlerService suppresses it
    │
    ├─ HTTP Request?
    │   ├─ Request made through HttpClient
    │   │   └─ (Layer 3) authInterceptor adds Bearer token
    │   └─ Response returns error?
    │       └─ (Layer 3) authInterceptor catches error
    │           └─ (Layer 2) HttpErrorHandlerService processes it
    │               ├─ Connection error (status 0)?
    │               │   └─ Return CONNECTION_ERROR response
    │               ├─ Auth error (status 401)?
    │               │   └─ Return UNAUTHORIZED response
    │               └─ Other?
    │                   └─ Return appropriate error

No unhandled rejection
    ↓
Component receives error
    ↓
Component displays user-friendly error message
    ↓
User sees clear error and can retry
```

---

## 🔄 Component-Level Error Handling

**File:** All component files that use `router.navigate()` or `http` calls

**Pattern:**
```typescript
// Navigation with error handling
async proceedToPayment(): Promise<void> {
  try {
    await this.router.navigate(['/payment']);
  } catch (err) {
    console.error('Navigation failed:', err);
    // Component-level error handling (defensive measure)
  }
}

// Or using .catch()
proceedToPayment(): void {
  this.router.navigate(['/payment']).catch(err => {
    console.error('Navigation failed:', err);
  });
}

// HTTP calls with error handling  
this.bookingService.createBooking(data).subscribe({
  next: (response) => {
    // Success - navigate to confirmation
    this.router.navigate(['/booking-confirmation']);
  },
  error: (error) => {
    const message = this.errorHandler.getErrorMessage(error);
    this.showErrorAlert(message);
  }
});
```

**Applied to:**
- booking-review.ts
- payment.ts
- seat-selection.ts
- search-results.ts
- booking-confirmation.ts
- my-bookings.ts
- search-form.ts
- And 5+ other components

---

## 🧪 Error Handling in Action

### Scenario 1: User clicks Login with Backend NOT Running

```
1. User clicks "Login" button
2. Component calls authService.login(credentials)
3. HTTP GET /auth/login is made to https://localhost:5001/api/v1.0/auth/login
4. Browser cannot connect (no server running)
5. Network error occurs with status: 0
6. authInterceptor catches error
7. Calls httpErrorHandler.handleError()
8. Returns: {
     type: 'CONNECTION_ERROR',
     message: 'Cannot connect to backend. Please ensure the API server...'
   }
9. Component receives error
10. Displays message to user
11. App remains stable (no crash)
```

### Scenario 2: User tries to access Protected Route without Auth

```
1. User navigates to /seat-selection (protected route)
2. Router triggers navigationStart event
3. authGuard checks auth.isAuthenticated() → false
4. Guard returns false (blocks navigation)
5. Router emits NavigationCancel event
6. RouterErrorHandlerService catches NavigationCancel
7. Service calls router.navigate(['/auth?tab=login'])
8. User redirected to login page
9. No unhandled rejection (Layer 1 suppressed it)
```

### Scenario 3: Network Error During Booking

```
1. User submits booking
2. HTTP POST /bookings is made
3. Network interruption occurs
4. Status: 0 (connection refused)
5. authInterceptor catches via catchError operator
6. HttpErrorHandlerService.handleError() called
7. Returns CONNECTION_ERROR response
8. Component receives error with message
9. Shows: "Network error. Please check your connection."
10. User can retry
```

---

## 🛠️ Debugging Tips

### 1. View Router Events
```typescript
// In any service/component
constructor(router: Router) {
  router.events.subscribe(event => console.log(event));
}
// Look for: NavigationStart, NavigationEnd, NavigationError, NavigationCancel
```

### 2. View HTTP Errors
```typescript
// In browser console (F12 → Network tab)
// Look for failed requests to /api/v1.0
// Check response status and error message
```

### 3. View Application Errors
```typescript
// In browser console (F12 → Console tab)
// Look for error logs from GlobalErrorHandler
// Look for unhandled rejection messages
```

### 4. Disable Error Suppression (For Debugging)
```typescript
// In router-error-handler.service.ts, comment out error handling to see actual errors:
// if (event instanceof NavigationError) {
//   // event.preventDefault(); // Let error propagate for debugging
// }
```

---

## 📋 Error Type Reference

### Connection Errors
```
Status Code: 0
Type: CONNECTION_ERROR
Message: "Cannot connect to backend. Please ensure the API server is running at ..."
Cause: Backend server not running or unreachable
Solution: Start backend server at localhost:5001
```

### Authentication Errors
```
Status Code: 401
Type: UNAUTHORIZED
Message: "Your session has expired. Please log in again."
Cause: Token invalid/expired or credentials wrong
Solution: User logs in again
```

### Permission Errors
```
Status Code: 403
Type: FORBIDDEN  
Message: "You do not have permission to perform this action."
Cause: User lacks required role/permissions
Solution: User does not have access to this feature
```

### Not Found Errors
```
Status Code: 404
Type: NOT_FOUND
Message: "The requested resource was not found."
Cause: Endpoint doesn't exist or resource deleted
Solution: Check API endpoint exists on backend
```

### Server Errors
```
Status Code: 500, 502, 503
Type: SERVER_ERROR
Message: "Server error. Please try again later."
Cause: Backend server internal error
Solution: Check backend logs, restart if needed
```

### Navigation Errors
```
Router Event: NavigationError
Type: (Suppressed by RouterErrorHandlerService)
Cause: Navigation blocked or routing error
Solution: Automatically handled by error service
```

---

## ✅ Checklist for Adding New Features

When adding new features that involve:
- [ ] Navigation? → Use `router.navigate()` with `.catch()` handler
- [ ] HTTP calls? → Use HttpClient (interceptor handles errors automatically)
- [ ] Guard logic? → Return boolean only, let RouterErrorHandlerService handle redirect
- [ ] Error displays? → Use `httpErrorHandler.getErrorMessage(error)` for user messages
- [ ] Async operations? → Return Promise/Observable with proper error handling

---

## 🎓 Architecture Benefits

✅ **Single Point of Error Handling** - All errors flow through HttpErrorHandlerService
✅ **Consistent Error Format** - Same error structure everywhere
✅ **User-Friendly Messages** - Technical errors converted to clear messages
✅ **No Debugger Pauses** - All promise rejections properly handled
✅ **App Stability** - One error doesn't crash entire app
✅ **Easy Debugging** - Detailed error logging for developers
✅ **Testable** - Error services can be mocked for unit tests
✅ **Maintainable** - Changes to error handling in one place

---

**Reference built 2025-03-15** | For more info see [ERROR_RESOLUTION_SUMMARY.md](ERROR_RESOLUTION_SUMMARY.md)
