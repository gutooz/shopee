import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, throwError } from 'rxjs';
import { environment } from '@env/environment';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'sh_access_token';
  private readonly REFRESH_KEY = 'sh_refresh_token';
  private readonly USER_KEY = 'sh_user';

  private _user = signal<User | null>(this.loadUser());
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);
  readonly isAdmin = computed(() => this._user()?.role === 'admin');
  readonly isSeller = computed(() => this._user()?.role === 'seller');
  readonly isSupplier = computed(() => this._user()?.role === 'supplier');

  constructor(private http: HttpClient, private router: Router) {}

  private loadUser(): User | null {
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private saveSession(resp: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, resp.access_token);
    localStorage.setItem(this.REFRESH_KEY, resp.refresh_token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(resp.user));
    this._user.set(resp.user);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_KEY);
  }

  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, data).pipe(
      tap(resp => this.saveSession(resp))
    );
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, data).pipe(
      tap(resp => this.saveSession(resp))
    );
  }

  refreshToken(): Observable<AuthResponse> {
    const refresh_token = this.getRefreshToken();
    if (!refresh_token) return throwError(() => new Error('No refresh token'));
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/refresh`, { refresh_token }).pipe(
      tap(resp => this.saveSession(resp))
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._user.set(null);
    this.router.navigate(['/auth/login']);
  }

  changePassword(current_password: string, new_password: string): Observable<any> {
    return this.http.put(`${environment.apiUrl}/auth/change-password`, {
      current_password,
      new_password,
    });
  }
}
