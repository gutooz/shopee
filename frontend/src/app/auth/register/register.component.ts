import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../shared/services/auth.service';
import { NotificationToastService } from '../../shared/services/notification.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="register-container">
      <mat-card class="register-card">
        <mat-card-header>
          <mat-card-title>Criar Conta</mat-card-title>
          <mat-card-subtitle>SupplierHub — Conecte-se aos seus fornecedores</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Nome</mat-label>
              <input matInput formControlName="name">
              @if (form.get('name')?.hasError('required')) {
                <mat-error>Nome obrigatório</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput formControlName="email" type="email">
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Senha</mat-label>
              <input matInput formControlName="password" type="password">
              @if (form.get('password')?.hasError('minlength')) {
                <mat-error>Mínimo 8 caracteres</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Tipo de conta</mat-label>
              <mat-select formControlName="role">
                <mat-option value="seller">Vendedor (Seller)</mat-option>
                <mat-option value="supplier">Fornecedor (Supplier)</mat-option>
              </mat-select>
            </mat-form-field>

            <button
              mat-raised-button
              color="primary"
              type="submit"
              class="full-width"
              [disabled]="loading || form.invalid"
            >
              @if (loading) {
                <mat-spinner diameter="20" style="display:inline-block; margin-right:8px"></mat-spinner>
              }
              Criar Conta
            </button>
          </form>
        </mat-card-content>

        <mat-card-actions>
          <a routerLink="/auth/login">Já tem conta? Entrar</a>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .register-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #3f51b5 0%, #5c6bc0 100%);
    }
    .register-card { width: 100%; max-width: 440px; padding: 24px; }
    form { display: flex; flex-direction: column; gap: 12px; margin-top: 16px; }
    mat-card-actions { padding: 8px 16px; text-align: center; }
    mat-card-actions a { color: #3f51b5; text-decoration: none; }
  `],
})
export class RegisterComponent {
  form: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private toast: NotificationToastService,
    private router: Router,
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      role: ['seller', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;

    this.auth.register(this.form.value).subscribe({
      next: () => {
        this.toast.success('Conta criada com sucesso!');
        this.router.navigate(['/dashboard']);
      },
      error: err => {
        this.toast.error(err.error?.detail ?? 'Erro ao criar conta');
        this.loading = false;
      },
    });
  }
}
