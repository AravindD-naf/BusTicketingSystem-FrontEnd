import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface UserProfile {
  userId: number;
  fullName: string;
  email: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfileResponse {
  success: boolean;
  message: string;
  data?: UserProfile;
}

export interface UpdateProfileRequest {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
}

@Injectable({ providedIn: 'root' })
export class UserProfileService {
  private readonly API = environment.apiBase;

  constructor(private http: HttpClient) {}

  getProfile() {
    return this.http.post<UserProfileResponse>(`${this.API}/users/profile`, {});
  }

  updateProfile(request: UpdateProfileRequest) {
    return this.http.post<UserProfileResponse>(`${this.API}/users/profile/update`, request);
  }
}