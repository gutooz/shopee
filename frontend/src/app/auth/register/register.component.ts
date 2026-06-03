import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../shared/services/auth.service';
import { NotificationToastService } from '../../shared/services/notification.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatIconModule],
  template: `
    <div class="auth-root">
      <div class="auth-box">

        <div class="auth-header">
          <h1>SupplierHub</h1>
          <p>Crie sua conta para começar</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" class="auth-form">

          <div class="field">
            <label>Nome</label>
            <input formControlName="name" type="text" placeholder="Seu nome"
              [class.invalid]="f['name'].invalid && f['name'].touched">
            @if (f['name'].touched && f['name'].hasError('required')) {
              <span class="error">Nome obrigatório</span>
            }
          </div>

          <div class="field">
            <label>Email</label>
            <input formControlName="email" type="email" autocomplete="email" placeholder="voce@email.com"
              [class.invalid]="f['email'].invalid && f['email'].touched">
          </div>

          <div class="field">
            <label>Senha</label>
            <div class="input-wrap" [class.invalid]="f['password'].invalid && f['password'].touched">
              <input formControlName="password" [type]="show ? 'text' : 'password'" placeholder="Mínimo 8 caracteres">
              <button type="button" class="eye-btn" (click)="show = !show" tabindex="-1">
                <mat-icon>{{ show ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
            </div>
            @if (f['password'].touched && f['password'].hasError('minlength')) {
              <span class="error">Mínimo 8 caracteres</span>
            }
          </div>

          <div class="field">
            <label>Tipo de conta</label>
            <div class="role-row">
              @for (opt of roles; track opt.value) {
                <button type="button" class="role-opt" [class.active]="form.get('role')?.value === opt.value"
                  (click)="form.get('role')?.setValue(opt.value)">
                  <mat-icon>{{ opt.icon }}</mat-icon>
                  {{ opt.label }}
                </button>
              }
            </div>
          </div>

          <button type="submit" class="btn-submit" [disabled]="loading || form.invalid">
            <span>{{ loading ? 'Criando…' : 'Criar conta' }}</span>
            @if (!loading) { <mat-icon>arrow_forward</mat-icon> }
          </button>

        </form>

        <p class="auth-link">Já tem conta? <a routerLink="/auth/login">Entrar</a></p>
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
    .auth-box { width: 100%; max-width: 360px; }

    .auth-header {
      margin-bottom: 28px;
      h1 { font-size: 1.125rem; font-weight: 700; color: var(--fg); margin: 0 0 5px; letter-spacing: -0.01em; }
      p  { font-size: 0.875rem; color: var(--fg-2); margin: 0; }
    }

    .auth-form { display: flex; flex-direction: column; gap: 14px; }

    .field {
      display: flex; flex-direction: column; gap: 6px;
      label { font-size: 0.8rem; font-weight: 500; color: var(--fg-2); }
      input {
        width: 100%; padding: 10px 12px;
        background: var(--surface); border: 1px solid var(--border);
        border-radius: var(--radius); color: var(--fg);
        font-size: 0.875rem; font-family: inherit; outline: none;
        transition: border-color 0.15s;
        &::placeholder { color: var(--fg-3); }
        &:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-ring); }
        &.invalid { border-color: var(--danger); }
      }
    }

    .input-wrap {
      display: flex; align-items: center; background: var(--surface);
      border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; transition: border-color 0.15s;
      &:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-ring); }
      &.invalid { border-color: var(--danger); }
      input { flex: 1; padding: 10px 12px; background: none; border: none; color: var(--fg); font-size: 0.875rem; font-family: inherit; outline: none; &::placeholder { color: var(--fg-3); } }
    }

    .eye-btn {
      background: none; border: none; padding: 0 10px; cursor: pointer; color: var(--fg-3);
      display: flex; align-items: center; transition: color 0.12s;
      &:hover { color: var(--fg-2); }
      mat-icon { font-size: 16px !important; width: 16px !important; height: 16px !important; }
    }
    .error { font-size: 0.75rem; color: var(--danger); }

    .role-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .role-opt {
      display: flex; align-items: center; justify-content: center; gap: 7px;
      padding: 9px 12px; background: var(--surface); border: 1px solid var(--border);
      border-radius: var(--radius); cursor: pointer; color: var(--fg-2);
      font-size: 0.8rem; font-weight: 500; font-family: inherit;
      transition: all 0.15s;
      mat-icon { font-size: 15px !important; width: 15px !important; height: 15px !important; }
      &:hover { color: var(--fg); border-color: var(--fg-3); background: rgba(255,255,255,0.04); }
      &.active { color: var(--accent); border-color: var(--accent); background: var(--accent-dim); }
    }

    .btn-submit {
      display: flex; align-items: center; justify-content: center; gap: 7px;
      width: 100%; padding: 10px 16px; margin-top: 4px;
      background: var(--accent); border: none; border-radius: var(--radius);
      color: #fff; font-size: 0.875rem; font-weight: 600; font-family: inherit;
      cursor: pointer; transition: background 0.15s, opacity 0.15s;
      mat-icon { font-size: 16px !important; width: 16px !important; height: 16px !important; }
      &:hover:not([disabled]) { background: #EA6C0A; }
      &[disabled] { opacity: 0.45; cursor: not-allowed; }
    }

    .auth-link {
      margin: 18px 0 0; font-size: 0.8rem; color: var(--fg-2); text-align: center;
      a { color: var(--fg); font-weight: 600; text-decoration: none; border-bottom: 1px solid var(--border); padding-bottom: 1px; transition: border-color 0.12s; &:hover { border-color: var(--fg-2); } }
    }
  `],
})
export class RegisterComponent {
  form: FormGroup;
  loading = false;
  show = false;
  get f() { return this.form.controls; }

  roles = [
    { value: 'seller',   icon: 'storefront',    label: 'Vendedor' },
    { value: 'supplier', icon: 'local_shipping', label: 'Fornecedor' },
  ];

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private toast: NotificationToastService,
    private router: Router,
  ) {
    this.form = this.fb.group({
      name:     ['', [Validators.required, Validators.minLength(2)]],
      email:    ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      role:     ['seller', Validators.required],
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.auth.register(this.form.value).subscribe({
      next: () => { this.toast.success('Conta criada!'); this.router.navigate(['/dashboard']); },
      error: e => { this.toast.error(e.error?.detail ?? 'Erro ao criar conta'); this.loading = false; },
    });
  }
}
