import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { ShellComponent } from '../shared/components/shell.component';
import { ApiService } from '../shared/services/api.service';
import { AuthService } from '../shared/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ShellComponent,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    BaseChartDirective,
  ],
  template: `
    <app-shell>
      @if (loading()) {
        <div style="display:flex; justify-content:center; padding:80px">
          <mat-spinner></mat-spinner>
        </div>
      } @else {
        <div class="page-container">
          <div class="page-header">
            <h1>Dashboard</h1>
          </div>

          @if (auth.isSeller() || auth.user()?.role === 'seller') {
            <div class="kpi-grid">
              <mat-card class="kpi-card">
                <div class="kpi-value">{{ kpis()?.orders_today ?? 0 }}</div>
                <div class="kpi-label">Pedidos hoje</div>
              </mat-card>
              <mat-card class="kpi-card">
                <div class="kpi-value">{{ kpis()?.orders_month ?? 0 }}</div>
                <div class="kpi-label">Pedidos no mês</div>
              </mat-card>
              <mat-card class="kpi-card">
                <div class="kpi-value" style="color: #ff9800">{{ kpis()?.orders_pending ?? 0 }}</div>
                <div class="kpi-label">Pendentes</div>
              </mat-card>
              <mat-card class="kpi-card">
                <div class="kpi-value" style="color: #4caf50">{{ kpis()?.orders_shipped ?? 0 }}</div>
                <div class="kpi-label">Enviados</div>
              </mat-card>
              <mat-card class="kpi-card">
                <div class="kpi-value">{{ kpis()?.suppliers_active ?? 0 }}</div>
                <div class="kpi-label">Fornecedores ativos</div>
              </mat-card>
              <mat-card class="kpi-card">
                <div class="kpi-value">{{ kpis()?.products_active ?? 0 }}</div>
                <div class="kpi-label">Produtos ativos</div>
              </mat-card>
              <mat-card class="kpi-card">
                <div class="kpi-value" style="color: #f44336">
                  {{ (kpis()?.fees_month ?? 0) | currency:'BRL':'symbol':'1.2-2' }}
                </div>
                <div class="kpi-label">Taxas no mês</div>
              </mat-card>
            </div>

            @if (chartData().datasets[0].data.length > 0) {
              <mat-card style="padding: 24px; margin-bottom: 24px">
                <h3 style="margin-top: 0">Pedidos — últimos 30 dias</h3>
                <canvas baseChart
                  [data]="chartData()"
                  [options]="chartOptions"
                  type="line"
                  style="max-height: 300px">
                </canvas>
              </mat-card>
            }
          }
        </div>
      }
    </app-shell>
  `,
})
export class DashboardComponent implements OnInit {
  loading = signal(true);
  kpis = signal<any>(null);
  chartData = signal<ChartData<'line'>>({ labels: [], datasets: [{ data: [], label: 'Pedidos', fill: true, borderColor: '#3f51b5', backgroundColor: 'rgba(63,81,181,0.1)' }] });

  chartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } },
  };

  constructor(public auth: AuthService, private api: ApiService, private router: Router) {}

  ngOnInit(): void {
    const role = this.auth.user()?.role;

    if (role === 'admin') {
      this.router.navigate(['/admin/dashboard']);
      return;
    }

    const request$ = this.api.getSellerDashboard();

    request$.subscribe({
      next: data => {
        this.kpis.set(data.kpis);
        const chart30d = data.chart_orders_30d ?? [];
        this.chartData.set({
          labels: chart30d.map((d: any) => d.date),
          datasets: [{
            data: chart30d.map((d: any) => d.orders),
            label: 'Pedidos',
            fill: true,
            borderColor: '#3f51b5',
            backgroundColor: 'rgba(63,81,181,0.1)',
          }],
        });
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
