import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
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
MatProgressSpinnerModule,
  ],
  styles: [`
    .settings-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      overflow: hidden;
      max-width: 560px;
    }
    .settings-head {
      display: flex; align-items: center; gap: 14px;
      padding: 20px 20px 16px;
      border-bottom: 1px solid var(--border);
    }
    .head-icon {
      width: 36px; height: 36px; border-radius: 9px; flex-shrink: 0;
      background: var(--elevated); border: 1px solid var(--border);
      display: flex; align-items: center; justify-content: center;
      mat-icon { color: var(--accent); font-size: 18px !important; width: 18px !important; height: 18px !important; }
    }
    .head-text { display: flex; flex-direction: column; gap: 2px; }
    .head-title { font-size: 0.875rem; font-weight: 600; color: var(--fg); margin: 0; }
    .head-desc  { font-size: 0.78rem; color: var(--fg-2); margin: 0; }

    .settings-loader { display: flex; align-items: center; justify-content: center; padding: 36px; }
    .spin { width: 26px; height: 26px; border-radius: 50%; border: 2px solid var(--border); border-top-color: var(--accent); animation: s 0.75s linear infinite; }
    @keyframes s { to { transform: rotate(360deg); } }

    .settings-body { padding: 20px; display: flex; flex-direction: column; gap: 16px; }
    .status-row {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 14px; border-radius: var(--radius); border: 1px solid var(--border);
      background: var(--elevated);
      mat-icon { font-size: 18px !important; width: 18px !important; height: 18px !important; }
      &.connected    mat-icon { color: var(--success); }
      &.disconnected mat-icon { color: var(--danger);  }
    }
    .status-text { display: block; font-size: 0.875rem; font-weight: 500; color: var(--fg); }
    .status-meta { display: block; font-size: 0.75rem; color: var(--fg-2); margin-top: 1px; }
    .settings-actions { display: flex; gap: 8px; }
    .disconnect-btn { border-color: rgba(239,68,68,0.35) !important; color: var(--danger) !important; }
    .disconnect-btn:hover { background: rgba(239,68,68,0.07) !important; }
  `],
  template: `
    <app-shell>
      <div class="page-container">
        <div class="page-header">
          <h1>Configurações</h1>
        </div>

        <div class="settings-card">
          <div class="settings-head">
            <div class="head-icon"><mat-icon>storefront</mat-icon></div>
            <div class="head-text">
              <h3 class="head-title">Integração Shopee</h3>
              <p class="head-desc">Conecte sua conta Shopee para sincronizar pedidos</p>
            </div>
          </div>

          @if (loadingStatus()) {
            <div class="settings-loader"><div class="spin"></div></div>
          } @else {
            <div class="settings-body">
              @if (shopeeStatus()?.connected) {
                <div class="status-row connected">
                  <mat-icon>check_circle</mat-icon>
                  <div>
                    <span class="status-text">Shopee conectada</span>
                    <span class="status-meta">Shop ID: {{ shopeeStatus()?.shop_id }}</span>
                  </div>
                </div>
                <div class="settings-actions">
                  <button mat-raised-button color="primary" (click)="syncOrders()" [disabled]="syncing()">
                    <mat-icon>{{ syncing() ? 'hourglass_empty' : 'sync' }}</mat-icon>
                    {{ syncing() ? 'Sincronizando...' : 'Sincronizar pedidos' }}
                  </button>
                  <button mat-stroked-button (click)="disconnect()" class="disconnect-btn">
                    <mat-icon>link_off</mat-icon> Desconectar
                  </button>
                </div>
              } @else {
                <div class="status-row disconnected">
                  <mat-icon>cancel</mat-icon>
                  <div>
                    <span class="status-text">Shopee não conectada</span>
                    <span class="status-meta">Conecte para começar a sincronizar pedidos</span>
                  </div>
                </div>
                <div class="settings-actions">
                  <button mat-raised-button color="primary" (click)="connectShopee()">
                    <mat-icon>link</mat-icon> Conectar Shopee
                  </button>
                </div>
              }
            </div>
          }
        </div>
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
