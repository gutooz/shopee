import { Routes } from '@angular/router';

export const settingsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./settings.component').then(m => m.SettingsComponent),
  },
  {
    path: 'shopee/callback',
    loadComponent: () => import('./shopee-callback.component').then(m => m.ShopeeCallbackComponent),
  },
];
