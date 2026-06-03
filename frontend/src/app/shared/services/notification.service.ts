import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotificationToastService {
  constructor(private snackBar: MatSnackBar) {}

  success(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 4000,
      panelClass: ['success-snack'],
    });
  }

  error(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 6000,
      panelClass: ['error-snack'],
    });
  }

  info(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 4000,
      panelClass: ['info-snack'],
    });
  }
}
