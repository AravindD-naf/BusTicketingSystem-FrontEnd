export interface RegisterRequest {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
}

export interface LoginRequest {
  email: string;      // backend uses Email, not username
  password: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    expiry: string;
  };
}

export type LoginResponse = RegisterResponse;

export interface User {
  id?: string;
  email?: string;
  name?: string;
  role?: string;
}
