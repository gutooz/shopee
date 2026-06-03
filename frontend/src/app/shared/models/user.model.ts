export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'seller' | 'supplier';
  active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: 'seller' | 'supplier';
}
