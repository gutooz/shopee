import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { ShellComponent } from '../shared/components/shell.component';
import { ApiService } from '../shared/services/api.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, ShellComponent, MatCardModule, MatIconModule, MatProgressSpinnerModule, BaseChartDirective],
  styles: [`
    .loader-wrap { display: flex; align-items: center; justify-content: center; min-height: 60vh; }
    .spin { width: 32px; height: 32px; border-radius: 50%; border: 2px solid var(--border); border-top-color: var(--accent); animation: s 0.75s linear infinite; }
    @keyframes s { to { transform: rotate(360deg); } }
    .chart-card { padding: 20px !important; }
    .chart-label { font-size: 0.78rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--fg-2); display: block; margin-bottom: 16px; }
    .canvas { max-height: 300px; }
  `],
  template: `
    <app-shell>
      @if (loading()) {
        <div class="loader-wrap"><div class="spin"></div></div>
      } @else {
        <div class="page-container">

          <div class="page-header"><h1>Admin Dashboard</h1></div>

          <div class="kpi-grid">
            <mat-card class="kpi-card">
              <div class="kpi-header"><span class="kpi-label">Total Sellers</span><mat-icon class="kpi-icon">people</mat-icon></div>
              <div class="kpi-value">{{ kpis()?.total_sellers ?? 0 }}</div>
            </mat-card>
            <mat-card class="kpi-card">
              <div class="kpi-header"><span class="kpi-label">Pedidos processados</span><mat-icon class="kpi-icon">receipt_long</mat-icon></div>
              <div class="kpi-value">{{ kpis()?.total_orders ?? 0 }}</div>
            </mat-card>
            <mat-card class="kpi-card">
              <div class="kpi-header"><span class="kpi-label">Novos sellers</span><mat-icon class="kpi-icon">person_add</mat-icon></div>
              <div class="kpi-value">{{ kpis()?.new_sellers_month ?? 0 }}</div>
            </mat-card>
            <mat-card class="kpi-card kpi-accent">
              <div class="kpi-header"><span class="kpi-label">Receita total</span><mat-icon class="kpi-icon">account_balance</mat-icon></div>
              <div class="kpi-value">{{ (kpis()?.total_revenue ?? 0) | currency:'BRL':'symbol':'1.2-2' }}</div>
            </mat-card>
            <mat-card class="kpi-card">
              <div class="kpi-header"><span class="kpi-label">Receita no mês</span><mat-icon class="kpi-icon">trending_up</mat-icon></div>
              <div class="kpi-value">{{ (kpis()?.month_revenue ?? 0) | currency:'BRL':'symbol':'1.2-2' }}</div>
            </mat-card>
          </div>

          @if ((barChart().datasets[0]?.data?.length ?? 0) > 0) {
            <mat-card class="chart-card">
              <span class="chart-label">Crescimento mensal</span>
              <canvas baseChart [data]="barChart()" [options]="barOptions" type="bar" class="canvas"></canvas>
            </mat-card>
          }

        </div>
      }
    </app-shell>
  `,
})
export class AdminDashboardComponent implements OnInit {
  loading = signal(true);
  kpis = signal<any>(null);
  barChart = signal<ChartData<'bar'>>({ labels: [], datasets: [] });

  barOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { position: 'top', labels: { color: '#71717A', font: { size: 11 }, boxWidth: 10, padding: 14 } },
      tooltip: { backgroundColor: '#18181B', borderColor: '#3F3F46', borderWidth: 1, titleColor: '#FAFAFA', bodyColor: '#71717A', padding: 10, cornerRadius: 8 },
    },
    scales: {
      x: { grid: { color: 'rgba(63,63,70,0.5)' }, ticks: { color: '#52525B', font: { size: 11 } } },
      y: { beginAtZero: true, grid: { color: 'rgba(63,63,70,0.5)' }, ticks: { color: '#52525B', font: { size: 11 } } },
    },
  };

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getAdminDashboard().subscribe({
      next: data => {
        this.kpis.set(data.kpis);
        const monthly = data.chart_monthly ?? [];
        this.barChart.set({
          labels: monthly.map((d: any) => d.month),
          datasets: [
            { data: monthly.map((d: any) => d.orders),  label: 'Pedidos',      backgroundColor: 'rgba(249,115,22,0.7)',  borderColor: '#F97316', borderWidth: 0, borderRadius: 4 },
            { data: monthly.map((d: any) => d.revenue), label: 'Receita (R$)', backgroundColor: 'rgba(34,197,94,0.65)',  borderColor: '#22C55E', borderWidth: 0, borderRadius: 4 },
          ],
        });
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
