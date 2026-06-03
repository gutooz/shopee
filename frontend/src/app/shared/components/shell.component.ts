import { Component, computed, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
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
  { label: 'Dashboard',     icon: 'dashboard',            route: '/dashboard',       roles: ['seller', 'admin', 'supplier'] },
  { label: 'Fornecedores',  icon: 'business',             route: '/suppliers',       roles: ['seller'] },
  { label: 'Produtos',      icon: 'inventory_2',          route: '/products',        roles: ['seller'] },
  { label: 'Pedidos',       icon: 'receipt_long',         route: '/orders',          roles: ['seller', 'supplier'] },
  { label: 'Cobranças',     icon: 'payments',             route: '/billing',         roles: ['seller', 'admin'] },
  { label: 'Configurações', icon: 'settings',             route: '/settings',        roles: ['seller', 'admin'] },
  { label: 'Admin',         icon: 'admin_panel_settings', route: '/admin/dashboard', roles: ['admin'] },
];

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatIconModule, MatButtonModule, MatMenuModule],
  template: `
    <div class="app-layout">

      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-brand">
          <span class="brand-name">SupplierHub</span>
        </div>

        <nav class="sidebar-nav">
          @for (item of visibleItems(); track item.route) {
            <a class="nav-item" [routerLink]="item.route" routerLinkActive="active">
              <mat-icon class="nav-icon">{{ item.icon }}</mat-icon>
              <span>{{ item.label }}</span>
            </a>
          }
        </nav>

        <div class="sidebar-footer">
          <div class="footer-user">
            <span class="user-initials">{{ initials() }}</span>
            <div class="user-info">
              <span class="user-name">{{ auth.user()?.name }}</span>
              <span class="user-role">{{ roleLabel() }}</span>
            </div>
          </div>
          <button class="btn-logout" (click)="logout()" title="Sair">
            <mat-icon>logout</mat-icon>
          </button>
        </div>
      </aside>

      <!-- Main -->
      <div class="main-area">

        <header class="topbar">
          <span></span>
          <div class="topbar-right">
            <button class="btn-icon" [matMenuTriggerFor]="notifMenu" [class.has-badge]="unreadCount() > 0">
              <mat-icon>notifications</mat-icon>
              @if (unreadCount() > 0) {
                <span class="badge">{{ unreadCount() > 9 ? '9+' : unreadCount() }}</span>
              }
            </button>
            <mat-menu #notifMenu="matMenu">
              <button mat-menu-item (click)="markRead()">
                <mat-icon>done_all</mat-icon> Marcar lido
              </button>
              <button mat-menu-item (click)="logout()">
                <mat-icon>logout</mat-icon> Sair
              </button>
            </mat-menu>

            <div class="sep"></div>

            <button class="btn-user" [matMenuTriggerFor]="userMenu">
              <span class="user-initials-sm">{{ initials() }}</span>
              <mat-icon class="chevron">expand_more</mat-icon>
            </button>
            <mat-menu #userMenu="matMenu">
              <button mat-menu-item routerLink="/settings">
                <mat-icon>settings</mat-icon> Configurações
              </button>
              <button mat-menu-item (click)="logout()">
                <mat-icon>logout</mat-icon> Sair
              </button>
            </mat-menu>
          </div>
        </header>

        <main class="content">
          <ng-content />
        </main>

      </div>
    </div>
  `,
  styles: [`
    .app-layout {
      display: flex;
      height: 100vh;
      background: var(--base);
      overflow: hidden;
    }

    /* ── Sidebar ─────────────────────────────────────────────── */
    .sidebar {
      width: 220px;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      background: var(--panel);
      border-right: 1px solid var(--border);
    }

    .sidebar-brand {
      height: 52px;
      display: flex;
      align-items: center;
      padding: 0 18px;
      border-bottom: 1px solid var(--border);
      flex-shrink: 0;
    }
    .brand-name {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--fg);
      letter-spacing: -0.01em;
    }

    /* ── Nav ─────────────────────────────────────────────────── */
    .sidebar-nav {
      flex: 1;
      padding: 8px;
      display: flex;
      flex-direction: column;
      gap: 1px;
      overflow-y: auto;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 9px;
      padding: 8px 10px;
      border-radius: 7px;
      text-decoration: none;
      color: var(--fg-2);
      font-size: 0.8375rem;
      font-weight: 500;
      transition: color 0.12s, background 0.12s;

      &:hover { background: rgba(255,255,255,0.04); color: var(--fg); }

      &.active {
        background: rgba(255,255,255,0.06);
        color: var(--fg);
        .nav-icon { color: var(--accent); }
      }
    }
    .nav-icon {
      font-size: 16px !important;
      width: 16px !important;
      height: 16px !important;
      flex-shrink: 0;
      color: inherit;
      transition: color 0.12s;
    }

    /* ── Sidebar footer ──────────────────────────────────────── */
    .sidebar-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
      border-top: 1px solid var(--border);
      flex-shrink: 0;
    }
    .footer-user {
      display: flex;
      align-items: center;
      gap: 9px;
      min-width: 0;
    }
    .user-initials {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      background: var(--elevated);
      border: 1px solid var(--border);
      color: var(--fg-2);
      font-size: 0.7rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      letter-spacing: 0.02em;
    }
    .user-info {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .user-name {
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--fg);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100px;
    }
    .user-role {
      font-size: 0.68rem;
      color: var(--fg-2);
      text-transform: capitalize;
    }
    .btn-logout {
      background: none;
      border: none;
      padding: 5px;
      border-radius: 6px;
      cursor: pointer;
      color: var(--fg-3);
      display: flex;
      align-items: center;
      transition: color 0.12s, background 0.12s;
      flex-shrink: 0;
      mat-icon { font-size: 15px !important; width: 15px !important; height: 15px !important; }
      &:hover { color: var(--danger); background: rgba(239,68,68,0.08); }
    }

    /* ── Main area ───────────────────────────────────────────── */
    .main-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .topbar {
      height: 52px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      background: var(--panel);
      border-bottom: 1px solid var(--border);
      flex-shrink: 0;
    }
    .topbar-right {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .btn-icon {
      position: relative;
      background: none;
      border: none;
      padding: 6px;
      border-radius: 6px;
      cursor: pointer;
      color: var(--fg-2);
      display: flex;
      align-items: center;
      transition: color 0.12s, background 0.12s;
      mat-icon { font-size: 18px !important; width: 18px !important; height: 18px !important; }
      &:hover { background: rgba(255,255,255,0.05); color: var(--fg); }
    }
    .badge {
      position: absolute;
      top: 2px;
      right: 2px;
      min-width: 15px;
      height: 15px;
      border-radius: 99px;
      background: var(--danger);
      color: #fff;
      font-size: 9px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 3px;
      line-height: 1;
    }
    .sep {
      width: 1px;
      height: 18px;
      background: var(--border);
      margin: 0 2px;
    }
    .btn-user {
      display: flex;
      align-items: center;
      gap: 4px;
      background: none;
      border: 1px solid var(--border);
      border-radius: 7px;
      padding: 4px 8px 4px 5px;
      cursor: pointer;
      transition: border-color 0.12s, background 0.12s;
      &:hover { border-color: var(--fg-3); background: rgba(255,255,255,0.04); }
    }
    .user-initials-sm {
      width: 20px;
      height: 20px;
      border-radius: 4px;
      background: var(--elevated);
      border: 1px solid var(--border);
      color: var(--fg-2);
      font-size: 0.6rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .chevron {
      font-size: 14px !important;
      width: 14px !important;
      height: 14px !important;
      color: var(--fg-2) !important;
    }

    .content {
      flex: 1;
      overflow-y: auto;
      background: var(--base);
    }
  `],
})
export class ShellComponent implements OnInit {
  unreadCount = signal(0);

  visibleItems = computed(() => {
    const role = this.auth.user()?.role ?? '';
    return NAV_ITEMS.filter(i => i.roles.includes(role));
  });

  initials = computed(() => {
    const name = this.auth.user()?.name ?? '';
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'U';
  });

  roleLabel = computed(() => {
    const map: Record<string, string> = { seller: 'Vendedor', supplier: 'Fornecedor', admin: 'Admin' };
    return map[this.auth.user()?.role ?? ''] ?? '';
  });

  constructor(
    public auth: AuthService,
    private api: ApiService,
    private ws: WebSocketService,
  ) {}

  ngOnInit(): void {
    this.loadUnreadCount();
    this.ws.events$.subscribe(e => {
      if (e['event'] === 'new_order') this.unreadCount.update(n => n + 1);
    });
  }

  private loadUnreadCount(): void {
    this.api.getUnreadCount().subscribe({ next: d => this.unreadCount.set(d.count), error: () => {} });
  }

  markRead(): void { this.unreadCount.set(0); }
  logout(): void   { this.auth.logout(); }
}
