import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ShellComponent } from '../shared/components/shell.component';
import { ApiService } from '../shared/services/api.service';
import { NotificationToastService } from '../shared/services/notification.service';

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, ShellComponent,
    MatCardModule, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatProgressSpinnerModule, MatPaginatorModule,
  ],
  template: `
    <app-shell>
      <div class="page-container">

        <div class="page-header">
          <h1>Produtos</h1>
          <button mat-raised-button color="primary" (click)="openForm()">
            <mat-icon>add</mat-icon> Novo Produto
          </button>
        </div>

        @if (showForm()) {
          <div class="form-panel">
            <h3>{{ editingId() ? 'Editar' : 'Novo' }} Produto</h3>
            <form [formGroup]="form" (ngSubmit)="save()">
              <div class="form-grid">
                <mat-form-field appearance="outline" class="span-full">
                  <mat-label>Nome *</mat-label>
                  <input matInput formControlName="name">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Fornecedor *</mat-label>
                  <mat-select formControlName="supplier_id">
                    @for (s of suppliers(); track s.id) {
                      <mat-option [value]="s.id">{{ s.name }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>SKU</mat-label>
                  <input matInput formControlName="sku">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Preço *</mat-label>
                  <input matInput formControlName="price" type="number" step="0.01">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>ID Shopee</mat-label>
                  <input matInput formControlName="shopee_product_id">
                </mat-form-field>
              </div>
              <div class="form-actions">
                <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || saving()">
                  <mat-icon>save</mat-icon> Salvar
                </button>
                <button mat-stroked-button type="button" (click)="cancelForm()">Cancelar</button>
              </div>
            </form>
          </div>
        }

        <div class="section-card">
          @if (loading()) {
            <div class="loader"><div class="spin"></div></div>
          } @else {
            <table mat-table [dataSource]="products()">
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Nome</th>
                <td mat-cell *matCellDef="let p">{{ p.name }}</td>
              </ng-container>
              <ng-container matColumnDef="sku">
                <th mat-header-cell *matHeaderCellDef>SKU</th>
                <td mat-cell *matCellDef="let p">
                  @if (p.sku) { <code class="mono">{{ p.sku }}</code> }
                  @else       { <span class="cell-muted">—</span>     }
                </td>
              </ng-container>
              <ng-container matColumnDef="price">
                <th mat-header-cell *matHeaderCellDef>Preço</th>
                <td mat-cell *matCellDef="let p"><span class="cell-price">{{ p.price | currency:'BRL':'symbol':'1.2-2' }}</span></td>
              </ng-container>
              <ng-container matColumnDef="active">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let p">
                  <span class="status-badge" [class]="p.active ? 'shipped' : 'cancelled'">
                    {{ p.active ? 'Ativo' : 'Inativo' }}
                  </span>
                </td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Ações</th>
                <td mat-cell *matCellDef="let p">
                  <button mat-icon-button (click)="edit(p)" title="Editar">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="delete(p.id)" title="Excluir">
                    <mat-icon>delete</mat-icon>
                  </button>
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
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .span-full  { grid-column: 1 / -1; }
    .form-actions { display: flex; gap: 8px; margin-top: 6px; }
    .loader { display: flex; align-items: center; justify-content: center; padding: 56px; }
    .spin   { width: 28px; height: 28px; border-radius: 50%; border: 2px solid var(--border); border-top-color: var(--accent); animation: s 0.75s linear infinite; }
    @keyframes s { to { transform: rotate(360deg); } }
    .cell-primary { font-weight: 500; }
    .cell-dim     { color: var(--fg-2); font-size: 0.875rem; }
    .cell-muted   { color: var(--fg-3); }
    .cell-price   { font-weight: 600; color: var(--accent); font-variant-numeric: tabular-nums; }
    .mono {
      font-family: ui-monospace, 'Cascadia Code', monospace;
      font-size: 0.78rem; background: var(--elevated); border: 1px solid var(--border);
      border-radius: 5px; padding: 2px 7px; color: var(--fg-2);
    }
  `],
})
export class ProductsListComponent implements OnInit {
  columns = ['name', 'sku', 'price', 'active', 'actions'];
  products = signal<any[]>([]);
  suppliers = signal<any[]>([]);
  total    = signal(0);
  loading  = signal(true);
  saving   = signal(false);
  showForm = signal(false);
  editingId = signal<string | null>(null);
  pageSize = 20;
  page = 1;

  form: FormGroup;

  constructor(private api: ApiService, private toast: NotificationToastService, private fb: FormBuilder) {
    this.form = this.fb.group({
      name:              ['', [Validators.required]],
      supplier_id:       ['', Validators.required],
      sku:               [''],
      price:             [0, [Validators.required, Validators.min(0)]],
      shopee_product_id: [''],
    });
  }

  ngOnInit(): void {
    this.load();
    this.api.getSuppliers(1, 100).subscribe({ next: d => this.suppliers.set(d.items) });
  }

  load(): void {
    this.loading.set(true);
    this.api.getProducts(this.page, this.pageSize).subscribe({
      next: data => { this.products.set(data.items); this.total.set(data.total); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openForm(): void { this.editingId.set(null); this.form.reset({ price: 0 }); this.showForm.set(true); }
  edit(p: any): void { this.editingId.set(p.id); this.form.patchValue(p); this.showForm.set(true); }
  cancelForm(): void { this.showForm.set(false); this.editingId.set(null); this.form.reset(); }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const id = this.editingId();
    const obs = id ? this.api.updateProduct(id, this.form.value) : this.api.createProduct(this.form.value);
    obs.subscribe({
      next: () => { this.toast.success('Produto salvo!'); this.cancelForm(); this.load(); this.saving.set(false); },
      error: err => { this.toast.error(err.error?.detail ?? 'Erro'); this.saving.set(false); },
    });
  }

  delete(id: string): void {
    if (!confirm('Excluir produto?')) return;
    this.api.deleteProduct(id).subscribe({ next: () => { this.toast.success('Excluído'); this.load(); } });
  }

  onPage(e: PageEvent): void { this.page = e.pageIndex + 1; this.load(); }
}
