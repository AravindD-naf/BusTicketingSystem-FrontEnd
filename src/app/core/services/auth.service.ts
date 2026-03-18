import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { RegisterRequest, RegisterResponse, LoginRequest, LoginResponse, User } from '../models/auth.model';
import { getExpiryFromJwt, parseJwt } from '../utils/jwt.util';

const ACCESS_KEY = 'bg_token';
const EXPIRY_KEY = 'bg_expiry';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private tokenSig = signal<string | null>(localStorage.getItem(ACCESS_KEY));
  private expirySig = signal<number | null>(
    localStorage.getItem(EXPIRY_KEY) ? Number(localStorage.getItem(EXPIRY_KEY)) : null
  );
  user = signal<User | null>(null);

  isAuthenticated = computed(() => {
    const t = this.tokenSig(); if (!t) return false;
    const exp = this.expirySig(); if (!exp) return true;
    return Date.now() < exp;
  });

  get token(): string | null { return this.tokenSig(); }

  private storeAuth(token: string, expiryIso?: string) {
    localStorage.setItem(ACCESS_KEY, token);
    this.tokenSig.set(token);

    let expMs: number | null = null;
    if (expiryIso) expMs = new Date(expiryIso).getTime();
    if (!expMs) expMs = getExpiryFromJwt(token);
    if (expMs) {
      localStorage.setItem(EXPIRY_KEY, String(expMs));
      this.expirySig.set(expMs);
    } else {
      localStorage.removeItem(EXPIRY_KEY);
      this.expirySig.set(null);
    }

    // .NET JwtSecurityTokenHandler writes SHORT claim names:
    //   ClaimTypes.Email          → "email"
    //   ClaimTypes.NameIdentifier → "nameid"
    //   ClaimTypes.Role           → "role"
    const claims = parseJwt(token);
    const email = claims['email']
      || claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'];
    const id = claims['nameid']
      || claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
    const role = claims['role']
      || claims['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
    const name = claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'];;

    this.user.set({ id, email, role, name });
  }

  register(payload: RegisterRequest) {
    return this.http.post<RegisterResponse>(`${environment.apiBase}/auth/register`, payload);
  }

  login(credentials: LoginRequest) {
    return this.http.post<LoginResponse>(`${environment.apiBase}/auth/login`, credentials);
  }

  refreshToken(refreshToken: string) {
    return this.http.post<LoginResponse>(`${environment.apiBase}/auth/refresh-token`, { refreshToken });
  }

  logoutFromServer() {
    return this.http.post(`${environment.apiBase}/auth/logout`, {});
  }

  completeAuthFromResponse(resp: RegisterResponse | LoginResponse, redirectUrl?: string) {
    const token = resp?.data?.token;
    const expiry = resp?.data?.expiry;
    if (!token) throw new Error('Token missing in response');
    this.storeAuth(token, expiry);

    const role = this.user()?.role;
    const destination = redirectUrl || (role === 'Admin' ? '/admin' : '/');
    this.router.navigateByUrl(destination).catch(() =>
      this.router.navigate([role === 'Admin' ? '/admin' : '/'])
    );
  }

  initializeFromStorage() {
    const t = localStorage.getItem(ACCESS_KEY);
    const exp = localStorage.getItem(EXPIRY_KEY);
    if (!t) return;

    this.tokenSig.set(t);
    this.expirySig.set(exp ? Number(exp) : null);

    const claims = parseJwt(t);
    const email = claims['email']
      || claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'];
    const id = claims['nameid']
      || claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
    const role = claims['role']
      || claims['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
    const name = claims['name'] || claims['unique_name'] || email;

    this.user.set({ id, email, role, name });
  }

  logout(navigateToLogin = true) {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(EXPIRY_KEY);
    this.tokenSig.set(null);
    this.expirySig.set(null);
    this.user.set(null);
    if (navigateToLogin) {
      this.router.navigate(['/auth'], { queryParams: { tab: 'login' } }).catch(() => {});
    }
  }
}
