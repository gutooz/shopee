import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './shared/guards/auth.guard';
import { roleGuard } from './shared/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },

  {
    path: 'auth',
    canActivate: [guestGuard],
    loadChildren: () => import('./auth/auth.routes').then(m => m.authRoutes),
  },

  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
  },

  {
    path: 'suppliers',
    canActivate: [authGuard, roleGuard('seller')],
    loadChildren: () =>
      import('./suppliers/suppliers.routes').then(m => m.suppliersRoutes),
  },

  {
    path: 'products',
    canActivate: [authGuard, roleGuard('seller')],
    loadChildren: () =>
      import('./products/products.routes').then(m => m.productsRoutes),
  },

  {
    path: 'orders',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./orders/orders.routes').then(m => m.ordersRoutes),
  },

  {
    path: 'billing',
    canActivate: [authGuard, roleGuard('seller', 'admin')],
    loadChildren: () =>
      import('./billing/billing.routes').then(m => m.billingRoutes),
  },

  {
    path: 'settings',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./settings/settings.routes').then(m => m.settingsRoutes),
  },

  {
    path: 'admin',
    canActivate: [authGuard, roleGuard('admin')],
    loadChildren: () =>
      import('./dashboard/admin-dashboard.routes').then(m => m.adminRoutes),
  },

  { path: '**', redirectTo: '/dashboard' },
];
