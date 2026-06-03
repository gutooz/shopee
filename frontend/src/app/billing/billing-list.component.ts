import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ShellComponent } from '../shared/components/shell.component';
import { ApiService } from '../shared/services/api.service';
import { Billing, BillingSummary } from '../shared/models/billing.model';

@Component({
  selector: 'app-billing-list',
  standalone: true,
  imports: [
    CommonModule,
    ShellComponent,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
  ],
  template: `
    <app-shell>
      <div class="page-container">
        <div class="page-header">
          <h1>Cobranças</h1>
        </div>

        @if (summary()) {
          <div class="kpi-grid">
            <mat-card class="kpi-card">
              <div class="kpi-header"><span class="kpi-label">Total cobrado</span><mat-icon class="kpi-icon">payments</mat-icon></div>
              <div class="kpi-value">{{ (summary()!.total_fees) | currency:'BRL':'symbol':'1.2-2' }}</div>
            </mat-card>
            <mat-card class="kpi-card">
              <div class="kpi-header"><span class="kpi-label">Pendente</span><mat-icon class="kpi-icon">pending</mat-icon></div>
              <div class="kpi-value">{{ (summary()!.pending_fees) | currency:'BRL':'symbol':'1.2-2' }}</div>
            </mat-card>
            <mat-card class="kpi-card kpi-accent">
              <div class="kpi-header"><span class="kpi-label">Pago</span><mat-icon class="kpi-icon">check_circle</mat-icon></div>
              <div class="kpi-value">{{ (summary()!.paid_fees) | currency:'BRL':'symbol':'1.2-2' }}</div>
            </mat-card>
            <mat-card class="kpi-card">
              <div class="kpi-header"><span class="kpi-label">Itens vendidos</span><mat-icon class="kpi-icon">inventory_2</mat-icon></div>
              <div class="kpi-value">{{ summary()!.total_items }}</div>
            </mat-card>
          </div>
        }

        <div class="section-card">
          @if (loading()) {
            <div class="loader"><div class="spin"></div></div>
          } @else {
            <table mat-table [dataSource]="billings()">
              <ng-container matColumnDef="order_id">
                <th mat-header-cell *matHeaderCellDef>Pedido</th>
                <td mat-cell *matCellDef="let b"><code class="mono">{{ b.order_id }}</code></td>
              </ng-container>
              <ng-container matColumnDef="quantity_items">
                <th mat-header-cell *matHeaderCellDef>Itens</th>
                <td mat-cell *matCellDef="let b"><span class="cell-dim">{{ b.quantity_items }}</span></td>
              </ng-container>
              <ng-container matColumnDef="fee_value">
                <th mat-header-cell *matHeaderCellDef>Taxa</th>
                <td mat-cell *matCellDef="let b">
                  <span class="cell-price">{{ b.fee_value | currency:'BRL':'symbol':'1.2-2' }}</span>
                </td>
              </ng-container>
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let b">
                  <span class="status-badge" [class]="b.status === 'paid' ? 'shipped' : 'pending'">
                    {{ b.status === 'paid' ? 'Pago' : 'Pendente' }}
                  </span>
                </td>
              </ng-container>
              <ng-container matColumnDef="created_at">
                <th mat-header-cell *matHeaderCellDef>Data</th>
                <td mat-cell *matCellDef="let b">
                  <span class="cell-dim">{{ b.created_at | date:'dd/MM/yyyy' }}</span>
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
    .loader { display: flex; align-items: center; justify-content: center; padding: 56px; }
    .spin   { width: 28px; height: 28px; border-radius: 50%; border: 2px solid var(--border); border-top-color: var(--accent); animation: s 0.75s linear infinite; }
    @keyframes s { to { transform: rotate(360deg); } }
    .cell-dim  { color: var(--fg-2); font-size: 0.875rem; }
    .cell-price { font-weight: 600; color: var(--danger); font-variant-numeric: tabular-nums; }
    .mono { font-family: ui-monospace, 'Cascadia Code', monospace; font-size: 0.78rem; background: var(--elevated); border: 1px solid var(--border); border-radius: 5px; padding: 2px 7px; color: var(--fg-2); }
  `],
})
export class BillingListComponent implements OnInit {
  columns = ['order_id', 'quantity_items', 'fee_value', 'status', 'created_at'];
  billings = signal<Billing[]>([]);
  summary = signal<BillingSummary | null>(null);
  total = signal(0);
  loading = signal(true);
  pageSize = 20;
  page = 1;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.load();
    this.api.getBillingSummary().subscribe({ next: data => this.summary.set(data) });
  }

  load(): void {
    this.loading.set(true);
    this.api.getBilling(this.page, this.pageSize).subscribe({
      next: data => { this.billings.set(data.items); this.total.set(data.total); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onPage(e: PageEvent): void { this.page = e.pageIndex + 1; this.load(); }
}
