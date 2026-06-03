import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ShellComponent } from '../shared/components/shell.component';
import { ApiService } from '../shared/services/api.service';
import { NotificationToastService } from '../shared/services/notification.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    ShellComponent,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <app-shell>
      <div class="page-container">
        <div class="page-header">
          <h1>Configurações</h1>
        </div>

        <mat-card style="padding: 24px; margin-bottom: 24px">
          <h3>Integração Shopee</h3>
          <mat-divider></mat-divider>

          @if (loadingStatus()) {
            <div style="padding: 24px; text-align: center"><mat-spinner diameter="30"></mat-spinner></div>
          } @else {
            <div style="margin-top: 16px">
              @if (shopeeStatus()?.connected) {
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
                  <mat-icon style="color:#4caf50">check_circle</mat-icon>
                  <span>Shopee conectada — Shop ID: <strong>{{ shopeeStatus()?.shop_id }}</strong></span>
                </div>
                <div style="display:flex;gap:8px">
                  <button mat-raised-button color="primary" (click)="syncOrders()" [disabled]="syncing()">
                    <mat-icon>sync</mat-icon>
                    {{ syncing() ? 'Sincronizando...' : 'Sincronizar pedidos' }}
                  </button>
                  <button mat-stroked-button color="warn" (click)="disconnect()">
                    <mat-icon>link_off</mat-icon> Desconectar
                  </button>
                </div>
              } @else {
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
                  <mat-icon style="color:#f44336">cancel</mat-icon>
                  <span>Shopee não conectada</span>
                </div>
                <button mat-raised-button color="primary" (click)="connectShopee()">
                  <mat-icon>link</mat-icon> Conectar Shopee
                </button>
              }
            </div>
          }
        </mat-card>
      </div>
    </app-shell>
  `,
})
export class SettingsComponent implements OnInit {
  shopeeStatus = signal<any>(null);
  loadingStatus = signal(true);
  syncing = signal(false);

  constructor(private api: ApiService, private toast: NotificationToastService) {}

  ngOnInit(): void { this.loadStatus(); }

  loadStatus(): void {
    this.loadingStatus.set(true);
    this.api.getShopeeStatus().subscribe({
      next: data => { this.shopeeStatus.set(data); this.loadingStatus.set(false); },
      error: () => this.loadingStatus.set(false),
    });
  }

  connectShopee(): void {
    this.api.getShopeeAuthUrl().subscribe({
      next: data => { window.location.href = data.url; },
      error: () => this.toast.error('Erro ao obter URL de autenticação'),
    });
  }

  disconnect(): void {
    if (!confirm('Desconectar Shopee?')) return;
    this.api.disconnectShopee().subscribe({
      next: () => { this.toast.success('Shopee desconectada'); this.loadStatus(); },
      error: () => this.toast.error('Erro ao desconectar'),
    });
  }

  syncOrders(): void {
    this.syncing.set(true);
    this.api.syncShopeeOrders().subscribe({
      next: data => {
        this.toast.success(`Sincronizado: ${data.synced} novos pedidos`);
        this.syncing.set(false);
      },
      error: () => { this.toast.error('Erro na sincronização'); this.syncing.set(false); },
    });
  }
}
