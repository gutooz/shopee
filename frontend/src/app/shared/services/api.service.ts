import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { PaginatedResponse } from '../models/order.model';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private url(path: string): string {
    return `${this.base}${path}`;
  }

  // Suppliers
  getSuppliers(page = 1, pageSize = 20): Observable<PaginatedResponse<any>> {
    return this.http.get<PaginatedResponse<any>>(this.url('/suppliers/'), {
      params: new HttpParams().set('page', page).set('page_size', pageSize),
    });
  }

  createSupplier(data: any): Observable<any> {
    return this.http.post(this.url('/suppliers/'), data);
  }

  updateSupplier(id: string, data: any): Observable<any> {
    return this.http.put(this.url(`/suppliers/${id}`), data);
  }

  deleteSupplier(id: string): Observable<any> {
    return this.http.delete(this.url(`/suppliers/${id}`));
  }

  // Products
  getProducts(page = 1, pageSize = 20, supplierId?: string): Observable<PaginatedResponse<any>> {
    let params = new HttpParams().set('page', page).set('page_size', pageSize);
    if (supplierId) params = params.set('supplier_id', supplierId);
    return this.http.get<PaginatedResponse<any>>(this.url('/products/'), { params });
  }

  createProduct(data: any): Observable<any> {
    return this.http.post(this.url('/products/'), data);
  }

  updateProduct(id: string, data: any): Observable<any> {
    return this.http.put(this.url(`/products/${id}`), data);
  }

  deleteProduct(id: string): Observable<any> {
    return this.http.delete(this.url(`/products/${id}`));
  }

  // Orders
  getOrders(page = 1, pageSize = 20, status?: string): Observable<PaginatedResponse<any>> {
    let params = new HttpParams().set('page', page).set('page_size', pageSize);
    if (status) params = params.set('status', status);
    return this.http.get<PaginatedResponse<any>>(this.url('/orders/'), { params });
  }

  getOrder(id: string): Observable<any> {
    return this.http.get(this.url(`/orders/${id}`));
  }

  updateTracking(orderId: string, tracking_code: string): Observable<any> {
    return this.http.patch(this.url(`/orders/${orderId}/tracking`), { tracking_code });
  }

  updateOrderStatus(orderId: string, status: string): Observable<any> {
    return this.http.patch(this.url(`/orders/${orderId}/status`), null, {
      params: new HttpParams().set('status', status),
    });
  }

  // Billing
  getBilling(page = 1, pageSize = 20): Observable<PaginatedResponse<any>> {
    return this.http.get<PaginatedResponse<any>>(this.url('/billing/'), {
      params: new HttpParams().set('page', page).set('page_size', pageSize),
    });
  }

  getBillingSummary(): Observable<any> {
    return this.http.get(this.url('/billing/summary'));
  }

  // Dashboard
  getSellerDashboard(): Observable<any> {
    return this.http.get(this.url('/dashboard/seller'));
  }

  getAdminDashboard(): Observable<any> {
    return this.http.get(this.url('/dashboard/admin'));
  }

  // Notifications
  getNotifications(page = 1, pageSize = 20, unreadOnly = false): Observable<any> {
    let params = new HttpParams().set('page', page).set('page_size', pageSize);
    if (unreadOnly) params = params.set('unread_only', 'true');
    return this.http.get(this.url('/notifications/'), { params });
  }

  getUnreadCount(): Observable<any> {
    return this.http.get(this.url('/notifications/unread-count'));
  }

  markNotificationRead(id: string): Observable<any> {
    return this.http.patch(this.url(`/notifications/${id}/read`), {});
  }

  markAllNotificationsRead(): Observable<any> {
    return this.http.patch(this.url('/notifications/mark-all-read'), {});
  }

  // Shopee
  getShopeeStatus(): Observable<any> {
    return this.http.get(this.url('/shopee/status'));
  }

  getShopeeAuthUrl(): Observable<any> {
    return this.http.get(this.url('/shopee/auth-url'));
  }

  shopeeAuthCallback(code: string, shop_id: number): Observable<any> {
    return this.http.post(this.url('/shopee/auth/callback'), { code, shop_id });
  }

  disconnectShopee(): Observable<any> {
    return this.http.delete(this.url('/shopee/disconnect'));
  }

  syncShopeeOrders(days_back = 1): Observable<any> {
    return this.http.post(this.url('/shopee/sync-orders'), { days_back });
  }

  // Admin
  getAdminUsers(page = 1, pageSize = 20): Observable<PaginatedResponse<any>> {
    return this.http.get<PaginatedResponse<any>>(this.url('/users/'), {
      params: new HttpParams().set('page', page).set('page_size', pageSize),
    });
  }

  toggleUserActive(userId: string, active: boolean): Observable<any> {
    return this.http.patch(this.url(`/users/${userId}`), { active });
  }
}
