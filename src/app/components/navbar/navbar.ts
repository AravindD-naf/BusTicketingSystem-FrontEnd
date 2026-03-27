import { CommonModule } from '@angular/common';
import { Component, signal, HostListener, inject, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { WalletService } from '../../core/services/wallet.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit {
  auth          = inject(AuthService);
  walletService = inject(WalletService);
  private router = inject(Router);
  mobileOpen = signal(false);
  scrolled   = signal(false);

  ngOnInit() {
    if (this.auth.isAuthenticated()) {
      this.walletService.loadWallet();
    }
  }

  @HostListener('window:scroll')
  onScroll() { this.scrolled.set(window.scrollY > 20); }

  toggleMobile() { this.mobileOpen.update(v => !v); }
 
  goToSearch() {
    // Try to restore last search from sessionStorage
    const raw = sessionStorage.getItem('last_search');
    if (raw) {
      try {
        const ctx = JSON.parse(raw);
        if (ctx.from && ctx.to && ctx.date) {
          this.router.navigate(['/results'], {
            queryParams: {
              from:       ctx.from,
              to:         ctx.to,
              date:       ctx.date,
              passengers: ctx.passengers ?? 1
            }
          });
          return;
        }
      } catch { /* ignore parse errors */ }
    }

    // No saved search — go to home where the search form is
    this.router.navigate(['/']);
  }

  logout() {
    localStorage.removeItem('bg_token');
    localStorage.removeItem('bg_expiry');
    this.auth.logout(true);
  }

  getInitials(): string {
    const user = this.auth.user();
    if (!user) return '?';
    const name = user.name || user.email || '';
    const parts = name.split(/[\s@.]+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return (parts[0]?.[0] || '?').toUpperCase();
  }

  goToAdmin() { this.router.navigate(['/admin']); }
}
