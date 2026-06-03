import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { ApiService } from '../shared/services/api.service';
import { NotificationToastService } from '../shared/services/notification.service';

@Component({
  selector: 'app-shopee-callback',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;gap:16px">
      <mat-spinner></mat-spinner>
      <p>Conectando sua conta Shopee...</p>
    </div>
  `,
})
export class ShopeeCallbackComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private toast: NotificationToastService,
  ) {}

  ngOnInit(): void {
    const params = this.route.snapshot.queryParams;
    const code = params['code'];
    const shop_id = parseInt(params['shop_id'], 10);

    if (!code || !shop_id) {
      this.toast.error('Parâmetros inválidos');
      this.router.navigate(['/settings']);
      return;
    }

    this.api.shopeeAuthCallback(code, shop_id).subscribe({
      next: () => {
        this.toast.success('Shopee conectada com sucesso!');
        this.router.navigate(['/settings']);
      },
      error: err => {
        this.toast.error(err.error?.detail ?? 'Erro ao conectar Shopee');
        this.router.navigate(['/settings']);
      },
    });
  }
}
