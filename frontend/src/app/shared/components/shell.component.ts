import { Component, computed, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { ApiService } from '../services/api.service';
import { WebSocketService } from '../services/websocket.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles: string[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: 'dashboard', route: '/dashboard', roles: ['seller', 'admin', 'supplier'] },
  { label: 'Fornecedores', icon: 'business', route: '/suppliers', roles: ['seller'] },
  { label: 'Produtos', icon: 'inventory_2', route: '/products', roles: ['seller'] },
  { label: 'Pedidos', icon: 'receipt_long', route: '/orders', roles: ['seller', 'supplier'] },
  { label: 'Cobranças', icon: 'payments', route: '/billing', roles: ['seller', 'admin'] },
  { label: 'Configurações', icon: 'settings', route: '/settings', roles: ['seller', 'admin'] },
  { label: 'Admin', icon: 'admin_panel_settings', route: '/admin/dashboard', roles: ['admin'] },
];

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatMenuModule,
  ],
  template: `
    <mat-sidenav-container style="height: 100vh">
      <mat-sidenav mode="side" opened style="width: 240px">
        <div style="padding: 16px; background: #3f51b5; color: white">
          <h2 style="margin: 0; font-size: 1.2rem">SupplierHub</h2>
          <small>{{ auth.user()?.name }}</small>
        </div>
        <mat-nav-list>
          @for (item of visibleItems(); track item.route) {
            <a mat-list-item [routerLink]="item.route" routerLinkActive="active-link">
              <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
              <span matListItemTitle>{{ item.label }}</span>
            </a>
          }
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content>
        <mat-toolbar color="primary">
          <span style="flex: 1"></span>

          <button mat-icon-button [matMenuTriggerFor]="notifMenu">
            <mat-icon [matBadge]="unreadCount() || null" matBadgeColor="warn">
              notifications
            </mat-icon>
          </button>
          <mat-menu #notifMenu="matMenu">
            <button mat-menu-item (click)="logout()">
              <mat-icon>logout</mat-icon> Sair
            </button>
          </mat-menu>

          <button mat-icon-button [matMenuTriggerFor]="userMenu">
            <mat-icon>account_circle</mat-icon>
          </button>
          <mat-menu #userMenu="matMenu">
            <button mat-menu-item routerLink="/settings">
              <mat-icon>settings</mat-icon> Configurações
            </button>
            <button mat-menu-item (click)="logout()">
              <mat-icon>logout</mat-icon> Sair
            </button>
          </mat-menu>
        </mat-toolbar>

        <main style="padding: 24px; overflow-y: auto; height: calc(100vh - 64px)">
          <ng-content />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .active-link { background: rgba(63, 81, 181, 0.1); color: #3f51b5; }
    .active-link mat-icon { color: #3f51b5; }
  `],
})
export class ShellComponent implements OnInit {
  unreadCount = signal(0);

  visibleItems = computed(() => {
    const role = this.auth.user()?.role ?? '';
    return NAV_ITEMS.filter(i => i.roles.includes(role));
  });

  constructor(
    public auth: AuthService,
    private api: ApiService,
    private ws: WebSocketService,
  ) {}

  ngOnInit(): void {
    this.loadUnreadCount();
    this.ws.events$.subscribe(event => {
      if (event['event'] === 'new_order') {
        this.unreadCount.update(n => n + 1);
      }
    });
  }

  private loadUnreadCount(): void {
    this.api.getUnreadCount().subscribe({
      next: data => this.unreadCount.set(data.count),
      error: () => {},
    });
  }

  logout(): void {
    this.auth.logout();
  }
}
