import { Routes } from '@angular/router';

export const suppliersRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./suppliers-list.component').then(m => m.SuppliersListComponent),
  },
];
