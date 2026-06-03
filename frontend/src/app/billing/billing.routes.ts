import { Routes } from '@angular/router';

export const billingRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./billing-list.component').then(m => m.BillingListComponent),
  },
];
