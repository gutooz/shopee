import { Component, OnInit, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ShellComponent } from '../shared/components/shell.component';
import { ApiService } from '../shared/services/api.service';
import { NotificationToastService } from '../shared/services/notification.service';
import { Order } from '../shared/models/order.model';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ShellComponent,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <app-shell>
      <div class="page-container">
        <div class="page-header">
          <div style="display:flex; align-items:center; gap:8px">
            <button mat-icon-button (click)="back()"><mat-icon>arrow_back</mat-icon></button>
            <h1>Detalhe do Pedido</h1>
          </div>
        </div>

        @if (loading()) {
          <div style="padding:80px;text-align:center"><mat-spinner></mat-spinner></div>
        } @else if (order()) {
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
            <mat-card style="padding:24px">
              <h3>Informações</h3>
              <mat-divider></mat-divider>
              <div style="margin-top:16px;display:flex;flex-direction:column;gap:12px">
                <div><strong>Shopee #:</strong> {{ order()!.shopee_order_id ?? '—' }}</div>
                <div>
                  <strong>Status:</strong>
                  <span class="status-badge" [class]="order()!.status" style="margin-left:8px">
                    {{ statusLabel(order()!.status) }}
                  </span>
                </div>
                <div><strong>Total:</strong> {{ order()!.total_value | currency:'BRL':'symbol':'1.2-2' }}</div>
                <div><strong>Rastreio:</strong> {{ order()!.tracking_code ?? 'Não informado' }}</div>
                <div><strong>Criado em:</strong> {{ order()!.created_at | date:'dd/MM/yyyy HH:mm' }}</div>
                <div><strong>Atualizado:</strong> {{ order()!.updated_at | date:'dd/MM/yyyy HH:mm' }}</div>
              </div>
            </mat-card>

            <mat-card style="padding:24px">
              <h3>Ações</h3>
              <mat-divider></mat-divider>
              <div style="margin-top:16px;display:flex;flex-direction:column;gap:16px">
                @if (!order()!.tracking_code) {
                  <div>
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Código de rastreio</mat-label>
                      <input matInput [formControl]="trackingControl" placeholder="BR123456789BR">
                    </mat-form-field>
                    <button
                      mat-raised-button
                      color="primary"
                      (click)="saveTracking()"
                      [disabled]="trackingControl.invalid || savingTracking()"
                    >
                      <mat-icon>local_shipping</mat-icon>
                      Informar Rastreio
                    </button>
                  </div>
                }

                @if (order()!.status === 'pending') {
                  <button mat-stroked-button color="primary" (click)="changeStatus('processing')">
                    Marcar como Processando
                  </button>
                }
              </div>
            </mat-card>
          </div>

          @if (order()!.items && order()!.items!.length > 0) {
            <mat-card style="padding:24px;margin-top:24px">
              <h3>Itens do Pedido</h3>
              <mat-divider></mat-divider>
              <table style="width:100%;margin-top:16px;border-collapse:collapse">
                <thead>
                  <tr style="text-align:left;border-bottom:1px solid #eee">
                    <th style="padding:8px">Produto ID</th>
                    <th style="padding:8px">Quantidade</th>
                    <th style="padding:8px">Preço unit.</th>
                    <th style="padding:8px">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of order()!.items; track item.id) {
                    <tr style="border-bottom:1px solid #f5f5f5">
                      <td style="padding:8px">{{ item.product_id }}</td>
                      <td style="padding:8px">{{ item.quantity }}</td>
                      <td style="padding:8px">{{ item.price | currency:'BRL':'symbol':'1.2-2' }}</td>
                      <td style="padding:8px">{{ (item.price * item.quantity) | currency:'BRL':'symbol':'1.2-2' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </mat-card>
          }
        }
      </div>
    </app-shell>
  `,
})
export class OrderDetailComponent implements OnInit {
  @Input() id!: string;

  order = signal<Order | null>(null);
  loading = signal(true);
  savingTracking = signal(false);
  trackingControl = new FormControl('', [Validators.required, Validators.minLength(5)]);

  constructor(
    private api: ApiService,
    private toast: NotificationToastService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.api.getOrder(this.id).subscribe({
      next: data => { this.order.set(data); this.loading.set(false); },
      error: () => { this.toast.error('Pedido não encontrado'); this.loading.set(false); },
    });
  }

  saveTracking(): void {
    const code = this.trackingControl.value?.trim();
    if (!code) return;
    this.savingTracking.set(true);
    this.api.updateTracking(this.id, code).subscribe({
      next: data => {
        this.order.set(data);
        this.toast.success('Rastreio salvo e Shopee atualizado!');
        this.savingTracking.set(false);
      },
      error: err => { this.toast.error(err.error?.detail ?? 'Erro'); this.savingTracking.set(false); },
    });
  }

  changeStatus(status: string): void {
    this.api.updateOrderStatus(this.id, status).subscribe({
      next: data => { this.order.set(data); this.toast.success('Status atualizado'); },
      error: err => this.toast.error(err.error?.detail ?? 'Erro'),
    });
  }

  statusLabel(s: string): string {
    const map: Record<string, string> = {
      pending: 'Pendente', processing: 'Processando',
      shipped: 'Enviado', delivered: 'Entregue', cancelled: 'Cancelado',
    };
    return map[s] ?? s;
  }

  back(): void { this.router.navigate(['/orders']); }
}
