export interface User {
  id: number;
  username: string;
  email: string;
  date_joined: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
}

export interface SignupRequest {
  username: string;
  email: string;
  password?: string;
  confirm_password?: string;
}

export interface ApiErrorResponse {
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[] | string>;
  };
}
