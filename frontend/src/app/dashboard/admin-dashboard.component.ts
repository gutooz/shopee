import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { ShellComponent } from '../shared/components/shell.component';
import { ApiService } from '../shared/services/api.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, ShellComponent, MatCardModule, MatProgressSpinnerModule, BaseChartDirective],
  template: `
    <app-shell>
      @if (loading()) {
        <div style="display:flex;justify-content:center;padding:80px">
          <mat-spinner></mat-spinner>
        </div>
      } @else {
        <div class="page-container">
          <div class="page-header">
            <h1>Admin Dashboard</h1>
          </div>

          <div class="kpi-grid">
            <mat-card class="kpi-card">
              <div class="kpi-value">{{ kpis()?.total_sellers ?? 0 }}</div>
              <div class="kpi-label">Total Sellers</div>
            </mat-card>
            <mat-card class="kpi-card">
              <div class="kpi-value">{{ kpis()?.total_orders ?? 0 }}</div>
              <div class="kpi-label">Pedidos processados</div>
            </mat-card>
            <mat-card class="kpi-card">
              <div class="kpi-value">{{ kpis()?.new_sellers_month ?? 0 }}</div>
              <div class="kpi-label">Novos sellers no mês</div>
            </mat-card>
            <mat-card class="kpi-card">
              <div class="kpi-value" style="color:#4caf50">
                {{ (kpis()?.total_revenue ?? 0) | currency:'BRL':'symbol':'1.2-2' }}
              </div>
              <div class="kpi-label">Receita total</div>
            </mat-card>
            <mat-card class="kpi-card">
              <div class="kpi-value" style="color:#2196f3">
                {{ (kpis()?.month_revenue ?? 0) | currency:'BRL':'symbol':'1.2-2' }}
              </div>
              <div class="kpi-label">Receita no mês</div>
            </mat-card>
          </div>

          @if (barChart().datasets[0].data.length > 0) {
            <mat-card style="padding: 24px">
              <h3 style="margin-top: 0">Crescimento mensal</h3>
              <canvas baseChart
                [data]="barChart()"
                [options]="barOptions"
                type="bar"
                style="max-height: 350px">
              </canvas>
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
    plugins: { legend: { position: 'top' } },
    scales: { y: { beginAtZero: true } },
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
            { data: monthly.map((d: any) => d.orders), label: 'Pedidos', backgroundColor: '#3f51b5' },
            { data: monthly.map((d: any) => d.revenue), label: 'Receita (R$)', backgroundColor: '#4caf50' },
          ],
        });
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
