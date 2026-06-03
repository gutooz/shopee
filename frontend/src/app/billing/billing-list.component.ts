import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
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
          <div class="kpi-grid" style="margin-bottom: 24px">
            <mat-card class="kpi-card">
              <div class="kpi-value">{{ (summary()!.total_fees) | currency:'BRL':'symbol':'1.2-2' }}</div>
              <div class="kpi-label">Total cobrado</div>
            </mat-card>
            <mat-card class="kpi-card">
              <div class="kpi-value" style="color:#ff9800">{{ (summary()!.pending_fees) | currency:'BRL':'symbol':'1.2-2' }}</div>
              <div class="kpi-label">Pendente</div>
            </mat-card>
            <mat-card class="kpi-card">
              <div class="kpi-value" style="color:#4caf50">{{ (summary()!.paid_fees) | currency:'BRL':'symbol':'1.2-2' }}</div>
              <div class="kpi-label">Pago</div>
            </mat-card>
            <mat-card class="kpi-card">
              <div class="kpi-value">{{ summary()!.total_items }}</div>
              <div class="kpi-label">Itens vendidos</div>
            </mat-card>
          </div>
        }

        <mat-card>
          @if (loading()) {
            <div style="padding:40px;text-align:center"><mat-spinner diameter="40"></mat-spinner></div>
          } @else {
            <table mat-table [dataSource]="billings()">
              <ng-container matColumnDef="order_id">
                <th mat-header-cell *matHeaderCellDef>Pedido</th>
                <td mat-cell *matCellDef="let b">{{ b.order_id }}</td>
              </ng-container>
              <ng-container matColumnDef="quantity_items">
                <th mat-header-cell *matHeaderCellDef>Itens</th>
                <td mat-cell *matCellDef="let b">{{ b.quantity_items }}</td>
              </ng-container>
              <ng-container matColumnDef="fee_value">
                <th mat-header-cell *matHeaderCellDef>Taxa</th>
                <td mat-cell *matCellDef="let b">{{ b.fee_value | currency:'BRL':'symbol':'1.2-2' }}</td>
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
                <td mat-cell *matCellDef="let b">{{ b.created_at | date:'dd/MM/yyyy' }}</td>
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
