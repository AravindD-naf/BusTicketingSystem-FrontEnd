import { Component, signal, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { HttpErrorHandlerService } from '../../core/services/http-error-handler.service';
import { LoginResponse, RegisterResponse } from '../../core/models/auth.model';
import { Navbar } from '../../components/navbar/navbar';
import { Footer } from '../../components/footer/footer';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Navbar, Footer],
  templateUrl: './auth.html',
  styleUrl: './auth.css'
})
export class Auth implements OnInit, OnDestroy {
  private route      = inject(ActivatedRoute);
  private router     = inject(Router);
  private fb         = inject(FormBuilder);
  private auth       = inject(AuthService);
  private errHandler = inject(HttpErrorHandlerService);
  private destroy$   = new Subject<void>();
  private requestInFlight = false;

  activeTab   = signal<'login' | 'register'>('login');
  redirectUrl = signal<string | null>(null);
  loading     = signal(false);
  errorMsg    = signal<string | null>(null);

  loginForm: FormGroup = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  registerForm: FormGroup = this.fb.group({
    firstName:       ['', Validators.required],
    lastName:        ['', Validators.required],
    email:           ['', [Validators.required, Validators.email]],
    phone:           [''],
    password:        ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required],
  }, {
    validators: (g: FormGroup) =>
      g.get('password')?.value === g.get('confirmPassword')?.value ? null : { mismatch: true }
  });

  ngOnInit() {
    if (this.auth.isAuthenticated()) {
      const params = new URLSearchParams(window.location.search);
      const redirectUrl = params.get('redirectUrl');
      if (redirectUrl) {
        this.router.navigateByUrl(redirectUrl).catch(() => {});
      } else {
        const role = this.auth.user()?.role;
        this.router.navigate([role === 'Admin' ? '/admin' : '/']).catch(() => {});
      }
      return;
    }
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        if (params['tab'] === 'register') this.activeTab.set('register');
        else if (params['tab'] === 'login') this.activeTab.set('login');
        this.redirectUrl.set(params['redirectUrl'] ?? null);
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setTab(tab: 'login' | 'register') {
    this.activeTab.set(tab);
    this.errorMsg.set(null);
  }

  onLogin() {
    if (this.loginForm.invalid) { this.loginForm.markAllAsTouched(); return; }
    if (this.requestInFlight) return;
    this.requestInFlight = true;
    this.loading.set(true);
    this.errorMsg.set(null);
    this.auth.login(this.loginForm.value).subscribe({
      next: (resp: LoginResponse) => {
        this.requestInFlight = false;
        this.loading.set(false);
        this.auth.completeAuthFromResponse(resp, this.redirectUrl() ?? undefined);
      },
      error: (err) => {
        this.requestInFlight = false;
        this.loading.set(false);
        this.errorMsg.set(this.errHandler.getErrorMessage(err));
      }
    });
  }

  onRegister() {
    if (this.registerForm.invalid) { this.registerForm.markAllAsTouched(); return; }
    if (this.requestInFlight) return;
    this.requestInFlight = true;
    this.loading.set(true);
    this.errorMsg.set(null);
    const { firstName, lastName, email, phone, password } = this.registerForm.value;
    const payload = {
      fullName:    `${firstName ?? ''} ${lastName ?? ''}`.trim(),
      email,
      phoneNumber: phone || '',
      password
    };
    this.auth.register(payload).subscribe({
      next: (resp: RegisterResponse) => {
        this.requestInFlight = false;
        this.loading.set(false);
        this.auth.completeAuthFromResponse(resp, this.redirectUrl() ?? undefined);
      },
      error: (err) => {
        this.requestInFlight = false;
        this.loading.set(false);
        this.errorMsg.set(this.errHandler.getErrorMessage(err));
      }
    });
  }
}
