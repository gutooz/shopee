import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { FormsModule } from '@angular/forms';
import { ShellComponent } from '../shared/components/shell.component';
import { ApiService } from '../shared/services/api.service';
import { NotificationToastService } from '../shared/services/notification.service';
import { Order } from '../shared/models/order.model';

@Component({
  selector: 'app-orders-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule, ShellComponent,
    MatCardModule, MatTableModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatFormFieldModule, MatSelectModule,
    MatProgressSpinnerModule, MatPaginatorModule,
  ],
  template: `
    <app-shell>
      <div class="page-container">

        <div class="page-header">
          <h1>Pedidos</h1>
          <div class="filter-wrap">
            <mat-icon class="filter-icon">filter_list</mat-icon>
            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>Status</mat-label>
              <mat-select [(ngModel)]="statusFilter" (ngModelChange)="onFilterChange()">
                <mat-option value="">Todos</mat-option>
                <mat-option value="pending">Pendente</mat-option>
                <mat-option value="processing">Processando</mat-option>
                <mat-option value="shipped">Enviado</mat-option>
                <mat-option value="delivered">Entregue</mat-option>
                <mat-option value="cancelled">Cancelado</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
        </div>

        <div class="section-card">
          @if (loading()) {
            <div class="loader"><div class="spin"></div></div>
          } @else {
            <table mat-table [dataSource]="orders()">
              <ng-container matColumnDef="shopee_id">
                <th mat-header-cell *matHeaderCellDef>Shopee #</th>
                <td mat-cell *matCellDef="let o">
                  @if (o.shopee_order_id) { <code class="mono">{{ o.shopee_order_id }}</code> }
                  @else { <span class="cell-muted">—</span> }
                </td>
              </ng-container>
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let o">
                  <span class="status-badge" [class]="o.status">{{ statusLabel(o.status) }}</span>
                </td>
              </ng-container>
              <ng-container matColumnDef="total">
                <th mat-header-cell *matHeaderCellDef>Total</th>
                <td mat-cell *matCellDef="let o">
                  <span class="cell-price">{{ o.total_value | currency:'BRL':'symbol':'1.2-2' }}</span>
                </td>
              </ng-container>
              <ng-container matColumnDef="tracking">
                <th mat-header-cell *matHeaderCellDef>Rastreio</th>
                <td mat-cell *matCellDef="let o">
                  @if (o.tracking_code) { <code class="mono">{{ o.tracking_code }}</code> }
                  @else { <span class="cell-muted">—</span> }
                </td>
              </ng-container>
              <ng-container matColumnDef="created">
                <th mat-header-cell *matHeaderCellDef>Criado em</th>
                <td mat-cell *matCellDef="let o">
                  <span class="cell-date">{{ o.created_at | date:'dd/MM/yyyy' }}</span>
                  <span class="cell-time">{{ o.created_at | date:'HH:mm' }}</span>
                </td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Ação</th>
                <td mat-cell *matCellDef="let o">
                  <a mat-icon-button [routerLink]="['/orders', o.id]" title="Ver detalhes">
                    <mat-icon>open_in_new</mat-icon>
                  </a>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="columns"></tr>
              <tr mat-row *matRowDef="let row; columns: columns"></tr>
            </table>
            <mat-paginator [length]="total()" [pageSize]="pageSize" (page)="onPage($event)"></mat-paginator>
          }
        </div>

      </div>
    </app-shell>
  `,
  styles: [`
    .filter-wrap  { display: flex; align-items: center; gap: 8px; }
    .filter-field { width: 180px; }
    .loader { display: flex; align-items: center; justify-content: center; padding: 56px; }
    .spin   { width: 28px; height: 28px; border-radius: 50%; border: 2px solid var(--border); border-top-color: var(--accent); animation: s 0.75s linear infinite; }
    @keyframes s { to { transform: rotate(360deg); } }
    .cell-muted { color: var(--fg-3); }
    .cell-price { font-weight: 600; color: var(--success); font-variant-numeric: tabular-nums; }
    .cell-date  { font-size: 0.85rem; display: block; }
    .cell-time  { font-size: 0.75rem; color: var(--fg-2); display: block; }
    .mono       { font-family: ui-monospace, 'Cascadia Code', monospace; font-size: 0.78rem; background: var(--elevated); border: 1px solid var(--border); border-radius: 5px; padding: 2px 7px; color: var(--fg-2); }
  `],
})
export class OrdersListComponent implements OnInit {
  columns = ['shopee_id', 'status', 'total', 'tracking', 'created', 'actions'];
  orders = signal<Order[]>([]);
  total  = signal(0);
  loading = signal(true);
  statusFilter = '';
  pageSize = 20;
  page = 1;

  constructor(private api: ApiService, private toast: NotificationToastService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.api.getOrders(this.page, this.pageSize, this.statusFilter || undefined).subscribe({
      next: data => { this.orders.set(data.items); this.total.set(data.total); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onFilterChange(): void { this.page = 1; this.load(); }
  onPage(e: PageEvent): void { this.page = e.pageIndex + 1; this.load(); }

  statusLabel(s: string): string {
    const map: Record<string, string> = {
      pending: 'Pendente', processing: 'Processando',
      shipped: 'Enviado', delivered: 'Entregue', cancelled: 'Cancelado',
    };
    return map[s] ?? s;
  }
}
