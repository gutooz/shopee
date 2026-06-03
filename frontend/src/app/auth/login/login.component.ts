import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../shared/services/auth.service';
import { NotificationToastService } from '../../shared/services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatIconModule],
  template: `
    <div class="auth-root">
      <div class="auth-box">

        <div class="auth-header">
          <h1>SupplierHub</h1>
          <p>Entre na sua conta para continuar</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" class="auth-form">

          <div class="field">
            <label>Email</label>
            <input
              formControlName="email"
              type="email"
              autocomplete="email"
              placeholder="voce@email.com"
              [class.invalid]="f['email'].invalid && f['email'].touched"
            >
            @if (f['email'].touched && f['email'].hasError('required')) {
              <span class="error">Email obrigatório</span>
            }
            @if (f['email'].touched && f['email'].hasError('email')) {
              <span class="error">Email inválido</span>
            }
          </div>

          <div class="field">
            <label>Senha</label>
            <div class="input-wrap" [class.invalid]="f['password'].invalid && f['password'].touched">
              <input
                formControlName="password"
                [type]="show ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="••••••••"
              >
              <button type="button" class="eye-btn" (click)="show = !show" tabindex="-1">
                <mat-icon>{{ show ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
            </div>
            @if (f['password'].touched && f['password'].hasError('required')) {
              <span class="error">Senha obrigatória</span>
            }
          </div>

          <button type="submit" class="btn-submit" [disabled]="loading || form.invalid">
            <span>{{ loading ? 'Entrando…' : 'Entrar' }}</span>
            @if (!loading) {
              <mat-icon>arrow_forward</mat-icon>
            }
          </button>

        </form>

        <p class="auth-link">Não tem conta? <a routerLink="/auth/register">Criar conta</a></p>

      </div>
    </div>
  `,
  styles: [`
    .auth-root {
      min-height: 100vh;
      background: var(--base);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }

    .auth-box {
      width: 100%;
      max-width: 360px;
    }

    .auth-header {
      margin-bottom: 32px;

      h1 {
        font-size: 1.125rem;
        font-weight: 700;
        color: var(--fg);
        margin: 0 0 6px;
        letter-spacing: -0.01em;
      }
      p {
        font-size: 0.875rem;
        color: var(--fg-2);
        margin: 0;
      }
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 6px;

      label {
        font-size: 0.8rem;
        font-weight: 500;
        color: var(--fg-2);
      }

      input {
        width: 100%;
        padding: 10px 12px;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        color: var(--fg);
        font-size: 0.875rem;
        font-family: inherit;
        outline: none;
        transition: border-color 0.15s;

        &::placeholder { color: var(--fg-3); }

        &:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-ring);
        }

        &.invalid {
          border-color: var(--danger);
          &:focus { box-shadow: 0 0 0 3px rgba(239,68,68,0.2); }
        }
      }
    }

    .input-wrap {
      display: flex;
      align-items: center;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      transition: border-color 0.15s;
      overflow: hidden;

      &:focus-within {
        border-color: var(--accent);
        box-shadow: 0 0 0 3px var(--accent-ring);
      }
      &.invalid {
        border-color: var(--danger);
        &:focus-within { box-shadow: 0 0 0 3px rgba(239,68,68,0.2); }
      }

      input {
        flex: 1;
        padding: 10px 12px;
        background: none;
        border: none;
        color: var(--fg);
        font-size: 0.875rem;
        font-family: inherit;
        outline: none;
        &::placeholder { color: var(--fg-3); }
      }
    }

    .eye-btn {
      background: none;
      border: none;
      padding: 0 10px;
      cursor: pointer;
      color: var(--fg-3);
      display: flex;
      align-items: center;
      transition: color 0.12s;
      &:hover { color: var(--fg-2); }
      mat-icon { font-size: 16px !important; width: 16px !important; height: 16px !important; }
    }

    .error {
      font-size: 0.75rem;
      color: var(--danger);
    }

    .btn-submit {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      width: 100%;
      padding: 10px 16px;
      background: var(--accent);
      border: none;
      border-radius: var(--radius);
      color: #fff;
      font-size: 0.875rem;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      transition: background 0.15s, opacity 0.15s;
      margin-top: 4px;

      mat-icon { font-size: 16px !important; width: 16px !important; height: 16px !important; }

      &:hover:not([disabled]) { background: #EA6C0A; }
      &[disabled] { opacity: 0.45; cursor: not-allowed; }
    }

    .auth-link {
      margin: 20px 0 0;
      font-size: 0.8rem;
      color: var(--fg-2);
      text-align: center;

      a {
        color: var(--fg);
        font-weight: 600;
        text-decoration: none;
        border-bottom: 1px solid var(--border);
        padding-bottom: 1px;
        transition: border-color 0.12s;
        &:hover { border-color: var(--fg-2); }
      }
    }
  `],
})
export class LoginComponent {
  form: FormGroup;
  loading = false;
  show = false;

  get f() { return this.form.controls; }

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private toast: NotificationToastService,
    private router: Router,
  ) {
    this.form = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.auth.login(this.form.value).subscribe({
      next: r => this.router.navigate([r.user.role === 'admin' ? '/admin/dashboard' : '/dashboard']),
      error: e => { this.toast.error(e.error?.detail ?? 'Credenciais inválidas'); this.loading = false; },
    });
  }
}
