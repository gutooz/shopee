import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [AuthService],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start unauthenticated', () => {
    expect(service.isAuthenticated()).toBeFalse();
    expect(service.user()).toBeNull();
  });

  it('should login and store tokens', () => {
    const mockResp = {
      access_token: 'token123',
      refresh_token: 'refresh123',
      token_type: 'bearer',
      user: { id: '1', name: 'Test', email: 'test@test.com', role: 'seller', active: true, created_at: '' },
    };

    service.login({ email: 'test@test.com', password: 'pass' }).subscribe(resp => {
      expect(resp.access_token).toBe('token123');
      expect(service.isAuthenticated()).toBeTrue();
      expect(service.isSeller()).toBeTrue();
    });

    const req = httpMock.expectOne(req => req.url.includes('/auth/login'));
    req.flush(mockResp);
  });

  it('should logout and clear state', () => {
    localStorage.setItem('sh_access_token', 'token');
    localStorage.setItem('sh_user', JSON.stringify({ id: '1', role: 'seller' }));
    service.logout();
    expect(service.isAuthenticated()).toBeFalse();
    expect(localStorage.getItem('sh_access_token')).toBeNull();
  });

  it('getToken should return stored token', () => {
    localStorage.setItem('sh_access_token', 'mytoken');
    expect(service.getToken()).toBe('mytoken');
  });
});
