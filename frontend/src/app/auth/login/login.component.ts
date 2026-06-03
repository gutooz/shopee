import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../shared/services/auth.service';
import { NotificationToastService } from '../../shared/services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header>
          <mat-card-title>SupplierHub</mat-card-title>
          <mat-card-subtitle>Faça login para continuar</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput formControlName="email" type="email" autocomplete="email">
              <mat-icon matSuffix>email</mat-icon>
              @if (form.get('email')?.hasError('required')) {
                <mat-error>Email obrigatório</mat-error>
              }
              @if (form.get('email')?.hasError('email')) {
                <mat-error>Email inválido</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Senha</mat-label>
              <input matInput formControlName="password" [type]="hidePassword ? 'password' : 'text'" autocomplete="current-password">
              <button type="button" mat-icon-button matSuffix (click)="hidePassword = !hidePassword">
                <mat-icon>{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (form.get('password')?.hasError('required')) {
                <mat-error>Senha obrigatória</mat-error>
              }
            </mat-form-field>

            <button
              mat-raised-button
              color="primary"
              type="submit"
              class="full-width"
              [disabled]="loading || form.invalid"
            >
              @if (loading) {
                <mat-spinner diameter="20" style="display: inline-block; margin-right: 8px"></mat-spinner>
              }
              Entrar
            </button>
          </form>
        </mat-card-content>

        <mat-card-actions>
          <a routerLink="/auth/register">Não tem conta? Cadastre-se</a>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #3f51b5 0%, #5c6bc0 100%);
    }
    .login-card {
      width: 100%;
      max-width: 420px;
      padding: 24px;
    }
    mat-card-header { margin-bottom: 16px; }
    mat-card-title { font-size: 1.8rem !important; color: #3f51b5; }
    form { display: flex; flex-direction: column; gap: 12px; margin-top: 16px; }
    mat-card-actions { padding: 8px 16px; text-align: center; }
    mat-card-actions a { color: #3f51b5; text-decoration: none; }
  `],
})
export class LoginComponent {
  form: FormGroup;
  loading = false;
  hidePassword = true;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private toast: NotificationToastService,
    private router: Router,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;

    this.auth.login(this.form.value).subscribe({
      next: resp => {
        const role = resp.user.role;
        this.router.navigate([role === 'admin' ? '/admin/dashboard' : '/dashboard']);
      },
      error: err => {
        this.toast.error(err.error?.detail ?? 'Credenciais inválidas');
        this.loading = false;
      },
    });
  }
}
