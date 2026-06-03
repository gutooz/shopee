import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { ShellComponent } from '../shared/components/shell.component';
import { ApiService } from '../shared/services/api.service';
import { AuthService } from '../shared/services/auth.service';

interface Kpi { label: string; value: string | number; icon: string; accent?: boolean; }

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ShellComponent, MatCardModule, MatIconModule, BaseChartDirective],
  template: `
    <app-shell>
      @if (loading()) {
        <div class="loader-wrap">
          <div class="spin"></div>
        </div>
      } @else {
        <div class="page-container">

          <div class="page-header">
            <h1>Dashboard</h1>
          </div>

          @if (auth.isSeller() || auth.user()?.role === 'seller') {

            <div class="kpi-grid">
              @for (k of metrics(); track k.label) {
                <mat-card class="kpi-card" [class.kpi-accent]="k.accent">
                  <div class="kpi-header">
                    <span class="kpi-label">{{ k.label }}</span>
                    <mat-icon class="kpi-icon">{{ k.icon }}</mat-icon>
                  </div>
                  <div class="kpi-value">{{ k.value }}</div>
                </mat-card>
              }
            </div>

            @if (chartData().datasets[0].data.length > 0) {
              <mat-card class="chart-card">
                <div class="chart-top">
                  <span class="chart-label">Pedidos — últimos 30 dias</span>
                </div>
                <canvas baseChart
                  [data]="chartData()"
                  [options]="chartOpts"
                  type="line"
                  class="canvas">
                </canvas>
              </mat-card>
            }

          }
        </div>
      }
    </app-shell>
  `,
  styles: [`
    .loader-wrap {
      display: flex; align-items: center; justify-content: center; min-height: 60vh;
    }
    .spin {
      width: 32px; height: 32px; border-radius: 50%;
      border: 2px solid var(--border); border-top-color: var(--accent);
      animation: s 0.75s linear infinite;
    }
    @keyframes s { to { transform: rotate(360deg); } }

    .chart-card { padding: 20px !important; }
    .chart-top  { margin-bottom: 16px; }
    .chart-label {
      font-size: 0.78rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--fg-2);
    }
    .canvas { max-height: 260px; }
  `],
})
export class DashboardComponent implements OnInit {
  loading = signal(true);
  kpis    = signal<any>(null);

  metrics = signal<Kpi[]>([]);

  chartData = signal<ChartData<'line'>>({
    labels: [],
    datasets: [{
      data: [], label: 'Pedidos', fill: true, tension: 0.35,
      borderColor: '#F97316',
      backgroundColor: 'rgba(249,115,22,0.06)',
      pointBackgroundColor: '#F97316',
      pointBorderColor: '#0A0A0B',
      pointBorderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 5,
    }],
  });

  chartOpts: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#18181B',
        borderColor: '#3F3F46',
        borderWidth: 1,
        titleColor: '#FAFAFA',
        bodyColor: '#71717A',
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid:  { color: 'rgba(63,63,70,0.5)', lineWidth: 1 },
        ticks: { color: '#52525B', font: { size: 11 } },
      },
      y: {
        beginAtZero: true,
        grid:  { color: 'rgba(63,63,70,0.5)', lineWidth: 1 },
        ticks: { color: '#52525B', font: { size: 11 } },
      },
    },
  };

  constructor(public auth: AuthService, private api: ApiService, private router: Router) {}

  ngOnInit(): void {
    if (this.auth.user()?.role === 'admin') { this.router.navigate(['/admin/dashboard']); return; }

    this.api.getSellerDashboard().subscribe({
      next: data => {
        this.kpis.set(data.kpis);
        const k = data.kpis ?? {};
        this.metrics.set([
          { label: 'Pedidos hoje',         icon: 'today',           value: k.orders_today   ?? 0 },
          { label: 'Pedidos no mês',       icon: 'calendar_month',  value: k.orders_month   ?? 0 },
          { label: 'Pendentes',            icon: 'pending',         value: k.orders_pending ?? 0 },
          { label: 'Enviados',             icon: 'local_shipping',  value: k.orders_shipped ?? 0 },
          { label: 'Fornecedores ativos',  icon: 'business',        value: k.suppliers_active ?? 0 },
          { label: 'Produtos ativos',      icon: 'inventory_2',     value: k.products_active ?? 0 },
          {
            label: 'Taxas no mês',
            icon: 'payments',
            value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(k.fees_month ?? 0),
            accent: true,
          },
        ]);

        const d30 = data.chart_orders_30d ?? [];
        this.chartData.set({
          labels: d30.map((d: any) => d.date),
          datasets: [{
            data: d30.map((d: any) => d.orders),
            label: 'Pedidos', fill: true, tension: 0.35,
            borderColor: '#F97316',
            backgroundColor: 'rgba(249,115,22,0.06)',
            pointBackgroundColor: '#F97316',
            pointBorderColor: '#0A0A0B',
            pointBorderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 5,
          }],
        });
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
