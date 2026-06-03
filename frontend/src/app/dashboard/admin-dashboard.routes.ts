import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./admin-dashboard.component').then(m => m.AdminDashboardComponent),
  },
];
