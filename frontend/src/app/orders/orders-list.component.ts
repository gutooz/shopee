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
    CommonModule,
    RouterLink,
    FormsModule,
    ShellComponent,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
  ],
  template: `
    <app-shell>
      <div class="page-container">
        <div class="page-header">
          <h1>Pedidos</h1>
          <mat-form-field appearance="outline" style="width: 200px">
            <mat-label>Filtrar status</mat-label>
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

        <mat-card>
          @if (loading()) {
            <div style="padding: 40px; text-align: center"><mat-spinner diameter="40"></mat-spinner></div>
          } @else {
            <table mat-table [dataSource]="orders()">
              <ng-container matColumnDef="shopee_id">
                <th mat-header-cell *matHeaderCellDef>Shopee #</th>
                <td mat-cell *matCellDef="let o">{{ o.shopee_order_id ?? '—' }}</td>
              </ng-container>
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let o">
                  <span class="status-badge" [class]="o.status">{{ statusLabel(o.status) }}</span>
                </td>
              </ng-container>
              <ng-container matColumnDef="total">
                <th mat-header-cell *matHeaderCellDef>Total</th>
                <td mat-cell *matCellDef="let o">{{ o.total_value | currency:'BRL':'symbol':'1.2-2' }}</td>
              </ng-container>
              <ng-container matColumnDef="tracking">
                <th mat-header-cell *matHeaderCellDef>Rastreio</th>
                <td mat-cell *matCellDef="let o">{{ o.tracking_code ?? '—' }}</td>
              </ng-container>
              <ng-container matColumnDef="created">
                <th mat-header-cell *matHeaderCellDef>Criado em</th>
                <td mat-cell *matCellDef="let o">{{ o.created_at | date:'dd/MM/yyyy HH:mm' }}</td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Ações</th>
                <td mat-cell *matCellDef="let o">
                  <a mat-icon-button [routerLink]="['/orders', o.id]">
                    <mat-icon>visibility</mat-icon>
                  </a>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="columns"></tr>
              <tr mat-row *matRowDef="let row; columns: columns"></tr>
            </table>
            <mat-paginator [length]="total()" [pageSize]="pageSize" (page)="onPage($event)"></mat-paginator>
          }
        </mat-card>
      </div>
    </app-shell>
  `,
})
export class OrdersListComponent implements OnInit {
  columns = ['shopee_id', 'status', 'total', 'tracking', 'created', 'actions'];
  orders = signal<Order[]>([]);
  total = signal(0);
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
