import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ShellComponent } from '../shared/components/shell.component';
import { ApiService } from '../shared/services/api.service';
import { NotificationToastService } from '../shared/services/notification.service';
import { Supplier } from '../shared/models/supplier.model';

@Component({
  selector: 'app-suppliers-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ShellComponent,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatSlideToggleModule,
  ],
  template: `
    <app-shell>
      <div class="page-container">
        <div class="page-header">
          <h1>Fornecedores</h1>
          <button mat-raised-button color="primary" (click)="openForm()">
            <mat-icon>add</mat-icon> Novo Fornecedor
          </button>
        </div>

        @if (showForm()) {
          <mat-card style="margin-bottom: 24px; padding: 24px">
            <h3 style="margin-top: 0">{{ editingId() ? 'Editar' : 'Novo' }} Fornecedor</h3>
            <form [formGroup]="form" (ngSubmit)="save()">
              <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 16px">
                <mat-form-field appearance="outline">
                  <mat-label>Nome *</mat-label>
                  <input matInput formControlName="name">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Email</mat-label>
                  <input matInput formControlName="email" type="email">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Telefone</mat-label>
                  <input matInput formControlName="phone">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>WhatsApp</mat-label>
                  <input matInput formControlName="whatsapp_number" placeholder="5511999999999">
                </mat-form-field>
                <mat-form-field appearance="outline" style="grid-column: 1 / -1">
                  <mat-label>Endereço</mat-label>
                  <input matInput formControlName="address">
                </mat-form-field>
              </div>
              <div style="display:flex; gap: 8px; margin-top: 8px">
                <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || saving()">
                  Salvar
                </button>
                <button mat-stroked-button type="button" (click)="cancelForm()">Cancelar</button>
              </div>
            </form>
          </mat-card>
        }

        <mat-card>
          @if (loading()) {
            <div style="padding: 40px; text-align: center"><mat-spinner diameter="40"></mat-spinner></div>
          } @else {
            <table mat-table [dataSource]="suppliers()">
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Nome</th>
                <td mat-cell *matCellDef="let s">{{ s.name }}</td>
              </ng-container>
              <ng-container matColumnDef="email">
                <th mat-header-cell *matHeaderCellDef>Email</th>
                <td mat-cell *matCellDef="let s">{{ s.email ?? '—' }}</td>
              </ng-container>
              <ng-container matColumnDef="phone">
                <th mat-header-cell *matHeaderCellDef>Telefone</th>
                <td mat-cell *matCellDef="let s">{{ s.phone ?? '—' }}</td>
              </ng-container>
              <ng-container matColumnDef="active">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let s">
                  <span class="status-badge" [class]="s.active ? 'shipped' : 'cancelled'">
                    {{ s.active ? 'Ativo' : 'Inativo' }}
                  </span>
                </td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Ações</th>
                <td mat-cell *matCellDef="let s">
                  <button mat-icon-button (click)="edit(s)"><mat-icon>edit</mat-icon></button>
                  <button mat-icon-button color="warn" (click)="delete(s.id)"><mat-icon>delete</mat-icon></button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="columns"></tr>
              <tr mat-row *matRowDef="let row; columns: columns"></tr>
            </table>
            <mat-paginator
              [length]="total()"
              [pageSize]="pageSize"
              (page)="onPage($event)"
            ></mat-paginator>
          }
        </mat-card>
      </div>
    </app-shell>
  `,
})
export class SuppliersListComponent implements OnInit {
  columns = ['name', 'email', 'phone', 'active', 'actions'];
  suppliers = signal<Supplier[]>([]);
  total = signal(0);
  loading = signal(true);
  saving = signal(false);
  showForm = signal(false);
  editingId = signal<string | null>(null);
  pageSize = 20;
  page = 1;

  form: FormGroup;

  constructor(
    private api: ApiService,
    private toast: NotificationToastService,
    private fb: FormBuilder,
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: [''],
      phone: [''],
      address: [''],
      whatsapp_number: [''],
    });
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.getSuppliers(this.page, this.pageSize).subscribe({
      next: data => {
        this.suppliers.set(data.items);
        this.total.set(data.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openForm(): void {
    this.editingId.set(null);
    this.form.reset();
    this.showForm.set(true);
  }

  edit(supplier: Supplier): void {
    this.editingId.set(supplier.id);
    this.form.patchValue(supplier);
    this.showForm.set(true);
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
    this.form.reset();
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const id = this.editingId();
    const obs = id
      ? this.api.updateSupplier(id, this.form.value)
      : this.api.createSupplier(this.form.value);

    obs.subscribe({
      next: () => {
        this.toast.success(id ? 'Fornecedor atualizado!' : 'Fornecedor criado!');
        this.cancelForm();
        this.load();
        this.saving.set(false);
      },
      error: err => {
        this.toast.error(err.error?.detail ?? 'Erro ao salvar');
        this.saving.set(false);
      },
    });
  }

  delete(id: string): void {
    if (!confirm('Excluir este fornecedor?')) return;
    this.api.deleteSupplier(id).subscribe({
      next: () => {
        this.toast.success('Fornecedor excluído');
        this.load();
      },
      error: err => this.toast.error(err.error?.detail ?? 'Erro ao excluir'),
    });
  }

  onPage(event: PageEvent): void {
    this.page = event.pageIndex + 1;
    this.load();
  }
}
